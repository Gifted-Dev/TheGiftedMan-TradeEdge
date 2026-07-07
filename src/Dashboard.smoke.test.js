import { render, screen } from '@testing-library/react';
import { Dashboard } from './App';

const settings = { startingBalanceDemo: 20, startingBalanceReal: 20, riskPercent: 5, tradeStyle: 1, sessionsPerDay: 2, milestones: [{ mul: 2, pct: 20 }] };
const emptyModeState = () => ({ dailyLosses: 0, isDailyLocked: false, lastEnd: null });
const ssEmpty = { date: '2026-07-03', sessions: [], perMode: { DEMO: emptyModeState(), REAL: emptyModeState() } };
const music = { tracks: [], trackIdx: 0, track: null, playing: false, volume: 0.5, setVolume: jest.fn(), muted: false, setMuted: jest.fn(), audioRef: { current: null }, toggle: jest.fn(), next: jest.fn(), selectTrack: jest.fn() };

test('dashboard renders with no trades', () => {
  render(<Dashboard settings={settings} trades={[]} wds={[]} ss={ssEmpty} bal={20} mode="DEMO" nav={jest.fn()} />);
  expect(screen.getByText('Total balance')).toBeInTheDocument();
  expect(screen.getByText('No trades yet')).toBeInTheDocument();
});

test('dashboard renders with an active session and trades', () => {
  const ss = { ...ssEmpty, sessions: [{ id: 's1', num: 1, accountMode: 'DEMO', startTime: Date.now(), endTime: null, trades: 1, wins: 1, losses: 0, conLoss: 0, conWin: 1, netLoss: -1, sPnl: 1.84, isActive: true, isLocked: false, lockReason: null }] };
  const trades = [{ id: 't1', timestamp: Date.now(), date: '2026-07-03', sessionNum: 1, pair: 'EUR/USD OTC', direction: 'BUY', zoneType: 'Demand', zoneGrade: 'A', stake: 2, outcome: 'WIN', pnl: 1.84, source: 'ANALYZER', screenshots: [], notes: '', isAnalyzed: true, accountMode: 'DEMO' }];
  render(<Dashboard settings={settings} trades={trades} wds={[]} ss={ss} bal={21.84} mode="DEMO" nav={jest.fn()} music={music} />);
  expect(screen.getByText(/Session 1 live/i)).toBeInTheDocument();
  expect(screen.getByText('EUR/USD OTC')).toBeInTheDocument();
});

test('streak reflects the most recent trades, not the oldest', () => {
  // Chronological order: LOSS, WIN, WIN, WIN, WIN — a 4-win streak sits at
  // the recent end, with a single loss further back. Given newest-first
  // (the array shape the app actually fetches/prepends in), the streak
  // must read "4 wins", not the stale "1 loss" a reversed walk would find.
  const now = Date.now();
  const trade = (i, outcome) => ({
    id: `t${i}`, timestamp: now - i * 60000, date: '2026-07-03', sessionNum: null,
    pair: 'EUR/USD OTC', direction: 'BUY', zoneType: '', zoneGrade: 'A', stake: 2,
    outcome, pnl: outcome === 'WIN' ? 1.84 : -2, source: 'MANUAL',
    screenshots: [], notes: '', isAnalyzed: false, accountMode: 'DEMO',
  });
  const trades = [trade(0, 'WIN'), trade(1, 'WIN'), trade(2, 'WIN'), trade(3, 'WIN'), trade(4, 'LOSS')];

  render(<Dashboard settings={settings} trades={trades} wds={[]} ss={ssEmpty} bal={20} mode="DEMO" nav={jest.fn()} />);
  expect(screen.getByText('4 wins')).toBeInTheDocument();
});

test('dashboard renders day-locked state', () => {
  // Daily circuit breaker is now computed straight from today's trades, not
  // from session/perMode state — 4 losses dated today trips it.
  const today = new Date().toLocaleDateString('en-CA');
  const trades = Array.from({ length: 4 }, (_, i) => ({
    id: `loss-${i}`, timestamp: Date.now(), date: today, sessionNum: null,
    pair: 'EUR/USD OTC', direction: 'BUY', zoneType: '', zoneGrade: 'A', stake: 2,
    outcome: 'LOSS', pnl: -2, source: 'MANUAL', screenshots: [], notes: '', isAnalyzed: false, accountMode: 'DEMO',
  }));
  render(<Dashboard settings={settings} trades={trades} wds={[]} ss={ssEmpty} bal={12} mode="DEMO" nav={jest.fn()} />);
  expect(screen.getByText('Day locked')).toBeInTheDocument();
});
