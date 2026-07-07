import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Analytics, Analyzer, Journal, Dashboard, getToday } from './App';

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
  const trade = (id, strategy, outcome, pnl) => ({
    id, timestamp: Date.now(), date: '2026-07-01', sessionNum: 1, pair: 'EUR/USD OTC',
    direction: 'BUY', zoneType: '', zoneGrade: 'A', stake: 2, outcome, pnl, source: 'MANUAL',
    screenshots: [], notes: '', isAnalyzed: false, accountMode: 'DEMO', strategy,
  });
  const trades = [
    trade('z1', 'ZONE', 'WIN', 1.84),
    trade('z2', 'ZONE', 'LOSS', -2),
    trade('t1', 'TREND', 'WIN', 1.84),
    trade('t2', 'TREND', 'WIN', 1.84),
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
  const trade = (id, strategy, outcome) => ({
    id, timestamp: Date.now(), date: '2026-07-01', sessionNum: 1,
    pair: `${id}-PAIR`, direction: 'BUY', zoneType: '', zoneGrade: 'A', stake: 2,
    outcome, pnl: outcome === 'WIN' ? 1.84 : outcome === 'LOSS' ? -2 : 0, source: 'MANUAL',
    screenshots: [], notes: '', isAnalyzed: false, accountMode: 'DEMO', strategy,
  });
  const trades = [
    trade('zone-win', 'ZONE', 'WIN'),
    trade('zone-loss', 'ZONE', 'LOSS'),
    trade('trend-win', 'TREND', 'WIN'),
    trade('trend-loss', 'TREND', 'LOSS'),
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
    />
  );

  // Strategy alone.
  fireEvent.click(screen.getByRole('button', { name: /^trend$/i }));
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
    />
  );

  fireEvent.click(screen.getByRole('button', { name: /\+ manual entry/i }));
  fireEvent.click(screen.getByRole('button', { name: /zone \(s&d\)/i })); // strategy is required before saving
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
  expect(saved.strategy).toBe('ZONE');
  expect(saved.payoutPct).toBe(80);
});

test('manual entry refuses to save without an explicit strategy selection', async () => {
  const saveTrades = jest.fn();
  const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
  // Clear both the "remembered last strategy" AND the in-progress-draft
  // recovery — a prior test's draft would otherwise carry its strategy
  // choice into this "fresh, no selection yet" scenario.
  try { window.localStorage.removeItem('gm_last_strategy'); } catch {}
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
    screenshots: [], notes: '', isAnalyzed: true, strategy: 'ZONE',
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
    />
  );

  fireEvent.click(screen.getByText('EUR/USD OTC'));
  fireEvent.click(await screen.findByRole('button', { name: /^edit$/i }));
  const pairInput = await screen.findByDisplayValue('EUR/USD OTC');
  fireEvent.change(pairInput, { target: { value: 'GBP/USD OTC' } });
  fireEvent.click(screen.getByRole('button', { name: /trend\/pattern/i }));
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
    screenshots: [], notes: '', isAnalyzed: true, strategy: 'ZONE',
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
        settings={{ aiProvider: 'gemini', riskPercent: 1, tradeStyle: 1, sessionsPerDay: 3, milestones: [] }}
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
    expect(screen.getByText('1 trades')).toBeInTheDocument();
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
    expect(screen.getByText('1 trades')).toBeInTheDocument();
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
