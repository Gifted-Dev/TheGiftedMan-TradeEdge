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

describe('Masaniello daily profit target', () => {
  const ms = { ...settings, moneyMgmtStyleDemo: 'MASANIELLO' };
  const done = { id: 'm1', num: 1, accountMode: 'DEMO', msN: 10, msK: 6, startTime: Date.now() - 2000, endTime: Date.now() - 1000, sPnl: 30, isActive: false, endReason: 'MS_TARGET' };

  test('shows the target and progress', () => {
    render(<Dashboard settings={{ ...ms, msTargetValueDemo: 100, msTargetUnitDemo: '$' }} trades={[]} wds={[]} ss={{ ...ssEmpty, sessions: [done] }} bal={50} mode="DEMO" nav={jest.fn()} />);
    expect(screen.getByText(/Daily profit target · \+\$100\.00/)).toBeInTheDocument();
    expect(screen.getByText(/\+\$30\.00 so far/)).toBeInTheDocument();
    expect(screen.getByText('$120.00')).toBeInTheDocument(); // day start $20 + $100 target
  });

  test('shows Target reached once the day profit hits the goal (covers: AC-7, AC-8)', () => {
    render(<Dashboard settings={{ ...ms, msTargetValueDemo: 25, msTargetUnitDemo: '$' }} trades={[]} wds={[]} ss={{ ...ssEmpty, sessions: [done] }} bal={50} mode="DEMO" nav={jest.fn()} />);
    expect(screen.getByText('Target reached')).toBeInTheDocument();
  });

  test('a percent target uses the balance at the start of the day', () => {
    // No trades before today, so day start is the $20 starting balance: 50% = $10, target balance $30.
    render(<Dashboard settings={{ ...ms, msTargetValueDemo: 50, msTargetUnitDemo: '%' }} trades={[]} wds={[]} ss={ssEmpty} bal={99} mode="DEMO" nav={jest.fn()} />);
    expect(screen.getByText(/Daily profit target · \+\$10\.00/)).toBeInTheDocument();
    expect(screen.getByText('$30.00')).toBeInTheDocument();
  });

  test('ignores Masaniello sessions of the other account mode', () => {
    const real = { ...done, id: 'r1', accountMode: 'REAL' };
    render(<Dashboard settings={{ ...ms, msTargetValueDemo: 100, msTargetUnitDemo: '$' }} trades={[]} wds={[]} ss={{ ...ssEmpty, sessions: [real] }} bal={50} mode="DEMO" nav={jest.fn()} />);
    expect(screen.getByText(/\+\$0\.00 so far/)).toBeInTheDocument();
  });

  test('a target that rounds under one cent shows the no target hint, never NaN', () => {
    render(<Dashboard settings={{ ...ms, startingBalanceDemo: 4, msTargetValueDemo: 0.1, msTargetUnitDemo: '%' }} trades={[]} wds={[]} ss={ssEmpty} bal={4} mode="DEMO" nav={jest.fn()} />);
    expect(screen.queryByText(/NaN/)).toBeNull();
    expect(screen.getByText('No daily target set')).toBeInTheDocument();
  });

  test('no target shows a hint with a way to set one', () => {
    const nav = jest.fn();
    render(<Dashboard settings={ms} trades={[]} wds={[]} ss={ssEmpty} bal={50} mode="DEMO" nav={nav} />);
    expect(screen.getByText('No daily target set')).toBeInTheDocument();
    screen.getByText('Set a daily target').click();
    expect(nav).toHaveBeenCalledWith('settings');
  });

  test('other styles show no daily target block', () => {
    render(<Dashboard settings={settings} trades={[]} wds={[]} ss={ssEmpty} bal={20} mode="DEMO" nav={jest.fn()} />);
    expect(screen.queryByText('No daily target set')).toBeNull();
  });
});
