import { fireEvent, render, screen } from '@testing-library/react';
import { Dashboard, Journal } from './App';

const settings = { startingBalanceDemo: 20, startingBalanceReal: 20, riskPercent: 5, tradeStyle: 1, sessionsPerDay: 2, milestones: [{ mul: 2, pct: 20 }] };
const emptyModeState = () => ({ dailyLosses: 0, isDailyLocked: false, lastEnd: null });
const ssEmpty = { date: '2026-07-03', sessions: [], perMode: { DEMO: emptyModeState(), REAL: emptyModeState() } };

test('dashboard renders with no trades', () => {
  render(<Dashboard settings={settings} trades={[]} wds={[]} ss={ssEmpty} bal={20} mode="DEMO" nav={jest.fn()} />);
  expect(screen.getByText('Total balance')).toBeInTheDocument();
  expect(screen.getByText('No trades yet')).toBeInTheDocument();
});

test('dashboard renders with an active session and trades', () => {
  const ss = { ...ssEmpty, sessions: [{ id: 's1', num: 1, accountMode: 'DEMO', startTime: Date.now(), endTime: null, trades: 1, wins: 1, losses: 0, conLoss: 0, conWin: 1, netLoss: -1, sPnl: 1.84, isActive: true, isLocked: false, lockReason: null }] };
  const trades = [{ id: 't1', timestamp: Date.now(), date: '2026-07-03', sessionNum: 1, pair: 'EUR/USD OTC', direction: 'BUY', zoneType: 'Demand', zoneGrade: 'A', stake: 2, outcome: 'WIN', pnl: 1.84, source: 'ANALYZER', screenshots: [], notes: '', isAnalyzed: true, accountMode: 'DEMO' }];
  render(<Dashboard settings={settings} trades={trades} wds={[]} ss={ss} bal={21.84} mode="DEMO" nav={jest.fn()} />);
  expect(screen.getByText(/Session 1 live/i)).toBeInTheDocument();
  expect(screen.getByText('EUR/USD OTC')).toBeInTheDocument();
});

test('dashboard renders day-locked state', () => {
  const ss = { ...ssEmpty, perMode: { ...ssEmpty.perMode, DEMO: { dailyLosses: 4, isDailyLocked: true, lastEnd: null } } };
  render(<Dashboard settings={settings} trades={[]} wds={[]} ss={ss} bal={12} mode="DEMO" nav={jest.fn()} />);
  expect(screen.getByText('Day locked')).toBeInTheDocument();
});

test('journal detail shows the 8-gate breakdown for gate-based analyses', async () => {
  const gateResults = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({ gate: n, label: `Gate label ${n}`, pass: n !== 7, justification: `Observation ${n}` }));
  const trades = [{
    id: 't1', timestamp: Date.now(), date: '2026-07-03', sessionNum: 1, pair: 'EUR/USD OTC',
    direction: 'BUY', zoneType: 'Demand', zoneGrade: 'B', stake: 2, outcome: 'PENDING', pnl: 0,
    source: 'ANALYZER', screenshots: [], notes: '', isAnalyzed: true, gateResults, passCount: 7,
  }];
  render(<Journal settings={{ ...settings, milestones: [] }} trades={trades} saveTrades={jest.fn()} ss={ssEmpty} saveSS={jest.fn()} pa={null} setPA={jest.fn()} wds={[]} mode="DEMO" />);
  fireEvent.click(screen.getByText('EUR/USD OTC'));
  expect(await screen.findByText('Gate check')).toBeInTheDocument();
  expect(screen.getByText('7/8 gates passed')).toBeInTheDocument();
  expect(screen.getByText('GATE 7')).toBeInTheDocument();
});

test('journal list shows live-confirmation status, and nothing for manual entries', () => {
  const trades = [
    { id: 't1', timestamp: Date.now(), date: '2026-07-03', sessionNum: 1, pair: 'EUR/USD OTC', direction: 'BUY', zoneType: 'Demand', zoneGrade: 'A+', stake: 2, outcome: 'PENDING', pnl: 0, source: 'ANALYZER', screenshots: [], notes: '', isAnalyzed: true, liveConfirmed: true },
    { id: 't2', timestamp: Date.now() + 1, date: '2026-07-03', sessionNum: 1, pair: 'USD/JPY OTC', direction: 'SELL', zoneType: 'Supply', zoneGrade: 'B', stake: 2, outcome: 'PENDING', pnl: 0, source: 'ANALYZER', screenshots: [], notes: '', isAnalyzed: true, liveConfirmed: false },
    { id: 't3', timestamp: Date.now() + 2, date: '2026-07-03', sessionNum: 1, pair: 'GBP/USD OTC', direction: 'BUY', zoneType: '', zoneGrade: 'UNGRADED', stake: 2, outcome: 'PENDING', pnl: 0, source: 'MANUAL', screenshots: [], notes: '', isAnalyzed: false },
  ];
  render(<Journal settings={{ ...settings, milestones: [] }} trades={trades} saveTrades={jest.fn()} ss={ssEmpty} saveSS={jest.fn()} pa={null} setPA={jest.fn()} wds={[]} mode="DEMO" />);
  expect(screen.getByText('Live confirmed')).toBeInTheDocument();
  expect(screen.getByText('Unconfirmed entry')).toBeInTheDocument();
  // manual entry (t3) has no liveConfirmed field -> exactly the two badges above, none for t3
  expect(screen.getAllByText(/Live confirmed|Unconfirmed entry/).length).toBe(2);
});
