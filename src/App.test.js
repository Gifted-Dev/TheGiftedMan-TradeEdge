import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Analytics, Analyzer, Journal } from './App';

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

test('blocks a manual entry when the session gate would normally prevent a new session', async () => {
  const saveTrades = jest.fn();
  const saveSS = jest.fn();

  const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

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

  fireEvent.click(screen.getByRole('button', { name: /\+ manual entry/i }));
  fireEvent.change(screen.getByPlaceholderText(/type any pair/i), { target: { value: 'XAU/USD OTC' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save entry' }));

  await waitFor(() => expect(alertSpy).toHaveBeenCalled());
  expect(saveTrades).not.toHaveBeenCalled();
  expect(saveSS).not.toHaveBeenCalled();
  alertSpy.mockRestore();
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
