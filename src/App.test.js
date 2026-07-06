import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Analytics, Analyzer, Journal, Dashboard } from './App';

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

    expect(await screen.findByText('Trade details')).toBeInTheDocument();
    expect(screen.getAllByText(/This is a long note/i).length).toBeGreaterThan(0);
    expect(screen.getByText('Origin structure')).toBeInTheDocument();
  });
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

test('disables manual entry while a mode is inside its post-session gap', () => {
  const saveTrades = jest.fn();
  const saveSS = jest.fn();

  render(
    <Journal
      settings={{ riskPercent: 1, tradeStyle: 1, sessionsPerDay: 3, milestones: [], startingBalanceDemo: 20, startingBalanceReal: 20 }}
      trades={[]}
      saveTrades={saveTrades}
      ss={{ date: '2026-07-01', sessions: [], perMode: { DEMO: { dailyLosses: 0, isDailyLocked: false, lastEnd: Date.now() - 1000 * 60 }, REAL: { dailyLosses: 0, isDailyLocked: false, lastEnd: null } } }}
      saveSS={saveSS}
      pa={null}
      setPA={jest.fn()}
      wds={[]}
    />
  );

  // The gap check used to only recognize TIME_EXPIRED/TIME_EXPIRED_NO_TRADE
  // lock codes, so a mode with a recent lastEnd but no matching ended-session
  // record (as here) fell through as "not gapped" and let the form open —
  // only to have the save silently discard the trade once mkSession's own
  // gate rejected it. It should be disabled up front instead.
  expect(screen.getByRole('button', { name: /\+ manual entry/i })).toBeDisabled();
  expect(saveTrades).not.toHaveBeenCalled();
  expect(saveSS).not.toHaveBeenCalled();
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
      saveTrades={jest.fn()}
      ss={{ date: '2026-07-01', sessions: [], perMode: { DEMO: { dailyLosses: 0, isDailyLocked: false, lastEnd: null }, REAL: { dailyLosses: 0, isDailyLocked: false, lastEnd: null } } }}
      saveSS={jest.fn()}
      pa={null}
      setPA={jest.fn()}
      wds={[]}
    />
  );

  fireEvent.click(screen.getByText('EUR/USD OTC'));
  fireEvent.change(await screen.findByLabelText('Journal notes'), { target: { value: 'Updated notes' } });
  fireEvent.click(screen.getByRole('button', { name: /save edits/i }));

  expect(await screen.findByText('Updated notes')).toBeInTheDocument();
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
});
