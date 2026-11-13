import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { buildCompoundSchedule, validateCompoundInputs, parseCompoundField, avgDailyGainPct } from './App';

// Supabase is mocked at the boundary; `upsert` is a spy so tests can prove the
// calculator never writes withdrawals (AC-14).
jest.mock('./supabaseClient', () => {
  const upsert = jest.fn();
  const settingsRow = {
    user_id: 'u1', starting_balance: 20, risk_percent: 5, trade_style: 1,
    sessions_per_day: 2, broker_min: 10, milestones: [{ mul: 2, pct: 20 }],
    api_keys: {}, setup_complete: true, created_at: new Date().toISOString(), extra: { startingBalanceDemo: 20, startingBalanceReal: 50 },
  };
  const thenable = (result, table) => {
    const c = {
      select: () => c, eq: () => c, order: () => c, in: () => c, insert: () => c, delete: () => c,
      upsert: (...a) => { upsert(table, ...a); return c; },
      maybeSingle: () => Promise.resolve({ data: settingsRow, error: null }),
      then: (res, rej) => Promise.resolve(result).then(res, rej),
    };
    return c;
  };
  return {
    supabase: {
      __upsert: upsert,
      auth: {
        getSession: () => Promise.resolve({ data: { session: { user: { id: 'u1' } } } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
        signOut: () => Promise.resolve({}),
      },
      from: (table) => thenable({ data: [], error: null }, table),
      storage: { from: () => ({ createSignedUrl: () => Promise.resolve({ data: { signedUrl: 'x' }, error: null }) }) },
    },
    isSupabaseConfigured: true,
  };
});

const base = { capital: 100, gainPct: 2, days: 30, wdPct: 50, wdFrom: 'Profit', wdFreq: 'Monthly', dpw: 7, dpm: 30 };
const last = (r) => r[r.length - 1];

describe('buildCompoundSchedule', () => {
  test('monthly reference case matches the sheet', () => {
    const r = last(buildCompoundSchedule(base));
    expect(r.withdrawal).toBeCloseTo(40.57, 2);
    expect(r.end).toBeCloseTo(140.57, 2);
  });
  test('no withdrawals gives 181.14', () => {
    expect(last(buildCompoundSchedule({ ...base, wdFreq: 'None' })).end).toBeCloseTo(181.14, 2);
  });
  test('weekly profit base', () => {
    const r = buildCompoundSchedule({ ...base, wdFreq: 'Weekly' });
    expect(r[6].withdrawal).toBeCloseTo(7.43, 2);
    expect(r[13].end).toBeCloseTo(115.42, 2);
  });
  test('daily from balance', () => {
    const r = buildCompoundSchedule({ ...base, wdFreq: 'Daily', wdFrom: 'Balance', days: 3 });
    expect(r.map((x) => +x.end.toFixed(2))).toEqual([51, 26.01, 13.27]);
  });
  test('period shorter than cycle never withdraws', () => {
    const r = buildCompoundSchedule({ ...base, days: 20 });
    expect(last(r).withdrawn).toBe(0);
  });
  test('extremes stay finite and never negative', () => {
    [0, 100].forEach((wdPct) => {
      const r = buildCompoundSchedule({ ...base, capital: 1e9, gainPct: 100, days: 365, wdFreq: 'Daily', wdFrom: 'Balance', wdPct });
      expect(r).toHaveLength(365);
      r.forEach((x) => { expect(Number.isFinite(x.end)).toBe(true); expect(x.end).toBeGreaterThanOrEqual(0); });
    });
    expect(last(buildCompoundSchedule({ ...base, capital: 1e9, gainPct: 100, days: 365, wdFreq: 'None' })).end).toBeGreaterThan(1e15);
  });
});

describe('parsing and validation', () => {
  const ok = (k, t) => parseCompoundField(k, t).value;
  const bad = (k, t) => expect(parseCompoundField(k, t).error).toBeTruthy();
  test('accepts', () => {
    expect(ok('wdPct', '5%')).toBe(5);
    expect(ok('capital', '1,000')).toBe(1000);
    expect(ok('gain', '2.5')).toBe(2.5);
    expect(ok('currency', ' €')).toBe('€');
  });
  test('rejects', () => {
    bad('capital', '12abc'); bad('gain', '2,5'); bad('capital', '1e3'); bad('gain', '-5'); bad('gain', '   ');
    bad('gain', '0'); bad('gain', '101'); bad('days', '0'); bad('days', '366'); bad('days', '1.5');
    bad('currency', 'abcd'); bad('currency', '  ');
  });
  test('only visible fields are validated', () => {
    const raw = { currency: '$', capital: '100', gain: '2', days: '30', wdFreq: 'None', wdPct: 'junk', wdFrom: 'Profit', dpw: 'x', dpm: 'y' };
    expect(validateCompoundInputs(raw).ok).toBe(true);
    const w = validateCompoundInputs({ ...raw, wdFreq: 'Weekly' });
    expect(w.ok).toBe(false);
    expect(Object.keys(w.errors).sort()).toEqual(['dpw', 'wdPct']);
  });
});

describe('avgDailyGainPct', () => {
  const day = (date, pnl) => ({ date, outcome: pnl >= 0 ? 'WIN' : 'LOSS', pnl, accountMode: 'REAL' });
  test('null with no finished trades', () => {
    expect(avgDailyGainPct([{ date: '2026-01-01', outcome: 'PENDING', pnl: 0, accountMode: 'REAL' }], [], 'REAL', 100)).toBeNull();
  });
  test('geometric mean', () => {
    expect(avgDailyGainPct([day('2026-01-01', 2), day('2026-01-02', 4.08)], [], 'REAL', 100)).toBe(3);
    const t = [day('2026-01-01', 10), day('2026-01-02', -11)];
    expect(avgDailyGainPct(t, [], 'REAL', 100)).toBe(-0.5);
  });
});

// ── Capital tab (UI, through the full app shell) ────────────────────────────
describe('Capital tab', () => {
  jest.setTimeout(30000);
  const App = require('./App').default;
  const { supabase } = require('./supabaseClient');
  const KEY = (m) => `gm_compound_calc_${m}`;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear(); // the app remembers the last view here (gm_view)
    supabase.__upsert.mockClear();
    Element.prototype.scrollIntoView = jest.fn();
  });

  async function openCapital(real = false) {
    const user = userEvent; // user-event v13 has no setup(); its calls are synchronous
    const view = render(<App />);
    await screen.findAllByRole('button', { name: 'Capital' }, { timeout: 5000 });
    if (real) await user.click(screen.getAllByRole('button', { name: 'REAL' })[0]);
    // the app remembers the last view, so a re-render can already be on Capital
    if (!screen.queryByRole('heading', { name: 'Projection' })) await user.click(screen.getAllByRole('button', { name: 'Capital' })[0]);
    await screen.findByRole('heading', { name: 'Projection' });
    return { user, view };
  }
  const field = (name) => screen.getByLabelText(name);
  const type = async (user, name, text) => { const el = field(name); await user.clear(el); if (text) await user.type(el, text); };

  test('renames the tab to Capital and keeps sizer and milestones, with no growth projector (AC-1, AC-16, AC-19)', async () => {
    await openCapital();
    expect(screen.queryByText('Money mgmt')).toBeNull();
    expect(screen.getByRole('heading', { name: 'Position sizer' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Withdrawal milestones' })).toBeInTheDocument();
    expect(screen.queryByText('Growth projector')).toBeNull();
    expect(screen.getByText(/Milestones below reflect your Demo balance\. This is for practice only/)).toBeInTheDocument();
  });

  test('starts from the live balance and the 2% example when there is no history (AC-2, AC-8)', async () => {
    await openCapital();
    expect(field('Starting capital ($)')).toHaveValue('20.00');
    expect(field('Gain per day (%)')).toHaveValue('2');
    expect(screen.getByText('No trade history yet, using 2% as an example.')).toBeInTheDocument();
    expect(screen.getByText(/Projected balance, day 30/)).toBeInTheDocument();
    expect(screen.getByText('No withdrawals planned')).toBeInTheDocument();
  });

  test('recomputes the headline, tiles and withdrawal line as you edit (AC-2, AC-3, AC-4, AC-5)', async () => {
    const { user } = await openCapital();
    await type(user, 'Starting capital ($)', '100');
    await user.selectOptions(field('Frequency'), 'Monthly');
    expect(screen.getByText(/Projected balance, day 30/).nextSibling).toHaveTextContent('$140.57');
    expect(screen.getByText('Withdrawing 50% of profit, monthly')).toBeInTheDocument();
    expect(screen.getByText('1.81x the capital above, withdrawals included')).toBeInTheDocument();
    expect(screen.getByText('Total withdrawn').nextSibling).toHaveTextContent('$40.57');
    expect(screen.getByText('Total profit').nextSibling).toHaveTextContent('$81.14');
    expect(screen.getByText('Return on capital').nextSibling).toHaveTextContent('81.1%');
    await user.selectOptions(field('Frequency'), 'None');
    expect(screen.getByText(/Projected balance, day 30/).nextSibling).toHaveTextContent('$181.14');
  });

  test('shows only the day fields that apply to the chosen frequency (AC-6)', async () => {
    const { user } = await openCapital();
    expect(screen.queryByLabelText('Withdraw (%)')).toBeNull();
    await user.selectOptions(field('Frequency'), 'Weekly');
    expect(field('Days per week')).toBeInTheDocument();
    expect(screen.queryByLabelText('Days per month')).toBeNull();
    await user.selectOptions(field('Frequency'), 'Monthly');
    expect(field('Days per month')).toBeInTheDocument();
    expect(screen.queryByLabelText('Days per week')).toBeNull();
  });

  test('bad input marks the field, hides the results and never shows NaN (AC-7)', async () => {
    const { user } = await openCapital();
    await type(user, 'Gain per day (%)', 'abc');
    expect(field('Gain per day (%)')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Above 0, up to 100.')).toBeInTheDocument();
    expect(screen.getByText('Fix the marked field to see the projection.')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Daily schedule' })).toBeNull();
    expect(screen.queryByRole('img', { name: /Balance growth/ })).toBeNull();
    expect(document.body.textContent).not.toMatch(/NaN|Infinity/);
    expect(field('Period (days)')).toBeEnabled();
  });

  test('draws the chart with an accessible label and the schedule with its columns and marked rows (AC-10, AC-12)', async () => {
    const { user } = await openCapital();
    await type(user, 'Starting capital ($)', '100');
    await user.selectOptions(field('Frequency'), 'Weekly');
    expect(screen.getByRole('img', { name: /^Balance growth, day 1 to day 30, from \$102\.00 to / })).toBeInTheDocument();
    const box = screen.getByRole('region', { name: 'Daily schedule' });
    ['Day', 'Start', 'Profit', 'Withdrawal', 'End balance', 'Withdrawn so far'].forEach((h) => expect(within(box).getByRole('columnheader', { name: h })).toBeInTheDocument());
    expect(within(box).getAllByRole('row')).toHaveLength(31);
    expect(within(box).getAllByRole('row')[7]).toHaveTextContent('$7.43');
    expect(screen.getByText(/Projection only\. Assumes the same gain every day and no losing days/)).toBeInTheDocument();
  });

  test('says so when the period is shorter than the withdrawal cycle (AC-4)', async () => {
    const { user } = await openCapital();
    await user.selectOptions(field('Frequency'), 'Monthly');
    await type(user, 'Period (days)', '20');
    expect(screen.getByText('No withdrawal day falls within the period.')).toBeInTheDocument();
  });

  test('saves valid edits per mode and restores them after a reload (AC-9)', async () => {
    const { user, view } = await openCapital();
    await type(user, 'Starting capital ($)', '100');
    await type(user, 'Gain per day (%)', '3');
    expect(JSON.parse(localStorage.getItem(KEY('DEMO')))).toMatchObject({ capital: 100, gain: 3 });
    expect(localStorage.getItem(KEY('REAL'))).toBeNull();
    view.unmount();
    await openCapital();
    expect(field('Starting capital ($)')).toHaveValue('100');
    expect(field('Gain per day (%)')).toHaveValue('3');
  });

  test('does not save invalid typing and "Use my live numbers" clears both overrides (AC-9)', async () => {
    const { user } = await openCapital();
    await type(user, 'Starting capital ($)', 'abc');
    expect(localStorage.getItem(KEY('DEMO'))).toBeNull();
    expect(screen.queryByRole('button', { name: 'Use my live numbers' })).toBeNull();
    await type(user, 'Starting capital ($)', '100');
    await user.click(screen.getByRole('button', { name: 'Use my live numbers' }));
    expect(field('Starting capital ($)')).toHaveValue('20.00');
    expect(JSON.parse(localStorage.getItem(KEY('DEMO')))).not.toHaveProperty('capital');
    expect(screen.queryByRole('button', { name: 'Use my live numbers' })).toBeNull();
  });

  test('ignores junk in storage and still renders defaults (AC-9)', async () => {
    localStorage.setItem(KEY('DEMO'), '[1,2');
    await openCapital();
    expect(field('Starting capital ($)')).toHaveValue('20.00');
    expect(screen.getByText(/Projected balance, day 30/)).toBeInTheDocument();
  });

  test('falls back per field when saved values are invalid (AC-9)', async () => {
    localStorage.setItem(KEY('DEMO'), JSON.stringify({ capital: 'x', gain: -3, days: 9999, wdFreq: 'Hourly', currency: 5, wdFrom: 'Balance' }));
    await openCapital();
    expect(field('Starting capital ($)')).toHaveValue('20.00');
    expect(field('Gain per day (%)')).toHaveValue('2');
    expect(field('Period (days)')).toHaveValue('30');
    expect(field('Frequency')).toHaveValue('None');
  });

  test('keeps Demo and Real edits separate (AC-9)', async () => {
    localStorage.setItem(KEY('REAL'), JSON.stringify({ capital: 777 }));
    await openCapital();
    expect(field('Starting capital ($)')).toHaveValue('20.00');
  });

  test('planned withdrawals never write a withdrawal record or touch the log form (AC-14)', async () => {
    const { user } = await openCapital(true);
    const logButton = () => screen.getByRole('button', { name: 'Log withdrawal' });
    const before = logButton().disabled;
    supabase.__upsert.mockClear(); // switching to Real saves the active mode; only edits after this count
    await user.selectOptions(field('Frequency'), 'Daily');
    await type(user, 'Withdraw (%)', '40');
    expect(screen.getByText('Withdrawing 40% of profit, daily')).toBeInTheDocument();
    expect(supabase.__upsert).not.toHaveBeenCalled();
    expect(logButton().disabled).toBe(before);
    expect(screen.queryByText('Withdrawal history')).toBeNull();
  });

  test('jump bar lists the sections, hides Withdrawals in Demo, and scrolls to the chosen one (AC-17)', async () => {
    const { user } = await openCapital();
    const bar = screen.getByRole('navigation', { name: 'Capital sections' });
    expect(within(bar).getAllByRole('button').map((b) => b.textContent)).toEqual(['Projection', 'Sizer', 'Milestones']);
    await user.click(within(bar).getByRole('button', { name: 'Milestones' }));
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    expect(within(bar).getByRole('button', { name: 'Milestones' })).toHaveAttribute('aria-current', 'true');
    expect(within(bar).getByRole('button', { name: 'Projection' })).not.toHaveAttribute('aria-current');
  });

  test('Real mode adds the Withdrawals chip and the Log withdrawal section (AC-1, AC-17)', async () => {
    await openCapital(true);
    const bar = screen.getByRole('navigation', { name: 'Capital sections' });
    expect(within(bar).getByRole('button', { name: 'Withdrawals' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Log withdrawal' })).toBeInTheDocument();
    expect(screen.queryByText(/Milestones below reflect your Demo balance/)).toBeNull();
  });

  test('every calculator control has a label and is reachable by keyboard (AC-18)', async () => {
    const { user } = await openCapital();
    ['Currency symbol', 'Starting capital ($)', 'Gain per day (%)', 'Period (days)', 'Frequency'].forEach((n) => expect(field(n)).toBeInTheDocument());
    await user.click(field('Period (days)'));
    await user.tab();
    expect(field('Frequency')).toHaveFocus();
  });
});

// ── Review follow ups: spec critical scenarios and review findings ──────────
describe('CompoundCalculator component', () => {
  const { CompoundCalculator } = require('./App');
  const KEY = 'gm_compound_calc_REAL'; // these render with mode="REAL"
  const day = (date, pnl) => ({ date, outcome: pnl >= 0 ? 'WIN' : 'LOSS', pnl, accountMode: 'REAL' });
  const calc = (props = {}) => <CompoundCalculator mode="REAL" bal={0} startBal={0} trades={[]} wds={[]} {...props} />;
  const field = (name) => screen.getByLabelText(name);

  beforeEach(() => { localStorage.clear(); jest.restoreAllMocks(); });

  test('defaults follow late loading data until overridden (AC-8)', () => {
    const { rerender } = render(calc());
    expect(field('Starting capital ($)')).toHaveValue('100');
    expect(screen.getByText('Using 100 as an example.')).toBeInTheDocument();
    expect(field('Gain per day (%)')).toHaveValue('2');
    expect(screen.getByText('No trade history yet, using 2% as an example.')).toBeInTheDocument();
    rerender(calc({ bal: 50, startBal: 100, trades: [day('2026-01-01', 2), day('2026-01-02', 4.08)] }));
    expect(field('Starting capital ($)')).toHaveValue('50.00');
    expect(field('Gain per day (%)')).toHaveValue('3.00');
    expect(screen.queryByText(/using 2% as an example/)).toBeNull();
    expect(screen.queryByText('Using 100 as an example.')).toBeNull();
  });

  test('an average day of 0 or below starts the gain field empty with a message (AC-8)', () => {
    render(calc({ bal: 100, startBal: 100, trades: [day('2026-01-01', 10), day('2026-01-02', -11)] }));
    expect(field('Gain per day (%)')).toHaveValue('');
    expect(screen.getByText('Your average day is not above 0%, enter a gain to project.')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Fix the marked field to see the projection.');
  });

  test('an average day above 100 starts the gain field empty with a message (AC-8)', () => {
    render(calc({ bal: 100, startBal: 100, trades: [day('2026-01-01', 150)] }));
    expect(field('Gain per day (%)')).toHaveValue('');
    expect(screen.getByText('Your average day is above 100%, enter a gain.')).toBeInTheDocument();
  });

  test('a live balance above the cap shows the range error instead of clamping (AC-8)', () => {
    render(calc({ bal: 2e9, startBal: 100 }));
    expect(field('Starting capital ($)')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Above 0, up to 1,000,000,000.')).toBeInTheDocument();
  });

  test('big numbers switch to exponent form in the headline, multiple and return (AC-15)', () => {
    localStorage.setItem(KEY, JSON.stringify({ capital: 1e9, gain: 100, days: 365 }));
    render(calc());
    expect(screen.getByText(/Projected balance, day 365/).nextSibling).toHaveTextContent('$7.515e+118');
    expect(screen.getByText('7.515e+109x the capital above, withdrawals included')).toBeInTheDocument();
    expect(screen.getByText('Return on capital').nextSibling).toHaveTextContent('7.515e+111%');
  });

  test('a flat balance draws a line and one day draws a single dot (AC-10)', () => {
    localStorage.setItem(KEY, JSON.stringify({ capital: 100, gain: 100, days: 30, wdFreq: 'Daily', wdFrom: 'Balance', wdPct: 100 }));
    const { container, unmount } = render(calc());
    expect(container.querySelector('polyline')).not.toBeNull();
    expect(document.body.textContent).not.toMatch(/NaN|Infinity/);
    unmount();
    localStorage.setItem(KEY, JSON.stringify({ capital: 100, gain: 2, days: 1 }));
    const one = render(calc());
    expect(one.container.querySelector('polyline')).toBeNull();
    expect(one.container.querySelector('svg circle')).not.toBeNull();
  });

  test('chart labels the first and last values once each (AC-10)', () => {
    localStorage.setItem(KEY, JSON.stringify({ capital: 100, gain: 2, days: 30 }));
    const { container } = render(calc());
    const labels = [...container.querySelectorAll('svg text')].map((t) => t.textContent);
    expect(labels).toEqual(expect.arrayContaining(['Day 1', 'Day 30', '$102.00', '$181.14']));
    expect(new Set(labels).size).toBe(labels.length);
  });

  test('still works when storage refuses writes or reads (AC-9)', () => {
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    render(calc());
    expect(field('Starting capital ($)')).toHaveValue('100');
    userEvent.clear(field('Starting capital ($)'));
    userEvent.type(field('Starting capital ($)'), '200');
    expect(screen.getByText(/Projected balance, day 30/).nextSibling).toHaveTextContent('$');
    expect(field('Starting capital ($)')).toHaveValue('200');
  });

  test('uses the right keypad per field: text for the symbol, numeric for days, decimal for amounts (review)', () => {
    localStorage.setItem(KEY, JSON.stringify({ wdFreq: 'Weekly' }));
    render(calc());
    expect(field('Currency symbol')).toHaveAttribute('inputmode', 'text');
    expect(field('Period (days)')).toHaveAttribute('inputmode', 'numeric');
    expect(field('Days per week')).toHaveAttribute('inputmode', 'numeric');
    expect(field('Starting capital ($)')).toHaveAttribute('inputmode', 'decimal');
    expect(field('Gain per day (%)')).toHaveAttribute('inputmode', 'decimal');
  });

  test('the capital label keeps the chosen symbol while another field is invalid (review)', () => {
    localStorage.setItem(KEY, JSON.stringify({ currency: '€' }));
    render(calc());
    userEvent.clear(field('Period (days)'));
    userEvent.type(field('Period (days)'), 'abc');
    expect(screen.getByLabelText('Starting capital (€)')).toBeInTheDocument();
  });

  test('field errors are announced politely and fit one short line (review)', () => {
    render(calc());
    userEvent.clear(field('Gain per day (%)'));
    userEvent.type(field('Gain per day (%)'), '101');
    const err = screen.getByText('Above 0, up to 100.');
    expect(err).toHaveAttribute('aria-live', 'polite');
    expect(err.textContent.length).toBeLessThan(35);
  });

  test('example notes hide while you are typing over the example (review)', () => {
    render(calc());
    expect(screen.getByText('Using 100 as an example.')).toBeInTheDocument();
    userEvent.clear(field('Starting capital ($)'));
    userEvent.type(field('Starting capital ($)'), 'abc');
    expect(screen.queryByText('Using 100 as an example.')).toBeNull();
  });
});

describe('parseCompoundField and avgDailyGainPct extras', () => {
  const day = (date, pnl) => ({ date, outcome: pnl >= 0 ? 'WIN' : 'LOSS', pnl, accountMode: 'REAL' });
  test('accepts a space before the percent sign (review)', () => {
    expect(parseCompoundField('wdPct', '5 %').value).toBe(5);
  });
  test('drops a day whose opening balance is 0 (AC-8)', () => {
    expect(avgDailyGainPct([day('2026-01-01', 5)], [], 'REAL', 0)).toBeNull();
  });
  test('ignores pending trades and withdrawal only days (AC-8)', () => {
    const pending = { date: '2026-01-01', outcome: 'PENDING', pnl: 0, accountMode: 'REAL' };
    expect(avgDailyGainPct([pending], [{ date: '2026-01-02', amount: 50 }], 'REAL', 100)).toBeNull();
    // day 1 is a withdrawal only day (balance 100 to 50), day 2 gains 1 on 50 = 2%
    expect(avgDailyGainPct([day('2026-01-02', 1)], [{ date: '2026-01-01', amount: 50 }], 'REAL', 100)).toBe(2);
  });
  test('an account wiped out in a day averages -100 instead of NaN (AC-8)', () => {
    expect(avgDailyGainPct([day('2026-01-01', -100)], [], 'REAL', 100)).toBe(-100);
  });
});

describe('Capital tab review follow ups', () => {
  jest.setTimeout(30000);
  const App = require('./App').default;
  beforeEach(() => { localStorage.clear(); sessionStorage.clear(); Element.prototype.scrollIntoView = jest.fn(); });

  async function open(real = false) {
    render(<App />);
    await screen.findAllByRole('button', { name: 'Capital' }, { timeout: 5000 });
    if (real) userEvent.click(screen.getAllByRole('button', { name: 'REAL' })[0]);
    if (!screen.queryByRole('heading', { name: 'Projection' })) userEvent.click(screen.getAllByRole('button', { name: 'Capital' })[0]);
    await screen.findByRole('heading', { name: 'Projection' });
  }

  test('a jump chip can be activated with the keyboard (AC-17, AC-18)', async () => {
    await open();
    const bar = screen.getByRole('navigation', { name: 'Capital sections' });
    const chip = within(bar).getByRole('button', { name: 'Sizer' });
    chip.focus();
    userEvent.keyboard('{enter}');
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    expect(chip).toHaveAttribute('aria-current', 'true');
  });

  test('Log withdrawal fields have labels tied to their inputs (review)', async () => {
    await open(true);
    expect(screen.getByLabelText('Amount ($)')).toBeInTheDocument();
    expect(screen.getByLabelText('Notes')).toBeInTheDocument();
  });

  test('Milestones shows one accent message at the top, not two (review)', async () => {
    await open();
    const card = screen.getByRole('heading', { name: 'Withdrawal milestones' }).parentElement;
    expect(within(card).queryByText(/Phase 1/)).not.toBeNull(); // balance 20 is below the Phase 1 threshold
    expect(within(card).queryByText(/Next milestone/)).toBeNull();
  });
});
