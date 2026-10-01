import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Analytics, Analyzer, Journal, Dashboard, getToday } from './App';

// The two reserved builtins, standing in for a loaded `strategies` list —
// matches what App's bootstrap seeds per user (see ensureBuiltinStrategies).
const STRATEGIES = [
  { id: 'zone-sd', name: 'Zone (S&D)', isBuiltin: true, archived: false },
  { id: 'trend-pattern', name: 'Trend/Pattern', isBuiltin: true, archived: false },
];

describe('getToday (midnight rollover)', () => {
  test('resets sessions for a new calendar date, keeps them for the same date', () => {
    const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('en-CA');
    const staleSS = { date: yesterday, sessions: [{ id: 's1', num: 1, accountMode: 'DEMO' }] };

    const today = getToday(staleSS);
    expect(today.date).not.toBe(yesterday);
    expect(today.sessions).toEqual([]); // numbering correctly starts fresh

    const sameDaySS = { date: today.date, sessions: [{ id: 's1', num: 1, accountMode: 'DEMO' }] };
    expect(getToday(sameDaySS)).toBe(sameDaySS); // unchanged when already today
  });
});

test('shows separate demo and real win-rate analytics for completed trades', () => {
  const trades = [
    { id: 'demo-win', timestamp: Date.now(), date: '2026-07-01', sessionNum: 1, pair: 'EUR/USD OTC', direction: 'BUY', zoneType: 'Demand', zoneGrade: 'A', stake: 2, outcome: 'WIN', pnl: 1.84, source: 'ANALYZER', analysisId: null, screenshots: [], notes: '', isAnalyzed: true, accountMode: 'DEMO' },
    { id: 'demo-loss', timestamp: Date.now() + 1, date: '2026-07-01', sessionNum: 1, pair: 'EUR/USD OTC', direction: 'SELL', zoneType: 'Supply', zoneGrade: 'B', stake: 2, outcome: 'LOSS', pnl: -2, source: 'MANUAL', analysisId: null, screenshots: [], notes: '', isAnalyzed: false, accountMode: 'DEMO' },
    { id: 'real-win', timestamp: Date.now() + 2, date: '2026-07-01', sessionNum: 2, pair: 'USD/JPY OTC', direction: 'BUY', zoneType: 'Demand', zoneGrade: 'A', stake: 2, outcome: 'WIN', pnl: 1.84, source: 'ANALYZER', analysisId: null, screenshots: [], notes: '', isAnalyzed: true, accountMode: 'REAL' },
  ];

  render(<Analytics trades={trades} settings={{ riskPercent: 1, tradeStyle: 1, sessionsPerDay: 3, milestones: [], startingBalanceDemo: 20, startingBalanceReal: 20 }} bal={100} />);

  expect(screen.getByText('Demo')).toBeInTheDocument();
  expect(screen.getByText('Real')).toBeInTheDocument();
  expect(screen.getAllByText('50.0%').length).toBeGreaterThan(0);
  expect(screen.getAllByText('100.0%').length).toBeGreaterThan(0);
});

test('Discipline Impact reports off-plan counts, P&L, and the direct balance-subtraction line', () => {
  const now = Date.now();
  const trade = (id, outcome, pnl, offPlan) => ({
    id, timestamp: now, date: '2026-07-01', sessionNum: 1, pair: 'EUR/USD', direction: 'BUY',
    zoneType: '', zoneGrade: 'A', stake: 2, outcome, pnl, source: 'MANUAL',
    screenshots: [], notes: '', isAnalyzed: false, accountMode: 'DEMO', offPlan,
  });
  const trades = [
    trade('on1', 'WIN', 1.84, false),
    trade('on2', 'LOSS', -2, false),
    trade('off1', 'LOSS', -2, true),
  ];

  render(<Analytics trades={trades} analyses={[]} settings={{ startingBalanceDemo: 20, startingBalanceReal: 20 }} bal={20} wds={[]}/>);
  fireEvent.click(screen.getByRole('button', { name: /^review$/i }));
  fireEvent.click(screen.getByRole('button', { name: /all time/i }));

  expect(screen.getByText('Off-plan trades')).toBeInTheDocument();
  expect(screen.getByText('1')).toBeInTheDocument(); // off-plan count
  // f$ shows magnitude only (sign is conveyed by color elsewhere in this app)
  expect(screen.getByText('$2.00')).toBeInTheDocument(); // off-plan P&L (the one off-plan trade)
  // modeBal = 20 (starting) + 1.84 - 2 - 2 = 17.84; minus off-plan pnl (-2) = 19.84
  expect(screen.getByText(/would be \$19\.84 instead of \$17\.84/)).toBeInTheDocument();
});

test('Analytics breaks performance down by strategy, equally alongside grade and pair', () => {
  const trade = (id, strategyId, outcome, pnl) => ({
    id, timestamp: Date.now(), date: '2026-07-01', sessionNum: 1, pair: 'EUR/USD OTC',
    direction: 'BUY', zoneType: '', zoneGrade: 'A', stake: 2, outcome, pnl, source: 'MANUAL',
    screenshots: [], notes: '', isAnalyzed: false, accountMode: 'DEMO', strategyId,
  });
  const trades = [
    trade('z1', 'zone-sd', 'WIN', 1.84),
    trade('z2', 'zone-sd', 'LOSS', -2),
    trade('t1', 'trend-pattern', 'WIN', 1.84),
    trade('t2', 'trend-pattern', 'WIN', 1.84),
  ];

  render(<Analytics trades={trades} analyses={[]} settings={{ riskPercent: 1, tradeStyle: 1, sessionsPerDay: 3, milestones: [], startingBalanceDemo: 20, startingBalanceReal: 20 }} bal={100} wds={[]}/>);

  expect(screen.getByText('Performance by strategy')).toBeInTheDocument();
  expect(screen.getByText('Zone (S&D)')).toBeInTheDocument();
  expect(screen.getByText('Trend/Pattern')).toBeInTheDocument();
  // ZONE: 1W/1L = 50%; TREND: 2W/0L = 100%
  expect(screen.getByText('50.0%')).toBeInTheDocument();
  expect(screen.getByText('100.0%')).toBeInTheDocument();
});

describe('Journal interactions', () => {
  test('opens a detail modal when a journal card is clicked', async () => {
    const trades = [{
      id: 'trade-1',
      timestamp: Date.now(),
      date: '2026-07-01',
      sessionNum: 1,
      pair: 'EUR/USD OTC',
      direction: 'BUY',
      zoneType: 'Demand',
      zoneGrade: 'A',
      stake: 2,
      outcome: 'PENDING',
      pnl: 0,
      source: 'ANALYZER',
      analysisId: null,
      screenshots: [],
      notes: 'This is a long note that should appear in the detail view.',
      criteria: { originStructure: { pass: true, note: 'Tight base' } },
      isAnalyzed: true,
    }];

    render(
      <Journal
        settings={{ riskPercent: 1, tradeStyle: 1, sessionsPerDay: 3, milestones: [], startingBalanceDemo: 20, startingBalanceReal: 20 }}
        trades={trades}
        saveTrades={jest.fn()}
        ss={{ date: '2026-07-01', sessions: [], perMode: { DEMO: { dailyLosses: 0, isDailyLocked: false, lastEnd: null }, REAL: { dailyLosses: 0, isDailyLocked: false, lastEnd: null } } }}
        saveSS={jest.fn()}
        pa={null}
        setPA={jest.fn()}
        bal={1000}
      />
    );

    fireEvent.click(screen.getByText('EUR/USD OTC'));

    expect(await screen.findByText('Trade detail')).toBeInTheDocument();
    expect(screen.getAllByText(/This is a long note/i).length).toBeGreaterThan(0);
    expect(screen.getByText('Origin structure')).toBeInTheDocument();
    // Read-only by default: an Edit action is offered, but no editable
    // notes textarea or Save/Cancel/Delete controls exist until it's used.
    expect(screen.getByRole('button', { name: /^edit$/i })).toBeInTheDocument();
    expect(screen.queryByLabelText('Journal notes')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /save edits/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^edit$/i }));
    expect(await screen.findByText('Edit trade')).toBeInTheDocument();
    expect(screen.getByLabelText('Journal notes')).toBeInTheDocument();

    // Canceling out of Edit returns to the read-only Detail view, not the list.
    fireEvent.click(screen.getByRole('button', { name: /^cancel$/i }));
    expect(await screen.findByText('Trade detail')).toBeInTheDocument();
    expect(screen.getAllByText(/This is a long note/i).length).toBeGreaterThan(0);
  });
});

test('filters the journal by strategy, combinable with the outcome filter', () => {
  const trade = (id, strategyId, outcome) => ({
    id, timestamp: Date.now(), date: '2026-07-01', sessionNum: 1,
    pair: `${id}-PAIR`, direction: 'BUY', zoneType: '', zoneGrade: 'A', stake: 2,
    outcome, pnl: outcome === 'WIN' ? 1.84 : outcome === 'LOSS' ? -2 : 0, source: 'MANUAL',
    screenshots: [], notes: '', isAnalyzed: false, accountMode: 'DEMO', strategyId,
  });
  const trades = [
    trade('zone-win', 'zone-sd', 'WIN'),
    trade('zone-loss', 'zone-sd', 'LOSS'),
    trade('trend-win', 'trend-pattern', 'WIN'),
    trade('trend-loss', 'trend-pattern', 'LOSS'),
  ];

  render(
    <Journal
      settings={{ riskPercent: 1, tradeStyle: 1, sessionsPerDay: 3, milestones: [], startingBalanceDemo: 20, startingBalanceReal: 20 }}
      trades={trades}
      saveTrades={jest.fn()}
      ss={{ date: '2026-07-01', sessions: [], perMode: { DEMO: {}, REAL: {} } }}
      saveSS={jest.fn()}
      pa={null}
      setPA={jest.fn()}
      wds={[]}
      strategies={STRATEGIES}
    />
  );

  // Strategy alone.
  // The filter button and each Trend/Pattern-tagged trade card (its role="button"
  // wrapper's accessible name includes the badge text) both match this name —
  // the filter button renders first, before the trade list.
  fireEvent.click(screen.getAllByRole('button', { name: /trend\/pattern/i })[0]);
  expect(screen.getByText('trend-win-PAIR')).toBeInTheDocument();
  expect(screen.getByText('trend-loss-PAIR')).toBeInTheDocument();
  expect(screen.queryByText('zone-win-PAIR')).not.toBeInTheDocument();
  expect(screen.queryByText('zone-loss-PAIR')).not.toBeInTheDocument();

  // Strategy + outcome combined (AND, not exclusive alternatives).
  fireEvent.click(screen.getByRole('button', { name: /^win$/i }));
  expect(screen.getByText('trend-win-PAIR')).toBeInTheDocument();
  expect(screen.queryByText('trend-loss-PAIR')).not.toBeInTheDocument();
  expect(screen.queryByText('zone-win-PAIR')).not.toBeInTheDocument();
});

test('a custom payout % overrides the default 92% when calculating a WIN\'s P&L', async () => {
  const saveTrades = jest.fn();
  render(
    <Journal
      settings={{ riskPercent: 1, tradeStyle: 1, sessionsPerDay: 3, milestones: [], startingBalanceDemo: 20, startingBalanceReal: 20 }}
      trades={[]}
      saveTrades={saveTrades}
      ss={{ date: '2026-07-01', sessions: [], perMode: { DEMO: {}, REAL: {} } }}
      saveSS={jest.fn()}
      pa={null}
      setPA={jest.fn()}
      wds={[]}
      strategies={STRATEGIES}
    />
  );

  fireEvent.click(screen.getByRole('button', { name: /\+ manual entry/i }));
  fireEvent.change(screen.getByRole('combobox', { name: /strategy/i }), { target: { value: 'zone-sd' } }); // strategy is required before saving
  // "WIN" also matches the ALL/PENDING/WIN/LOSS filter row — the outcome
  // button is the one rendered inside the manual-entry form, later in the DOM.
  const winButtons = screen.getAllByRole('button', { name: /^win$/i });
  fireEvent.click(winButtons[winButtons.length - 1]);
  fireEvent.click(screen.getByRole('button', { name: /amount \$/i }));
  fireEvent.change(screen.getByPlaceholderText(/e\.g\. 10/i), { target: { value: '10' } });
  fireEvent.change(screen.getByPlaceholderText(String(92)), { target: { value: '80' } });
  fireEvent.click(screen.getByRole('button', { name: /save entry/i }));

  await waitFor(() => expect(saveTrades).toHaveBeenCalled());
  const updater = saveTrades.mock.calls[0][0];
  const [saved] = updater([]);
  expect(saved.stake).toBe(10);
  expect(saved.pnl).toBe(8); // 10 * 0.80, not the default 10 * 0.92 = 9.2
  expect(saved.strategyId).toBe('zone-sd');
  expect(saved.payoutPct).toBe(80);
});

test('manual entry refuses to save without an explicit strategy selection', async () => {
  const saveTrades = jest.fn();
  const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
  // Clear both the "remembered last strategy" AND the in-progress-draft
  // recovery — a prior test's draft would otherwise carry its strategy
  // choice into this "fresh, no selection yet" scenario.
  try { window.localStorage.removeItem('gm_last_strategy_id'); } catch {}
  try { window.sessionStorage.removeItem('gm_draft_mf'); } catch {}

  render(
    <Journal
      settings={{ riskPercent: 1, tradeStyle: 1, sessionsPerDay: 3, milestones: [], startingBalanceDemo: 20, startingBalanceReal: 20 }}
      trades={[]}
      saveTrades={saveTrades}
      ss={{ date: '2026-07-01', sessions: [], perMode: { DEMO: {}, REAL: {} } }}
      saveSS={jest.fn()}
      pa={null}
      setPA={jest.fn()}
      wds={[]}
      strategies={STRATEGIES}
    />
  );

  fireEvent.click(screen.getByRole('button', { name: /\+ manual entry/i }));
  expect(screen.getByText(/required — pick whichever was actually used/i)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /save entry/i }));

  expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('Select a strategy'));
  expect(saveTrades).not.toHaveBeenCalled();

  alertSpy.mockRestore();
});

test('adds a custom pair to the suggestion list when typed', async () => {
  render(
    <Journal
      settings={{ riskPercent: 1, tradeStyle: 1, sessionsPerDay: 3, milestones: [], startingBalanceDemo: 20, startingBalanceReal: 20 }}
      trades={[]}
      saveTrades={jest.fn()}
      ss={{ date: '2026-07-01', sessions: [], perMode: { DEMO: { dailyLosses: 0, isDailyLocked: false, lastEnd: null }, REAL: { dailyLosses: 0, isDailyLocked: false, lastEnd: null } } }}
      saveSS={jest.fn()}
      pa={null}
      setPA={jest.fn()}
      wds={[]}
    />
  );

  fireEvent.click(screen.getByRole('button', { name: /\+ manual entry/i }));
  const pairInput = screen.getByPlaceholderText(/type any pair/i);
  fireEvent.change(pairInput, { target: { value: 'XAU/USD OTC' } });
  fireEvent.blur(pairInput);

  expect(pairInput).toHaveValue('XAU/USD OTC');
});

test('manual entry stays enabled with a stale lastEnd — the session gap was removed entirely', () => {
  // Rules as a mirror, not a gate: a leftover lastEnd (the old gap-tracking
  // field) must no longer disable anything — only the daily circuit breaker
  // (computed from trades, not session state) does.
  render(
    <Journal
      settings={{ riskPercent: 1, tradeStyle: 1, sessionsPerDay: 3, milestones: [], startingBalanceDemo: 20, startingBalanceReal: 20 }}
      trades={[]}
      saveTrades={jest.fn()}
      ss={{ date: '2026-07-01', sessions: [], perMode: { DEMO: { lastEnd: Date.now() - 1000 * 60 }, REAL: {} } }}
      saveSS={jest.fn()}
      pa={null}
      setPA={jest.fn()}
      wds={[]}
    />
  );

  expect(screen.getByRole('button', { name: /\+ manual entry/i })).not.toBeDisabled();
});

test('Strict Session Locking blocks the normal manual-entry button but offers an off-plan override', () => {
  const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
  const strictSession = {
    id: 's1', num: 1, accountMode: 'DEMO', trades: 1, wins: 1, losses: 0,
    conLoss: 0, conWin: 1, netLoss: -1, sPnl: 1.84, isActive: true, isLocked: false,
    strictAtStart: true, startTime: Date.now(),
  };

  render(
    <Journal
      settings={{ riskPercent: 1, tradeStyle: 1, tradeStyleDemo: 1, sessionsPerDay: 3, milestones: [], startingBalanceDemo: 20, startingBalanceReal: 20 }}
      trades={[]}
      saveTrades={jest.fn()}
      ss={{ date: '2026-07-01', sessions: [strictSession], perMode: { DEMO: {}, REAL: {} } }}
      saveSS={jest.fn()}
      pa={null}
      setPA={jest.fn()}
      wds={[]}
      mode="DEMO"
    />
  );

  // Precision style (id 1) locks after 1 trade — the session already has
  // one, and strictAtStart is true, so the normal path must be blocked.
  expect(screen.getByRole('button', { name: /\+ manual entry/i })).toBeDisabled();
  const overrideBtn = screen.getByRole('button', { name: /log an off-plan trade anyway/i });
  expect(overrideBtn).toBeInTheDocument();

  fireEvent.click(overrideBtn);
  expect(confirmSpy).toHaveBeenCalledWith(expect.stringContaining('outside your locked session'));
  expect(screen.getByText(/logging as off-plan/i)).toBeInTheDocument();
  // The manual-entry form itself is now open, off-plan-tagged.
  expect(screen.getByPlaceholderText(/type any pair/i)).toBeInTheDocument();

  confirmSpy.mockRestore();
});

test('disables manual entry once the daily loss circuit breaker is hit', () => {
  const today = new Date().toLocaleDateString('en-CA');
  const trades = Array.from({ length: 4 }, (_, i) => ({
    id: `loss-${i}`, timestamp: Date.now(), date: today, sessionNum: null,
    pair: 'EUR/USD', direction: 'BUY', zoneType: '', zoneGrade: 'A', stake: 2,
    outcome: 'LOSS', pnl: -2, source: 'MANUAL', screenshots: [], notes: '', isAnalyzed: false, accountMode: 'DEMO',
  }));

  render(
    <Journal
      settings={{ riskPercent: 1, tradeStyle: 1, sessionsPerDay: 3, milestones: [], startingBalanceDemo: 20, startingBalanceReal: 20 }}
      trades={trades}
      saveTrades={jest.fn()}
      ss={{ date: today, sessions: [], perMode: { DEMO: {}, REAL: {} } }}
      saveSS={jest.fn()}
      pa={null}
      setPA={jest.fn()}
      wds={[]}
    />
  );

  expect(screen.getByRole('button', { name: /\+ manual entry/i })).toBeDisabled();
});

test('shows a large preview when a manual screenshot is clicked before saving', async () => {
  const { container } = render(
    <Journal
      settings={{ riskPercent: 1, tradeStyle: 1, sessionsPerDay: 3, milestones: [], startingBalanceDemo: 20, startingBalanceReal: 20 }}
      trades={[]}
      saveTrades={jest.fn()}
      ss={{ date: '2026-07-01', sessions: [], perMode: { DEMO: { dailyLosses: 0, isDailyLocked: false, lastEnd: null }, REAL: { dailyLosses: 0, isDailyLocked: false, lastEnd: null } } }}
      saveSS={jest.fn()}
      pa={null}
      setPA={jest.fn()}
      wds={[]}
    />
  );

  fireEvent.click(screen.getByRole('button', { name: /\+ manual entry/i }));
  const file = new File(['image'], 'chart.png', { type: 'image/png' });
  const input = container.querySelector('input[type="file"]');
  fireEvent.change(input, { target: { files: [file] } });

  await waitFor(() => expect(container.querySelectorAll('img[src]').length).toBeGreaterThan(0));
  fireEvent.click(container.querySelector('img[src]'));

  expect(await screen.findByRole('dialog', { name: /image preview/i })).toBeInTheDocument();
  expect(screen.getByAltText('Screenshot 1 of 1')).toBeInTheDocument();
});

test('shows a large preview when a journal screenshot is clicked', async () => {
  const trades = [{
    id: 'trade-1',
    timestamp: Date.now(),
    date: '2026-07-01',
    sessionNum: 1,
    pair: 'EUR/USD OTC',
    direction: 'BUY',
    zoneType: 'Demand',
    zoneGrade: 'A',
    stake: 2,
    outcome: 'PENDING',
    pnl: 0,
    source: 'ANALYZER',
    analysisId: null,
    screenshots: ['data:image/png;base64,abc123'],
    notes: 'Has image',
    isAnalyzed: true,
  }];

  render(
    <Journal
      settings={{ riskPercent: 1, tradeStyle: 1, sessionsPerDay: 3, milestones: [], startingBalanceDemo: 20, startingBalanceReal: 20 }}
      trades={trades}
      saveTrades={jest.fn()}
      ss={{ date: '2026-07-01', sessions: [], perMode: { DEMO: { dailyLosses: 0, isDailyLocked: false, lastEnd: null }, REAL: { dailyLosses: 0, isDailyLocked: false, lastEnd: null } } }}
      saveSS={jest.fn()}
      pa={null}
      setPA={jest.fn()}
      wds={[]}
    />
  );

  fireEvent.click(screen.getByText('EUR/USD OTC'));
  fireEvent.click(await screen.findByAltText('Screenshot 1'));

  expect(await screen.findByRole('dialog', { name: /image preview/i })).toBeInTheDocument();
  expect(screen.getByAltText('Screenshot 1 of 1')).toBeInTheDocument();
});

test('lets you edit notes for a saved journal entry', async () => {
  const saveTrades = jest.fn();
  const trades = [{
    id: 'trade-1',
    timestamp: Date.now(),
    date: '2026-07-01',
    sessionNum: 1,
    pair: 'EUR/USD OTC',
    direction: 'BUY',
    zoneType: 'Demand',
    zoneGrade: 'A',
    stake: 2,
    outcome: 'PENDING',
    pnl: 0,
    source: 'ANALYZER',
    analysisId: null,
    screenshots: [],
    notes: 'Initial notes',
    isAnalyzed: true,
  }];

  render(
    <Journal
      settings={{ riskPercent: 1, tradeStyle: 1, sessionsPerDay: 3, milestones: [], startingBalanceDemo: 20, startingBalanceReal: 20 }}
      trades={trades}
      saveTrades={saveTrades}
      ss={{ date: '2026-07-01', sessions: [], perMode: { DEMO: { dailyLosses: 0, isDailyLocked: false, lastEnd: null }, REAL: { dailyLosses: 0, isDailyLocked: false, lastEnd: null } } }}
      saveSS={jest.fn()}
      pa={null}
      setPA={jest.fn()}
      wds={[]}
    />
  );

  fireEvent.click(screen.getByText('EUR/USD OTC'));
  fireEvent.click(await screen.findByRole('button', { name: /^edit$/i })); // Detail view opens read-only by default
  fireEvent.change(await screen.findByLabelText('Journal notes'), { target: { value: 'Updated notes' } });
  fireEvent.click(screen.getByRole('button', { name: /save edits/i }));
  await waitFor(() => expect(saveTrades).toHaveBeenCalled());

  // Saving returns to the read-only Detail view, which is where the updated
  // notes should now render.
  expect(await screen.findByText('Updated notes')).toBeInTheDocument();
});

test('lets you fix a wrong pair and change the strategy on a saved journal entry', async () => {
  const trades = [{
    id: 'trade-1', timestamp: Date.now(), date: '2026-07-01', sessionNum: 1,
    pair: 'EUR/USD OTC', direction: 'BUY', zoneType: 'Demand', zoneGrade: 'A',
    stake: 2, outcome: 'PENDING', pnl: 0, source: 'ANALYZER', analysisId: null,
    screenshots: [], notes: '', isAnalyzed: true, strategyId: 'zone-sd',
  }];

  render(
    <Journal
      settings={{ riskPercent: 1, tradeStyle: 1, sessionsPerDay: 3, milestones: [], startingBalanceDemo: 20, startingBalanceReal: 20 }}
      trades={trades}
      saveTrades={jest.fn()}
      ss={{ date: '2026-07-01', sessions: [], perMode: { DEMO: {}, REAL: {} } }}
      saveSS={jest.fn()}
      pa={null}
      setPA={jest.fn()}
      wds={[]}
      strategies={STRATEGIES}
    />
  );

  fireEvent.click(screen.getByText('EUR/USD OTC'));
  fireEvent.click(await screen.findByRole('button', { name: /^edit$/i }));
  const pairInput = await screen.findByDisplayValue('EUR/USD OTC');
  fireEvent.change(pairInput, { target: { value: 'GBP/USD OTC' } });
  fireEvent.change(screen.getByRole('combobox', { name: /strategy/i }), { target: { value: 'trend-pattern' } });
  fireEvent.click(screen.getByRole('button', { name: /save edits/i }));

  // Saving returns to the read-only Detail view, which renders the pair in
  // TWO places (the header, and its own fact in the details grid) — both
  // legitimately show the corrected value, so assert at least one does.
  expect((await screen.findAllByText('GBP/USD OTC')).length).toBeGreaterThan(0);
});

test('lets you correct the direction and outcome on a saved journal entry, recalculating P&L', async () => {
  const saveTrades = jest.fn();
  const trades = [{
    id: 'trade-1', timestamp: Date.now(), date: '2026-07-01', sessionNum: 1,
    pair: 'EUR/USD OTC', direction: 'BUY', zoneType: 'Demand', zoneGrade: 'A',
    stake: 2, outcome: 'PENDING', pnl: 0, source: 'ANALYZER', analysisId: null,
    screenshots: [], notes: '', isAnalyzed: true, strategyId: 'zone-sd',
  }];

  render(
    <Journal
      settings={{ riskPercent: 1, tradeStyle: 1, sessionsPerDay: 3, milestones: [], startingBalanceDemo: 20, startingBalanceReal: 20 }}
      trades={trades}
      saveTrades={saveTrades}
      ss={{ date: '2026-07-01', sessions: [], perMode: { DEMO: {}, REAL: {} } }}
      saveSS={jest.fn()}
      pa={null}
      setPA={jest.fn()}
      wds={[]}
    />
  );

  fireEvent.click(screen.getByText('EUR/USD OTC'));
  fireEvent.click(await screen.findByRole('button', { name: /^edit$/i }));
  fireEvent.click(await screen.findByRole('button', { name: /^sell$/i }));
  // "WIN" also matches the ALL/PENDING/WIN/LOSS filter row — the outcome
  // button inside the edit modal is the one rendered later in the DOM.
  const winButtons = screen.getAllByRole('button', { name: /^win$/i });
  fireEvent.click(winButtons[winButtons.length - 1]);
  fireEvent.click(screen.getByRole('button', { name: /save edits/i }));

  await waitFor(() => expect(saveTrades).toHaveBeenCalled());
  const updater = saveTrades.mock.calls[saveTrades.mock.calls.length - 1][0];
  const [updated] = updater(trades);
  expect(updated.direction).toBe('SELL');
  expect(updated.outcome).toBe('WIN');
  expect(updated.pnl).toBeCloseTo(2 * 0.92, 2); // stake 2 * default 92% payout
});

describe('Analyzer screenshot upload', () => {
  test('accepts pasted images in the screenshot area', async () => {
    const file = new File(['image'], 'chart.png', { type: 'image/png' });
    const imageItem = { type: 'image/png', getAsFile: () => file };

    render(
      <Analyzer
        settings={{ aiProvider: 'openrouter', riskPercent: 1, tradeStyle: 1, sessionsPerDay: 3, milestones: [] }}
        ss={{ date: '2026-07-01', sessions: [], perMode: { DEMO: { dailyLosses: 0, isDailyLocked: false, lastEnd: null }, REAL: { dailyLosses: 0, isDailyLocked: false, lastEnd: null } } }}
        saveAnalyses={jest.fn()}
        analyses={[]}
        nav={jest.fn()}
        setPA={jest.fn()}
      />
    );

    const target = screen.getByRole('button', { name: /drop chart screenshot/i });
    fireEvent.paste(target, { clipboardData: { items: [imageItem] } });

    await waitFor(() => expect(screen.getByAltText('Chart screenshot')).toBeInTheDocument());
  });
});

describe("Dashboard's Today count", () => {
  const baseSettings = { riskPercent: 1, tradeStyle: 1, sessionsPerDay: 3, milestones: [], startingBalanceDemo: 20, startingBalanceReal: 20 };
  const basePerMode = { DEMO: { dailyLosses: 0, isDailyLocked: false, lastEnd: null }, REAL: { dailyLosses: 0, isDailyLocked: false, lastEnd: null } };
  // Independent of tod()'s internal implementation — just real calendar-day
  // subtraction, matching what a date-only en-CA string would produce.
  const localDate = daysAgo => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toLocaleDateString('en-CA');
  };
  const trade = (id, date, overrides = {}) => ({
    id, timestamp: Date.now(), date, sessionNum: null, pair: 'EUR/USD OTC', direction: 'BUY',
    zoneType: '', zoneGrade: 'A', stake: 2, outcome: 'WIN', pnl: 1.84, source: 'MANUAL',
    analysisId: null, screenshots: [], notes: '', isAnalyzed: false, accountMode: 'DEMO', ...overrides,
  });
  // ss.date is deliberately stale/mismatched in every case below — the fix
  // must not read "today" from it.
  const staleSS = { date: localDate(5), sessions: [], perMode: basePerMode };

  test('backdated-only trade shows zero for Today, not the backdated date', () => {
    render(
      <Dashboard settings={baseSettings} trades={[trade('y1', localDate(1))]} wds={[]}
        ss={staleSS} saveSS={jest.fn()} bal={100} mode="DEMO" nav={jest.fn()} music={null}/>
    );
    expect(screen.queryByText(/Today:/)).not.toBeInTheDocument();
  });

  test('a trade dated today counts alone, excluding an earlier backdated entry', () => {
    render(
      <Dashboard settings={baseSettings}
        trades={[trade('y1', localDate(1)), trade('t1', localDate(0))]} wds={[]}
        ss={staleSS} saveSS={jest.fn()} bal={100} mode="DEMO" nav={jest.fn()} music={null}/>
    );
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('trades')).toBeInTheDocument();
    expect(screen.getByText('1W')).toBeInTheDocument();
    expect(screen.getByText('0L')).toBeInTheDocument();
  });

  test('gap-day scenario: Monday trade + a Monday trade backdated on Wednesday only count Wednesday itself', () => {
    const monday = localDate(2), wednesday = localDate(0);
    render(
      <Dashboard settings={baseSettings}
        trades={[
          trade('mon-original', monday),
          trade('mon-backdated-on-wed', monday, { outcome: 'LOSS', pnl: -2 }),
          trade('wed-actual', wednesday),
        ]}
        wds={[]} ss={staleSS} saveSS={jest.fn()} bal={100} mode="DEMO" nav={jest.fn()} music={null}/>
    );
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('trades')).toBeInTheDocument();
    expect(screen.getByText('1W')).toBeInTheDocument();
    expect(screen.getByText('0L')).toBeInTheDocument();
  });

  // Reproduces the exact reported scenario: most recent actual trade dated
  // yesterday, a REAL session already completed today (so ss.sessions for
  // TODAY is genuinely non-empty), but zero DEMO trades/sessions today.
  // "Ready for session" used to read ss.sessions.length+1 with no mode
  // filter, so a same-day session in the OTHER mode leaked into DEMO's count.
  test('zero trades/sessions today for this mode shows "Today: 0" and "Ready for session 1", unaffected by a same-day session in the other mode', () => {
    const ssToday = {
      date: localDate(0),
      sessions: [{ id: 'r1', num: 1, accountMode: 'REAL', startTime: Date.now(), endTime: Date.now(), trades: 1, wins: 1, losses: 0, conLoss: 0, conWin: 1, netLoss: -1, sPnl: 1.84, isActive: false, isLocked: true, lockReason: 'Session complete', lockCode: 'MAX_TRADES' }],
      perMode: { DEMO: { dailyLosses: 0, isDailyLocked: false, lastEnd: null }, REAL: { dailyLosses: 0, isDailyLocked: false, lastEnd: Date.now() } },
    };
    render(
      <Dashboard settings={baseSettings} trades={[trade('y1', localDate(1))]} wds={[]}
        ss={ssToday} saveSS={jest.fn()} bal={100} mode="DEMO" nav={jest.fn()} music={null}/>
    );
    expect(screen.queryByText(/Today:/)).not.toBeInTheDocument();
    expect(screen.getByText('Ready for session 1')).toBeInTheDocument();
  });
});

describe('Modal sequential trade navigation', () => {
  const baseSettings = { riskPercent: 1, tradeStyle: 1, sessionsPerDay: 3, milestones: [], startingBalanceDemo: 20, startingBalanceReal: 20 };
  const baseSS = { date: '2026-07-01', sessions: [], perMode: { DEMO: {}, REAL: {} } };

  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  const createTrade = (id, pair, overrides = {}) => ({
    id,
    timestamp: Date.now() - 60000 + (overrides.offset || 0),
    date: '2026-07-01',
    sessionNum: 1,
    pair,
    direction: 'BUY',
    zoneType: 'Demand',
    zoneGrade: 'A',
    stake: 2,
    outcome: 'WIN',
    pnl: 1.84,
    source: 'MANUAL',
    analysisId: null,
    screenshots: [],
    notes: `Notes for ${id}`,
    isAnalyzed: false,
    accountMode: 'DEMO',
    strategyIds: ['zone-sd'],
    ...overrides,
  });

  test('navigates to next and previous trades with position counter and boundary disabled states (AC-1, AC-2, AC-4)', async () => {
    // Journal sorts by timestamp descending (b.timestamp - a.timestamp)
    // T1: offset 300, T2: offset 200, T3: offset 100 -> sorted order: [T1, T2, T3]
    const trades = [
      createTrade('trade-1', 'EUR/USD OTC', { offset: 300 }),
      createTrade('trade-2', 'GBP/USD OTC', { offset: 200 }),
      createTrade('trade-3', 'USD/JPY OTC', { offset: 100 }),
    ];

    render(
      <Journal
        settings={baseSettings}
        trades={trades}
        saveTrades={jest.fn()}
        deleteTrade={jest.fn()}
        ss={baseSS}
        saveSS={jest.fn()}
        pa={null}
        setPA={jest.fn()}
        bal={1000}
        strategies={STRATEGIES}
      />
    );

    // Open first trade
    fireEvent.click(screen.getByText('EUR/USD OTC'));
    expect(await screen.findByText('Trade 1 of 3')).toBeInTheDocument();
    expect(screen.getAllByText('EUR/USD OTC').length).toBeGreaterThan(0);

    const prevBtn = screen.getByRole('button', { name: /previous trade/i });
    const nextBtn = screen.getByRole('button', { name: /next trade/i });

    // Boundary at first item: Prev disabled, Next enabled
    expect(prevBtn).toBeDisabled();
    expect(nextBtn).not.toBeDisabled();

    // Click Next -> moves to trade 2
    fireEvent.click(nextBtn);
    expect(await screen.findByText('Trade 2 of 3')).toBeInTheDocument();
    expect(screen.getAllByText('GBP/USD OTC').length).toBeGreaterThan(0);
    expect(prevBtn).not.toBeDisabled();
    expect(nextBtn).not.toBeDisabled();

    // Click Next again -> moves to trade 3
    fireEvent.click(nextBtn);
    expect(await screen.findByText('Trade 3 of 3')).toBeInTheDocument();
    expect(screen.getAllByText('USD/JPY OTC').length).toBeGreaterThan(0);
    // Boundary at last item: Prev enabled, Next disabled
    expect(prevBtn).not.toBeDisabled();
    expect(nextBtn).toBeDisabled();

    // Click Previous -> moves back to trade 2
    fireEvent.click(prevBtn);
    expect(await screen.findByText('Trade 2 of 3')).toBeInTheDocument();
    expect(screen.getAllByText('GBP/USD OTC').length).toBeGreaterThan(0);
  });

  test('keyboard arrow shortcuts navigate between trades and ignore input focus (AC-3)', async () => {
    const trades = [
      createTrade('trade-1', 'EUR/USD OTC', { offset: 200 }),
      createTrade('trade-2', 'GBP/USD OTC', { offset: 100 }),
    ];

    render(
      <Journal
        settings={baseSettings}
        trades={trades}
        saveTrades={jest.fn()}
        deleteTrade={jest.fn()}
        ss={baseSS}
        saveSS={jest.fn()}
        pa={null}
        setPA={jest.fn()}
        bal={1000}
        strategies={STRATEGIES}
      />
    );

    fireEvent.click(screen.getByText('EUR/USD OTC'));
    expect(await screen.findByText('Trade 1 of 2')).toBeInTheDocument();

    // Press ArrowRight on window
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(await screen.findByText('Trade 2 of 2')).toBeInTheDocument();
    expect(screen.getAllByText('GBP/USD OTC').length).toBeGreaterThan(0);

    // Press ArrowLeft on window
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(await screen.findByText('Trade 1 of 2')).toBeInTheDocument();
    expect(screen.getAllByText('EUR/USD OTC').length).toBeGreaterThan(0);

    // Enter edit mode
    fireEvent.click(screen.getByRole('button', { name: /^edit$/i }));
    const notesInput = await screen.findByLabelText('Journal notes');
    notesInput.focus();

    // Press ArrowRight while textarea is focused -> should NOT navigate
    fireEvent.keyDown(notesInput, { key: 'ArrowRight' });
    expect(screen.getByText('Trade 1 of 2')).toBeInTheDocument();
    expect(screen.getByLabelText('Journal notes')).toBeInTheDocument();
  });

  test('prompts before discarding unsaved edits during navigation (AC-5)', async () => {
    const confirmSpy = jest.spyOn(window, 'confirm');
    const trades = [
      createTrade('trade-1', 'EUR/USD OTC', { offset: 200 }),
      createTrade('trade-2', 'GBP/USD OTC', { offset: 100 }),
    ];

    render(
      <Journal
        settings={baseSettings}
        trades={trades}
        saveTrades={jest.fn()}
        deleteTrade={jest.fn()}
        ss={baseSS}
        saveSS={jest.fn()}
        pa={null}
        setPA={jest.fn()}
        bal={1000}
        strategies={STRATEGIES}
      />
    );

    fireEvent.click(screen.getByText('EUR/USD OTC'));
    fireEvent.click(await screen.findByRole('button', { name: /^edit$/i }));

    const notesInput = await screen.findByLabelText('Journal notes');
    fireEvent.change(notesInput, { target: { value: 'Draft with unsaved modifications' } });

    // Cancel prompt: user stays on current trade
    confirmSpy.mockReturnValueOnce(false);
    const nextBtn = screen.getByRole('button', { name: /next trade/i });
    fireEvent.click(nextBtn);

    expect(confirmSpy).toHaveBeenCalledWith(expect.stringContaining('unsaved edits'));
    expect(screen.getByText('Trade 1 of 2')).toBeInTheDocument();
    expect(notesInput.value).toBe('Draft with unsaved modifications');

    // Confirm prompt: navigation proceeds and draft is discarded
    confirmSpy.mockReturnValueOnce(true);
    fireEvent.click(nextBtn);

    expect(await screen.findByText('Trade 2 of 2')).toBeInTheDocument();
    expect(screen.getAllByText('GBP/USD OTC').length).toBeGreaterThan(0);

    confirmSpy.mockRestore();
  });

  test('auto-advances to adjacent trade upon deletion (AC-6)', async () => {
    const deleteTrade = jest.fn();
    const trades = [
      createTrade('trade-1', 'EUR/USD OTC', { offset: 300 }),
      createTrade('trade-2', 'GBP/USD OTC', { offset: 200 }),
      createTrade('trade-3', 'USD/JPY OTC', { offset: 100 }),
    ];

    render(
      <Journal
        settings={baseSettings}
        trades={trades}
        saveTrades={jest.fn()}
        deleteTrade={deleteTrade}
        ss={baseSS}
        saveSS={jest.fn()}
        pa={null}
        setPA={jest.fn()}
        bal={1000}
        strategies={STRATEGIES}
      />
    );

    // Open trade 2 (middle trade)
    fireEvent.click(screen.getByText('GBP/USD OTC'));
    expect(await screen.findByText('Trade 2 of 3')).toBeInTheDocument();

    // Click Edit -> Delete
    fireEvent.click(screen.getByRole('button', { name: /^edit$/i }));
    fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));

    // ConfirmDialog pops up
    const confirmDeleteBtn = screen.getByRole('button', { name: /delete entry/i });
    fireEvent.click(confirmDeleteBtn);

    expect(deleteTrade).toHaveBeenCalledWith(expect.objectContaining({ id: 'trade-2' }));
    // Advances to trade 3 (the next trade)
    expect(await screen.findByText('USD/JPY OTC')).toBeInTheDocument();
  });

  test('navigates strictly within active journal filter (AC-7)', async () => {
    const trades = [
      createTrade('trade-1', 'WIN-A', { outcome: 'WIN', offset: 400 }),
      createTrade('trade-2', 'LOSS-B', { outcome: 'LOSS', offset: 300 }),
      createTrade('trade-3', 'WIN-C', { outcome: 'WIN', offset: 200 }),
      createTrade('trade-4', 'LOSS-D', { outcome: 'LOSS', offset: 100 }),
    ];

    render(
      <Journal
        settings={baseSettings}
        trades={trades}
        saveTrades={jest.fn()}
        deleteTrade={jest.fn()}
        ss={baseSS}
        saveSS={jest.fn()}
        pa={null}
        setPA={jest.fn()}
        bal={1000}
        strategies={STRATEGIES}
      />
    );

    // Filter to WIN trades only
    fireEvent.click(screen.getByRole('button', { name: /^win$/i }));

    // Open WIN-A
    fireEvent.click(screen.getByText('WIN-A'));
    expect(await screen.findByText('Trade 1 of 2')).toBeInTheDocument();

    // Next should advance to WIN-C (skipping LOSS-B)
    fireEvent.click(screen.getByRole('button', { name: /next trade/i }));
    expect(await screen.findByText('Trade 2 of 2')).toBeInTheDocument();
    expect(screen.getAllByText('WIN-C').length).toBeGreaterThan(0);
  });
});

describe('Journal list pagination and page sizing', () => {
  const baseSettings = { riskPercent: 1, tradeStyle: 1, sessionsPerDay: 3, milestones: [], startingBalanceDemo: 20, startingBalanceReal: 20 };
  const baseSS = { date: '2026-07-01', sessions: [], perMode: { DEMO: {}, REAL: {} } };

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  const createTrade = (id, pair, offset, overrides = {}) => ({
    id,
    timestamp: Date.now() - 60000 + offset,
    date: '2026-07-01',
    sessionNum: 1,
    pair,
    direction: 'BUY',
    zoneType: 'Demand',
    zoneGrade: 'A',
    stake: 2,
    outcome: 'WIN',
    pnl: 1.84,
    source: 'MANUAL',
    analysisId: null,
    screenshots: [],
    notes: `Notes for ${id}`,
    isAnalyzed: false,
    accountMode: 'DEMO',
    strategyIds: ['zone-sd'],
    ...overrides,
  });

  test('renders default page size of 25 trades with dynamic range counter (AC-1, AC-2)', () => {
    const trades = Array.from({ length: 30 }, (_, i) =>
      createTrade(`trade-${i + 1}`, `PAIR-${String(i + 1).padStart(2, '0')}`, (i + 1) * 10)
    );

    render(
      <Journal
        settings={baseSettings}
        trades={trades}
        saveTrades={jest.fn()}
        deleteTrade={jest.fn()}
        ss={baseSS}
        saveSS={jest.fn()}
        pa={null}
        setPA={jest.fn()}
        bal={1000}
        strategies={STRATEGIES}
      />
    );

    // Initial load: 25 items rendered, counter reflects 1 to 25 of 30
    expect(screen.getByText('Showing 1 to 25 of 30 trades')).toBeInTheDocument();
    // Trade 30 is the most recent (largest offset), so it appears on page 1
    expect(screen.getByText('PAIR-30')).toBeInTheDocument();
    // Trade 5 has lowest offset in this slice and is trade index 26, so it is on page 2
    expect(screen.queryByText('PAIR-05')).not.toBeInTheDocument();
  });

  test('selects page size and persists choice across sessions (AC-2, AC-3)', () => {
    const trades = Array.from({ length: 30 }, (_, i) =>
      createTrade(`trade-${i + 1}`, `PAIR-${String(i + 1).padStart(2, '0')}`, (i + 1) * 10)
    );

    const { unmount } = render(
      <Journal
        settings={baseSettings}
        trades={trades}
        saveTrades={jest.fn()}
        deleteTrade={jest.fn()}
        ss={baseSS}
        saveSS={jest.fn()}
        pa={null}
        setPA={jest.fn()}
        bal={1000}
        strategies={STRATEGIES}
      />
    );

    // Click 10 per page
    fireEvent.click(screen.getByRole('button', { name: '10' }));
    expect(screen.getByText('Showing 1 to 10 of 30 trades')).toBeInTheDocument();
    expect(localStorage.getItem('gm_journal_page_size')).toBe('10');
    unmount();

    // Reload with stored size of 10
    render(
      <Journal
        settings={baseSettings}
        trades={trades}
        saveTrades={jest.fn()}
        deleteTrade={jest.fn()}
        ss={baseSS}
        saveSS={jest.fn()}
        pa={null}
        setPA={jest.fn()}
        bal={1000}
        strategies={STRATEGIES}
      />
    );
    expect(screen.getByText('Showing 1 to 10 of 30 trades')).toBeInTheDocument();
  });

  test('navigates via Next, Previous, and direct page buttons with boundary states (AC-4)', () => {
    const trades = Array.from({ length: 30 }, (_, i) =>
      createTrade(`trade-${i + 1}`, `PAIR-${String(i + 1).padStart(2, '0')}`, (i + 1) * 10)
    );

    render(
      <Journal
        settings={baseSettings}
        trades={trades}
        saveTrades={jest.fn()}
        deleteTrade={jest.fn()}
        ss={baseSS}
        saveSS={jest.fn()}
        pa={null}
        setPA={jest.fn()}
        bal={1000}
        strategies={STRATEGIES}
      />
    );

    // Page size 10 yields 3 pages
    fireEvent.click(screen.getByRole('button', { name: '10' }));
    const prevBtn = screen.getByRole('button', { name: /previous page/i });
    const nextBtn = screen.getByRole('button', { name: /next page/i });

    // Page 1: Previous disabled, Next enabled
    expect(prevBtn).toBeDisabled();
    expect(nextBtn).not.toBeDisabled();

    // Move to page 2
    fireEvent.click(nextBtn);
    expect(screen.getByText('Showing 11 to 20 of 30 trades')).toBeInTheDocument();
    expect(prevBtn).not.toBeDisabled();
    expect(nextBtn).not.toBeDisabled();

    // Direct jump to page 3
    fireEvent.click(screen.getByRole('button', { name: 'Page 3' }));
    expect(screen.getByText('Showing 21 to 30 of 30 trades')).toBeInTheDocument();
    expect(prevBtn).not.toBeDisabled();
    expect(nextBtn).toBeDisabled();

    // Step back via Previous
    fireEvent.click(prevBtn);
    expect(screen.getByText('Showing 11 to 20 of 30 trades')).toBeInTheDocument();

    // Direct jump back to page 1
    fireEvent.click(screen.getByRole('button', { name: 'Page 1' }));
    expect(screen.getByText('Showing 1 to 10 of 30 trades')).toBeInTheDocument();
    expect(prevBtn).toBeDisabled();
  });

  test('resets active page to 1 when changing filters or tab (AC-5)', () => {
    const trades = [
      ...Array.from({ length: 15 }, (_, i) => createTrade(`win-${i + 1}`, `WIN-${i + 1}`, (i + 1) * 10, { outcome: 'WIN' })),
      ...Array.from({ length: 15 }, (_, i) => createTrade(`loss-${i + 1}`, `LOSS-${i + 1}`, (i + 16) * 10, { outcome: 'LOSS' })),
    ];

    render(
      <Journal
        settings={baseSettings}
        trades={trades}
        saveTrades={jest.fn()}
        deleteTrade={jest.fn()}
        ss={baseSS}
        saveSS={jest.fn()}
        pa={null}
        setPA={jest.fn()}
        bal={1000}
        strategies={STRATEGIES}
      />
    );

    // Page size 10
    fireEvent.click(screen.getByRole('button', { name: '10' }));
    // Go to page 2 (trades 11 to 20 of 30)
    fireEvent.click(screen.getByRole('button', { name: /next page/i }));
    expect(screen.getByText('Showing 11 to 20 of 30 trades')).toBeInTheDocument();

    // Filter to WIN only -> resets page to 1
    const winBtn = screen.getByRole('button', { name: 'WIN' });
    fireEvent.click(winBtn);
    expect(screen.getByText('Showing 1 to 10 of 15 trades')).toBeInTheDocument();

    // Go to page 2 (trades 11 to 15 of 15)
    fireEvent.click(screen.getByRole('button', { name: /next page/i }));
    expect(screen.getByText('Showing 11 to 15 of 15 trades')).toBeInTheDocument();

    // Switch tab to Real -> resets page to 1
    fireEvent.click(screen.getByRole('button', { name: 'Real' }));
    expect(screen.queryByText(/Showing 11 to 15/i)).not.toBeInTheDocument();
  });

  test('clamps current page when list shrinks below active page (AC-6)', () => {
    const trades = Array.from({ length: 30 }, (_, i) =>
      createTrade(`trade-${i + 1}`, `PAIR-${String(i + 1).padStart(2, '0')}`, (i + 1) * 10)
    );

    const { rerender } = render(
      <Journal
        settings={baseSettings}
        trades={trades}
        saveTrades={jest.fn()}
        deleteTrade={jest.fn()}
        ss={baseSS}
        saveSS={jest.fn()}
        pa={null}
        setPA={jest.fn()}
        bal={1000}
        strategies={STRATEGIES}
      />
    );

    // Page size 10 -> go to page 3 (trades 21 to 30)
    fireEvent.click(screen.getByRole('button', { name: '10' }));
    fireEvent.click(screen.getByRole('button', { name: 'Page 3' }));
    expect(screen.getByText('Showing 21 to 30 of 30 trades')).toBeInTheDocument();

    // Simulate trades being deleted so only 15 remain (totalPages is now 2)
    const reducedTrades = trades.slice(0, 15);
    rerender(
      <Journal
        settings={baseSettings}
        trades={reducedTrades}
        saveTrades={jest.fn()}
        deleteTrade={jest.fn()}
        ss={baseSS}
        saveSS={jest.fn()}
        pa={null}
        setPA={jest.fn()}
        bal={1000}
        strategies={STRATEGIES}
      />
    );

    // Current page clamps down to page 2
    expect(screen.getByText('Showing 11 to 15 of 15 trades')).toBeInTheDocument();
  });

  test('condenses numbered page buttons with ellipsis when pages exceed 5 (AC-7)', () => {
    // 70 trades with page size 10 = 7 pages
    const trades = Array.from({ length: 70 }, (_, i) =>
      createTrade(`trade-${i + 1}`, `PAIR-${String(i + 1).padStart(2, '0')}`, (i + 1) * 10)
    );

    render(
      <Journal
        settings={baseSettings}
        trades={trades}
        saveTrades={jest.fn()}
        deleteTrade={jest.fn()}
        ss={baseSS}
        saveSS={jest.fn()}
        pa={null}
        setPA={jest.fn()}
        bal={1000}
        strategies={STRATEGIES}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '10' }));

    // On page 1: 1, 2, 3, 4, ellipsis, 7
    expect(screen.getByRole('button', { name: 'Page 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page 2' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page 3' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page 4' })).toBeInTheDocument();
    expect(screen.getByText('…')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page 7' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Page 5' })).not.toBeInTheDocument();

    // Move to page 4: 1, ellipsis, 3, 4, 5, ellipsis, 7
    fireEvent.click(screen.getByRole('button', { name: 'Page 4' }));
    expect(screen.getByRole('button', { name: 'Page 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page 3' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page 4' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page 5' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page 7' })).toBeInTheDocument();
    expect(screen.getAllByText('…').length).toBe(2);
  });

  test('preserves full list for modal sequential navigation across page boundaries (AC-8)', async () => {
    // 25 trades with page size 10 (page 1 has items 1 to 10)
    const trades = Array.from({ length: 25 }, (_, i) =>
      createTrade(`trade-${i + 1}`, `PAIR-${String(i + 1).padStart(2, '0')}`, (i + 1) * 10)
    );

    render(
      <Journal
        settings={baseSettings}
        trades={trades}
        saveTrades={jest.fn()}
        deleteTrade={jest.fn()}
        ss={baseSS}
        saveSS={jest.fn()}
        pa={null}
        setPA={jest.fn()}
        bal={1000}
        strategies={STRATEGIES}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '10' }));

    // Item 10 is the last trade rendered on page 1 (PAIR-16)
    // Sorted descending by timestamp: T25 -> item 1, T16 -> item 10, T15 -> item 11 (on page 2)
    fireEvent.click(screen.getByText('PAIR-16'));
    expect(await screen.findByText('Trade 10 of 25')).toBeInTheDocument();

    // Click Next inside modal -> navigates to item 11 (PAIR-15) even though it is on page 2 in the list
    const modalNextBtn = screen.getByRole('button', { name: /next trade/i });
    fireEvent.click(modalNextBtn);

    expect(await screen.findByText('Trade 11 of 25')).toBeInTheDocument();
    expect(screen.getAllByText('PAIR-15').length).toBeGreaterThan(0);
  });
});


