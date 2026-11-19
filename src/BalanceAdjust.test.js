import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { calcBal, balForMode, tradingBalForMode, buildDayStats, dayStartBalForMode } from './App';

// Supabase mocked at the boundary. mockCtl lets a test seed adjustment rows and
// make insert/delete fail.
const mockCtl = { adjRows: [], sessRows: [], insertError: null, deleteError: null, calls: [] };
jest.mock('./supabaseClient', () => {
  const settingsRow = {
    user_id: 'u1', starting_balance: 20, risk_percent: 5, trade_style: 1,
    sessions_per_day: 2, broker_min: 10, milestones: [{ mul: 2, pct: 20 }],
    api_keys: {}, setup_complete: true, created_at: new Date().toISOString(),
    extra: { startingBalanceDemo: 100, startingBalanceReal: 100 },
  };
  const chain = (table) => {
    let op = 'select';
    const c = {
      select: () => c, eq: () => c, order: () => c, in: () => c,
      insert: (row) => { op = 'insert'; mockCtl.calls.push(['insert', table, row]); return c; },
      delete: () => { op = 'delete'; mockCtl.calls.push(['delete', table]); return c; },
      upsert: () => c,
      maybeSingle: () => Promise.resolve({ data: settingsRow, error: null }),
      then: (res, rej) => {
        let r = { data: [], error: null };
        if (table === 'sessions' && op === 'select') r = { data: mockCtl.sessRows, error: null };
        if (table === 'balance_adjustments') {
          if (op === 'select') r = { data: mockCtl.adjRows, error: null };
          if (op === 'insert') r = { error: mockCtl.insertError };
          if (op === 'delete') r = { error: mockCtl.deleteError };
        }
        return Promise.resolve(r).then(res, rej);
      },
    };
    return c;
  };
  return {
    supabase: {
      auth: {
        getSession: () => Promise.resolve({ data: { session: { user: { id: 'u1' } } } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
        signOut: () => Promise.resolve({}),
      },
      from: (table) => chain(table),
      storage: { from: () => ({ createSignedUrl: () => Promise.resolve({ data: { signedUrl: 'x' }, error: null }) }) },
    },
    isSupabaseConfigured: true,
  };
});

const trade = (date, pnl, mode = 'REAL') => ({ id: date, date, pnl, outcome: pnl >= 0 ? 'WIN' : 'LOSS', accountMode: mode, timestamp: new Date(`${date}T12:00:00`).getTime() });
const adj = (o) => ({ id: 'a' + Math.random(), mode: 'REAL', date: '2026-01-02', timestamp: new Date('2026-01-02T12:00:00').getTime(), amount: 50, balanceBefore: 100, balanceAfter: 150, notes: null, ...o });
const settings = { startingBalanceReal: 100, startingBalanceDemo: 100 };
const dbRow = (o) => ({ id: 'a', user_id: 'u1', timestamp: '2026-01-01T10:00:00Z', date: '2026-01-01', mode: 'DEMO', amount: 50, balance_before: 100, balance_after: 150, notes: null, ...o });

describe('balance adjustments: pure calc', () => {
  test('calcBal adds adjustments', () => {
    expect(calcBal(100, [], [], [adj({ amount: 50 }), adj({ amount: -20 })])).toBe(130);
    expect(calcBal(100, [], [])).toBe(100);
  });
  test('balForMode ignores the other mode (AC-9)', () => {
    const adjs = [adj({ mode: 'DEMO', amount: 500 }), adj({ mode: 'REAL', amount: 25 })];
    expect(balForMode(settings, [], [], 'REAL', adjs)).toBe(125);
    expect(balForMode(settings, [], [], 'DEMO', adjs)).toBe(600);
  });
  test('trading balance drops a net plus but keeps a net minus (AC-10)', () => {
    expect(tradingBalForMode(settings, [], [], 'REAL', [adj({ amount: 500 })])).toBe(100);
    expect(tradingBalForMode(settings, [], [], 'REAL', [adj({ amount: -50 })])).toBe(50);
  });
  test('buildDayStats: adjustment moves the running balance, never pctPnl (AC-3, AC-4)', () => {
    const t = [trade('2026-01-01', 10), trade('2026-01-02', 11)];
    const a = [adj({ date: '2026-01-01', amount: 100 })];
    const s = buildDayStats(t, [], 'REAL', 100, a);
    expect(s['2026-01-01'].pctPnl).toBeCloseTo(10, 5);
    expect(s['2026-01-01'].endingBalance).toBe(210);
    expect(s['2026-01-02'].startBalance).toBe(210);
    expect(s['2026-01-02'].pctPnl).toBeCloseTo((11 / 210) * 100, 5);
    expect(buildDayStats(t, [], 'REAL', 100)['2026-01-02'].startBalance).toBe(110);
  });
  test('buildDayStats: adjustment only day appears with adjusted (AC-4)', () => {
    const s = buildDayStats([], [], 'REAL', 100, [adj({ date: '2026-02-01', amount: -5 })]);
    expect(s['2026-02-01']).toMatchObject({ total: 0, adjusted: -5, endingBalance: 95 });
  });
  test('dayStartBalForMode excludes an adjustment made today (AC-4)', () => {
    const today = adj({ timestamp: Date.now(), amount: 40 });
    const old = adj({ timestamp: new Date('2020-01-01T12:00:00').getTime(), amount: 10 });
    expect(dayStartBalForMode(settings, [], [], 'REAL', [today, old])).toBe(110);
  });
});

describe('Balance section (UI)', () => {
  jest.setTimeout(30000);
  const App = require('./App').default;
  const user = userEvent; // user-event v13: no setup()

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    Object.assign(mockCtl, { adjRows: [], sessRows: [], insertError: null, deleteError: null, calls: [] });
    Element.prototype.scrollIntoView = jest.fn();
  });

  async function open() {
    render(<App />);
    await screen.findAllByRole('button', { name: 'Capital' }, { timeout: 5000 });
    if (!screen.queryByRole('heading', { name: 'Projection' })) await user.click(screen.getAllByRole('button', { name: 'Capital' })[0]);
    await screen.findByRole('heading', { name: 'Projection' });
  }
  const bal = () => screen.getByLabelText('New balance ($)');
  const note = () => screen.getByLabelText('Note (optional)');
  const save = () => screen.getByRole('button', { name: 'Save balance' });

  test('validation messages disable Save and never show NaN (AC-5)', async () => {
    await open();
    expect(screen.getByText('Enter your balance')).toBeInTheDocument();
    expect(save()).toBeDisabled();
    for (const [text, msg] of [['abc', 'Enter a number'], ['12abc', 'Enter a number'], ['1e400', 'Enter a number'], ['-5', 'Balance cannot be below 0'], ['100', 'That is already your balance']]) {
      await user.clear(bal());
      await user.type(bal(), text);
      expect(screen.getByText(msg)).toBeInTheDocument();
      expect(save()).toBeDisabled();
    }
    await user.clear(bal());
    await user.type(bal(), '120');
    await user.type(note(), 'x'.repeat(201));
    expect(screen.getByText('Note is too long')).toBeInTheDocument();
    expect(save()).toBeDisabled();
    expect(document.body.textContent).not.toMatch(/NaN|Infinity/);
  });

  test('preview, save one row, form clears (AC-2, AC-6, AC-7)', async () => {
    await open();
    await user.type(bal(), '120.456');
    expect(screen.getByText('Current $100.00, new $120.46, change +$20.46')).toBeInTheDocument();
    await user.type(note(), ' top up ');
    await user.click(save());
    expect(await screen.findByText('+$20.46')).toBeInTheDocument();
    const ins = mockCtl.calls.find((c) => c[0] === 'insert' && c[1] === 'balance_adjustments');
    expect(ins[2]).toMatchObject({ mode: 'DEMO', amount: 20.46, balance_before: 100, balance_after: 120.46, notes: 'top up', user_id: 'u1' });
    await waitFor(() => expect(bal()).toHaveValue(''));
    expect(screen.queryByText('No adjustments yet')).toBeNull();
  });

  test('failed save changes nothing and keeps the typed values (AC-12)', async () => {
    mockCtl.insertError = { message: 'boom' };
    await open();
    await user.type(bal(), '120');
    await user.click(save());
    expect(await screen.findByText('Could not save. Try again.')).toBeInTheDocument();
    expect(bal()).toHaveValue('120');
    expect(screen.getByText('No adjustments yet')).toBeInTheDocument();
  });

  test('history is per mode; delete confirms and removes the row (AC-8, AC-9)', async () => {
    mockCtl.adjRows = [
      dbRow({ id: 'b', amount: -30, timestamp: '2026-01-05T10:00:00Z', date: '2026-01-05', notes: 'fee' }),
      dbRow({ id: 'a', amount: 50, notes: 'bonus' }),
      dbRow({ id: 'r', mode: 'REAL', amount: 999, notes: 'realrow' }),
    ];
    await open();
    expect(screen.queryByText(/realrow/)).toBeNull();
    const dels = screen.getAllByRole('button', { name: /Delete adjustment/ });
    expect(dels).toHaveLength(2);
    expect(dels[0]).toHaveAccessibleName('Delete adjustment 2026-01-05');
    await user.click(dels[1]);
    expect(screen.getByText('Balance will change by -$50.00.')).toBeInTheDocument();
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }));
    expect(screen.queryByText(/bonus/)).toBeNull();
    expect(screen.getByText(/fee/)).toBeInTheDocument();
    expect(mockCtl.calls.some((c) => c[0] === 'delete' && c[1] === 'balance_adjustments')).toBe(true);
  });

  test('failed delete restores the row (AC-8)', async () => {
    mockCtl.deleteError = { message: 'boom' };
    mockCtl.adjRows = [dbRow({ notes: 'bonus' })];
    await open();
    await user.click(screen.getByRole('button', { name: /Delete adjustment/ }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }));
    expect(await screen.findByText('Could not delete. Try again.')).toBeInTheDocument();
    expect(screen.getByText(/bonus/)).toBeInTheDocument();
  });

  const goTo = async (name) => { await user.click((await screen.findAllByRole('button', { name }))[0]); };
  const today = () => new Date().toLocaleDateString('en-CA');

  test('switching to Real swaps the list and the baseline, Demo rows never leak (AC-9)', async () => {
    mockCtl.adjRows = [dbRow({ notes: 'demo only' })];
    await open();
    expect(screen.getByText(/demo only/)).toBeInTheDocument();
    expect(bal()).toHaveAttribute('placeholder', '$150.00');
    await user.click(screen.getAllByRole('button', { name: 'REAL' })[0]);
    expect(await screen.findByText('No adjustments yet')).toBeInTheDocument();
    expect(screen.queryByText(/demo only/)).toBeNull();
    expect(bal()).toHaveAttribute('placeholder', '$100.00');
  });

  test('an active session shows the warning and Save still works (AC-11)', async () => {
    mockCtl.sessRows = [{
      id: 's1', num: 1, account_mode: 'DEMO', start_time: new Date().toISOString(), end_time: null,
      trades: 0, wins: 0, losses: 0, con_loss: 0, con_win: 0, net_loss: 0, session_pnl: 0,
      is_active: true, is_locked: false, lock_reason: null, extra: {},
    }];
    await open();
    expect(screen.getByText('A session is running. The next session will use the new balance.')).toBeInTheDocument();
    await user.type(bal(), '120');
    expect(save()).toBeEnabled();
    await user.click(save());
    expect(await screen.findByText('+$20.00')).toBeInTheDocument();
  });

  test('no warning when no session is active (AC-11)', async () => {
    await open();
    expect(screen.queryByText(/A session is running/)).toBeNull();
  });

  test('Dashboard balance includes a top up but growth ignores it (AC-2, AC-3, AC-10)', async () => {
    mockCtl.adjRows = [dbRow({ amount: 500, balance_after: 600 })];
    render(<App />);
    expect((await screen.findAllByText('$600.00', {}, { timeout: 5000 })).length).toBeGreaterThan(0);
    expect(screen.getAllByText('+0.0%').length).toBeGreaterThan(0);
  });

  test('calendar day panel shows "Balance adjusted" on a day with no trades (AC-4)', async () => {
    mockCtl.adjRows = [dbRow({ amount: 50, date: today(), timestamp: new Date().toISOString() })];
    render(<App />);
    await screen.findAllByRole('button', { name: 'Calendar' }, { timeout: 5000 });
    await goTo('Calendar');
    expect(await screen.findByText('Balance adjusted +$50.00')).toBeInTheDocument();
  });

  test('reset says it removes balance adjustments and deletes them, other mode untouched (AC-13)', async () => {
    mockCtl.adjRows = [dbRow({ notes: 'demo row' }), dbRow({ id: 'r', mode: 'REAL', notes: 'real row' })];
    render(<App />);
    await screen.findAllByRole('button', { name: 'Settings' }, { timeout: 5000 });
    await goTo('Settings');
    await user.click(await screen.findByRole('tab', { name: 'Danger zone' }));
    await user.click(screen.getByRole('button', { name: /Reset Demo/ }));
    expect(screen.getByText(/balance adjustments/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Reset' }));
    await waitFor(() => expect(mockCtl.calls.some((c) => c[0] === 'delete' && c[1] === 'balance_adjustments')).toBe(true));
    await goTo('Capital');
    expect(await screen.findByText('No adjustments yet')).toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: 'REAL' })[0]);
    expect(await screen.findByText(/real row/)).toBeInTheDocument();
  });

  test('a huge number is rejected instead of overflowing to Infinity (AC-5)', async () => {
    await open();
    await user.type(bal(), '1e307');
    expect(screen.getByText('Balance is too large')).toBeInTheDocument();
    expect(save()).toBeDisabled();
    expect(document.body.textContent).not.toMatch(/Infinity|NaN/);
  });

  test('error messages are tied to their inputs for screen readers (AC-5)', async () => {
    await open();
    await user.type(bal(), 'abc');
    expect(bal()).toHaveAttribute('aria-invalid', 'true');
    expect(bal()).toHaveAccessibleDescription('Enter a number');
    await user.clear(bal());
    await user.type(bal(), '120');
    await user.type(note(), 'x'.repeat(201));
    expect(note()).toHaveAttribute('aria-invalid', 'true');
    expect(note()).toHaveAccessibleDescription('Note is too long');
    expect(bal()).not.toHaveAttribute('aria-describedby');
  });

  test('sizer and the phase 1 lock use the full balance, not the trading balance (AC-10)', async () => {
    mockCtl.adjRows = [dbRow({ amount: 500, balance_after: 600 })];
    await open();
    expect(within(document.getElementById('cap-sizer')).getByText('$600.00')).toBeInTheDocument();
    expect(screen.queryByText(/Phase 1/)).toBeNull(); // full 600 is above the $50 threshold
  });

  test('a net loss drops the full balance under the phase 1 threshold and stays in milestones (AC-10)', async () => {
    mockCtl.adjRows = [dbRow({ amount: -90, balance_after: 10 })];
    await open();
    expect(screen.getByText(/Phase 1/)).toBeInTheDocument(); // full balance 10 < $50
    expect(within(document.getElementById('cap-sizer')).getByText('$10.00')).toBeInTheDocument();
    expect(screen.getByText('Milestones ignore top ups.')).toBeInTheDocument();
  });

  test('Real Dashboard milestone card measures trading balance, not the top up (AC-10)', async () => {
    mockCtl.adjRows = [dbRow({ mode: 'REAL', amount: 500, balance_after: 600 })];
    render(<App />);
    await screen.findAllByRole('button', { name: 'REAL' }, { timeout: 5000 });
    await user.click(screen.getAllByRole('button', { name: 'REAL' })[0]);
    expect(await screen.findByText(/\$100\.00 \/ \$200\.00/)).toBeInTheDocument();
    expect((await screen.findAllByText('$600.00')).length).toBeGreaterThan(0); // balance itself still includes it
  });

  test('the adjusted balance shows on other screens too (AC-2)', async () => {
    mockCtl.adjRows = [dbRow({ amount: 500, balance_after: 600 })];
    render(<App />);
    await screen.findAllByRole('button', { name: 'Journal' }, { timeout: 5000 });
    for (const name of ['Journal', 'Analytics']) {
      await goTo(name);
      expect((await screen.findAllByText('$600.00')).length).toBeGreaterThan(0);
    }
  });

  test('a net top up adds the milestones note (AC-10)', async () => {
    mockCtl.adjRows = [dbRow({ amount: 500, balance_after: 600 })];
    await open();
    expect(screen.getByText('Milestones ignore top ups.')).toBeInTheDocument();
    expect(screen.queryByText(/Milestone 2× reached/)).toBeNull();
  });
});
