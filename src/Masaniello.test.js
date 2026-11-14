import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { msTable, msPlanSummary, liveMasanielloNextStake, advanceMasaniello, checkMasanielloSessionEnd, msFieldErrors, msSessionsToTarget, msTargetProgress, msTargetToDollars, msTargetAnswer, msCounterLabel, getMsCapitalForMode, amPlLossTargetSessionCount, msModeProgress, msTargetDollarsToday, getMsAutoCopyBalanceForMode, getMsAlertSessionEndForMode, getMsAlertTargetReachedForMode, getMsStopLossPctForMode, msLossLimitFromStopLoss, msAlertEvents, msStopLossHit, dayStartBalForMode, Cfg } from './App';

const cycle = (over = {}) => ({ isActive: true, msN: 10, msK: 6, msPayoutPct: 92, msCapital: 100, msWins: 0, msLosses: 0, sPnl: 0, ...over });

// Plays a sequence of outcomes at the planned payout, the way commitRow does.
function play(outcomes, payoutPct = 92) {
  let s = cycle();
  for (const o of outcomes) {
    if (checkMasanielloSessionEnd(s)) break;
    const stake = liveMasanielloNextStake(s);
    const pnl = o === 'WIN' ? +(stake * payoutPct / 100).toFixed(2) : o === 'LOSS' ? -stake : 0;
    s = { ...s, sPnl: s.sPnl + pnl, ...advanceMasaniello(s, o) };
  }
  return { s, capital: s.msCapital + s.sPnl, end: checkMasanielloSessionEnd(s) };
}

describe('Masaniello math (spec 0004)', () => {
  test('6 of 10 at 92% multiplies capital by about 2.330087', () => {
    expect(1 / msTable(10, 6, 92)[10][6]).toBeCloseTo(2.330087, 5);
    expect(msPlanSummary(100, 10, 6, 92, 500).capitalFinal).toBeCloseTo(233.01, 2);
  });

  test('wins first and losses first paths both land near capital final', () => {
    const winsFirst = play(['WIN', 'WIN', 'WIN', 'WIN', 'WIN', 'WIN']);
    const lossesFirst = play(['LOSS', 'LOSS', 'LOSS', 'LOSS', 'WIN', 'WIN', 'WIN', 'WIN', 'WIN', 'WIN']);
    for (const r of [winsFirst, lossesFirst]) {
      expect(r.end).toBe('MS_TARGET');
      expect(Math.abs(r.capital - 233.01)).toBeLessThan(0.1);
    }
  });

  test('N-K+1 losses ends MS_LOSS_LIMIT near zero; a draw changes nothing', () => {
    const r = play(['LOSS', 'DRAW', 'LOSS', 'LOSS', 'LOSS', 'LOSS']);
    expect(r.end).toBe('MS_LOSS_LIMIT');
    expect(r.s.msLosses).toBe(5);
    expect(Math.abs(r.capital)).toBeLessThan(0.1);
    const s = cycle({ msWins: 2, msLosses: 1 });
    expect(advanceMasaniello(s, 'DRAW')).toEqual({ msWins: 2, msLosses: 1 });
  });

  test('k = n stakes the whole running capital', () => {
    const s = cycle({ msWins: 5, msLosses: 4, sPnl: 10 }); // 1 trade left, 1 win needed
    expect(liveMasanielloNextStake(s)).toBe(110);
  });

  test('drift: next stake is running capital times the live fraction', () => {
    const s = cycle();
    const stake = liveMasanielloNextStake(s);
    const after = { ...s, sPnl: +(stake * 0.85).toFixed(2), ...advanceMasaniello(s, 'WIN') };
    const W = msTable(10, 6, 92), f = 1 - W[8][5] / W[9][5];
    expect(liveMasanielloNextStake(after)).toBeCloseTo(Math.round((100 + after.sPnl) * f * 100) / 100, 2);
  });

  test('minimum capital is the spreadsheet rule: first stake is $1', () => {
    const { minCapital } = msPlanSummary(100, 10, 6, 92, 500);
    expect(minCapital).toBe(3.24);
    const s = cycle({ msCapital: minCapital });
    expect(liveMasanielloNextStake(s)).toBe(1);
    expect(msPlanSummary(100, 10, 6, 92, 0).accountGainPct).toBeNull();
  });

  test('labels: Stop Loss is a dollar line, Max Loss Limit is the loss count', () => {
    const p = msPlanSummary(200, 10, 6, 92, 500, 25);
    expect(p.stopLoss).toBe(50);
    expect(p.maxLossLimit).toBe(1); // first stake $61.79 already crosses the $50 line
    expect(msPlanSummary(200, 10, 6, 92, 500).stopLoss).toBe(200);
    expect(msPlanSummary(200, 10, 6, 92, 500).maxLossLimit).toBe(5);
    expect(msFieldErrors({ msStopLossPctDemo: '0' }, 'Demo').msStopLossPct).toBeTruthy();
  });

  test('a plan stake under $1 later in the cycle is raised to $1', () => {
    const s = cycle({ msCapital: 3.24, msLosses: 1, sPnl: -1 });
    expect(liveMasanielloNextStake(s)).toBe(1);
  });

  // covers: AC-4, AC-21
  test('at minimum capital every stake in a full cycle stays between $1 and running capital', () => {
    for (const outcomes of [['LOSS', 'LOSS', 'LOSS', 'LOSS'], ['WIN', 'LOSS', 'WIN', 'LOSS', 'WIN', 'LOSS', 'WIN', 'WIN']]) {
      let s = cycle({ msCapital: 3.24 });
      for (const o of outcomes) {
        if (checkMasanielloSessionEnd(s)) break;
        const stake = liveMasanielloNextStake(s), rc = s.msCapital + s.sPnl;
        expect(stake).toBeGreaterThanOrEqual(Math.min(1, rc));
        expect(stake).toBeLessThanOrEqual(rc + 1e-9);
        const pnl = o === 'WIN' ? +(stake * 0.92).toFixed(2) : -stake;
        s = { ...s, sPnl: s.sPnl + pnl, ...advanceMasaniello(s, o) };
      }
    }
  });

  // covers: AC-2, AC-3
  test('Stop Loss % accepts 1 to 100 and rejects 0, 101, and non numbers', () => {
    for (const ok of ['1', '50', '100', '']) expect(msFieldErrors({ msStopLossPctDemo: ok }, 'Demo').msStopLossPct).toBeUndefined();
    for (const bad of ['0', '101', 'abc']) expect(msFieldErrors({ msStopLossPctDemo: bad }, 'Demo').msStopLossPct).toBeTruthy();
  });

  // covers: AC-19, AC-20
  test('Max Loss Limit follows Stop Loss, replays live stakes, and falls back to N-K+1', () => {
    expect(msLossLimitFromStopLoss(100, 10, 6, 92, 100)).toBe(5);
    expect(msLossLimitFromStopLoss(100, 10, 6, 92, 50)).toBe(2); // stakes 30.89 then 28.66 sum to 59.55
    expect(msLossLimitFromStopLoss(100, 10, 6, 92, 1)).toBe(1);
    expect(msLossLimitFromStopLoss(3.24, 10, 6, 92, 100)).toBe(4); // $1 minimum stake drains it early
    expect(msLossLimitFromStopLoss(0, 10, 6, 92, 100)).toBe(5);
    expect(msPlanSummary(100, 10, 6, 92, 500, 50).maxLossLimit).toBe(2);
  });

  // covers: AC-19
  test('Stop Loss % getter counts blank, 0, 150 and text as 100', () => {
    for (const bad of ['', 0, 150, 'abc', undefined]) expect(getMsStopLossPctForMode({ msStopLossPctDemo: bad }, 'DEMO')).toBe(100);
    expect(getMsStopLossPctForMode({ msStopLossPctDemo: '40' }, 'DEMO')).toBe(40);
    expect(getMsStopLossPctForMode({ msStopLossPctReal: 40 }, 'DEMO')).toBe(100);
  });

  test('no further counting once a bound is reached', () => {
    expect(advanceMasaniello(cycle({ msWins: 6 }), 'WIN')).toEqual({ msWins: 6, msLosses: 0 });
  });
});

describe('Masaniello settings validation', () => {
  test('K must be below N, N within 3 to 20', () => {
    expect(msFieldErrors({ msTotalTradesDemo: '10', msWinTradesDemo: '10' }, 'Demo').msWinTrades).toBeTruthy();
    expect(msFieldErrors({ msTotalTradesDemo: '10', msWinTradesDemo: '9' }, 'Demo')).toEqual({});
    expect(msFieldErrors({ msTotalTradesDemo: '21' }, 'Demo').msTotalTrades).toBeTruthy();
    expect(msFieldErrors({ msTotalTradesDemo: '5', msWinTradesDemo: '6' }, 'Demo').msWinTrades).toBeTruthy();
    expect(msFieldErrors({ msPayoutPctReal: '0' }, 'Real').msPayoutPct).toBeTruthy();
    expect(msFieldErrors({ msCapitalReal: '' }, 'Real')).toEqual({});
  });
});

describe('Masaniello profit target (spec 0006)', () => {
  const g = 1 / msTable(10, 6, 92)[10][6] - 1;

  test('fixed capital: sessions = ceil(target / (capital * g))', () => {
    const r = msSessionsToTarget(200, 0, 50, false, 500, 10, 6, 92);
    expect(r.sessions).toBe(Math.ceil(200 / (50 * g) - 1e-9));
  });

  test('compounding needs fewer sessions than fixed for a large target', () => {
    const fixed = msSessionsToTarget(2000, 0, 50, false, 50, 10, 6, 92).sessions;
    const follow = msSessionsToTarget(2000, 0, 50, true, 50, 10, 6, 92).sessions;
    expect(follow).toBeLessThan(fixed);
  });

  test('exact messages for empty, below minimum, too many, reached', () => {
    expect(msTargetAnswer({ targetDollars: null }).text).toBe('Set a profit target to see how many sessions it takes.');
    const base = { progress: { count: 0, profit: 0 }, balance: 500, N: 10, K: 6, payout: 92 };
    expect(msTargetAnswer({ ...base, targetDollars: 100, capital: 1, followBalance: false }).text).toMatch(/^Raise Capital to at least \$/);
    expect(msTargetAnswer({ ...base, targetDollars: 100, capital: 1, followBalance: true, balance: 1 }).text).toMatch(/^Balance is below the \$.* minimum for 6 of 10\.$/);
    expect(msTargetAnswer({ ...base, targetDollars: 1e6, capital: 10, followBalance: false }).text).toBe('More than 100 sessions at this plan. Lower the target or change N and K.');
    expect(msTargetAnswer({ ...base, targetDollars: 100, capital: 100, followBalance: false, progress: { count: 3, profit: 120 } }).text).toBe('Target reached: +$120.00 in 3 sessions.');
    expect(msTargetAnswer({ ...base, targetDollars: 1, capital: 100, followBalance: false }).text).toBe('About 1 session to reach $1.00');
  });

  test('percent target converts on the balance and validates', () => {
    expect(msTargetToDollars('10', '%', 500)).toBe(50);
    expect(msTargetToDollars('', '$', 500)).toBeNull();
    expect(msFieldErrors({ msTargetValueDemo: '10', msTargetUnitDemo: '%' }, 'Demo').msTargetValue).toBeUndefined();
    expect(msFieldErrors({ msTargetValueDemo: '0.05', msTargetUnitDemo: '%' }, 'Demo').msTargetValue).toBeTruthy();
    expect(msFieldErrors({ msTargetValueDemo: '0', msTargetUnitDemo: '$' }, 'Demo').msTargetValue).toBeTruthy();
    expect(msFieldErrors({ msTargetValueDemo: '1000001' }, 'Demo').msTargetValue).toBeTruthy();
  });

  test('progress counts in end order and stops at the crossing session', () => {
    const s = (id, end, pnl, over = {}) => ({ id, msN: 10, isActive: false, endTime: end, sPnl: pnl, ...over });
    const r = msTargetProgress([s('d', 4, 20), s('c', 3, 50), s('a', 1, 30), s('b', 2, 40)], 100);
    expect(r).toEqual({ count: 3, profit: 120, reached: true });
    const ignored = msTargetProgress([s('y', 9, 10, { msN: null }), s('z', 9, 10, { isActive: true })], 100);
    expect(ignored).toEqual({ count: 0, profit: 0, reached: false });
  });

  test('counter label: x includes active, loss raises y, reached, no target, other style', () => {
    const settings = { moneyMgmtStyleDemo: 'MASANIELLO', msTargetValueDemo: 100, msTargetUnitDemo: '$', msCapitalDemo: 50 };
    const ended = { id: 'e', accountMode: 'DEMO', msN: 10, isActive: false, endTime: 5, sPnl: -50 };
    const active = { id: 'a', accountMode: 'DEMO', msN: 10, isActive: true, endTime: null, sPnl: 0 };
    const base = msCounterLabel(settings, 'DEMO', 500, [active], 500);
    expect(base).toMatch(/^Session 1\/\d+$/);
    const afterLoss = msCounterLabel(settings, 'DEMO', 500, [ended, active], 500);
    expect(Number(afterLoss.split('/')[1])).toBeGreaterThan(Number(base.split('/')[1]));
    const won = { ...ended, id: 'w', sPnl: 150 };
    expect(msCounterLabel(settings, 'DEMO', 500, [won], 500)).toBe('Target reached · 1 session');
    expect(msCounterLabel({ ...settings, msTargetValueDemo: null }, 'DEMO', 500, [ended, active], 500)).toBe('Session 2');
    expect(msCounterLabel({ moneyMgmtStyleDemo: 'FIXED' }, 'DEMO', 500, [active], 500)).toBeNull();
  });

  // covers: AC-7 (bug: raising the target reset sessions done to zero)
  test('raising the target keeps sessions done and only grows the total', () => {
    const settings = { moneyMgmtStyleDemo: 'MASANIELLO', msTargetValueDemo: 100, msTargetUnitDemo: '$', msCapitalDemo: 50 };
    const done = [1, 2, 3].map(i => ({ id: `d${i}`, accountMode: 'DEMO', msN: 10, isActive: false, endTime: 5 + i, sPnl: 10 }));
    const active = { id: 'a', accountMode: 'DEMO', msN: 10, isActive: true, endTime: null, sPnl: 0 };
    const before = msCounterLabel(settings, 'DEMO', 500, [...done, active], 500);
    const after = msCounterLabel({ ...settings, msTargetValueDemo: 1000 }, 'DEMO', 500, [...done, active], 500);
    expect(before).toMatch(/^Session 4\/\d+$/);
    expect(after).toMatch(/^Session 4\/\d+$/);
    expect(Number(after.split('/')[1])).toBeGreaterThan(Number(before.split('/')[1]));
  });

  // covers: daily goal (a % target uses the balance at the start of the day)
  test('a percent target follows the day start balance, not the current one', () => {
    const settings = { moneyMgmtStyleDemo: 'MASANIELLO', msTargetValueDemo: 10, msTargetUnitDemo: '%', msCapitalDemo: 50 };
    const won = { id: 'w', accountMode: 'DEMO', msN: 10, isActive: false, endTime: 5, sPnl: 50 };
    // 10% of 500 = 50: reached. Current balance 900 must not move the goal to 90.
    expect(msCounterLabel(settings, 'DEMO', 900, [won], 500)).toBe('Target reached · 1 session');
    expect(msCounterLabel(settings, 'DEMO', 900, [won], 1000)).toMatch(/^Session 1\/\d+$/);
  });

  test('auto copy balance makes capital follow the balance', () => {
    expect(getMsCapitalForMode({ msCapitalDemo: 50 }, 'DEMO', 300)).toBe(50);
    expect(getMsCapitalForMode({ msCapitalDemo: 50, msAutoCopyBalanceDemo: true }, 'DEMO', 300)).toBe(300);
  });

  test('Masaniello loss limits no longer lock the mode; AM loss targets still do', () => {
    const ms = [1, 2].map(i => ({ id: i, accountMode: 'DEMO', endReason: 'MS_LOSS_LIMIT' }));
    const am = [1, 2].map(i => ({ id: i, accountMode: 'DEMO', endReason: 'AM_LOSS_TARGET' }));
    expect(amPlLossTargetSessionCount({ sessions: ms }, 'DEMO')).toBe(0);
    expect(amPlLossTargetSessionCount({ sessions: am }, 'DEMO')).toBe(2);
  });

  test('Stop Loss always ends the cycle; plan rules win; draw never ends', () => {
    const on = { msStopLossPctDemo: 30 };
    const lossy = cycle({ msLosses: 1, sPnl: -35 });
    expect(checkMasanielloSessionEnd(lossy, on, 'DEMO')).toBe('MS_STOP_LOSS');
    expect(checkMasanielloSessionEnd(lossy, { msStopLossPctDemo: 50 }, 'DEMO')).toBeNull();
    expect(checkMasanielloSessionEnd(lossy, { ...on, msStopLossEndsDemo: false }, 'DEMO')).toBe('MS_STOP_LOSS'); // old key ignored
    expect(checkMasanielloSessionEnd(cycle({ msCapital: 3.24, msLosses: 3, sPnl: -3.24 }), {}, 'DEMO')).toBe('MS_STOP_LOSS'); // 100% line: capital used up
    expect(checkMasanielloSessionEnd(cycle({ msWins: 6, msLosses: 1, sPnl: -35 }), on, 'DEMO')).toBe('MS_TARGET');
    expect(checkMasanielloSessionEnd(cycle({ sPnl: 0 }), on, 'DEMO')).toBeNull();
    const ms = [1, 2].map(i => ({ id: i, accountMode: 'DEMO', endReason: 'MS_STOP_LOSS' }));
    expect(amPlLossTargetSessionCount({ sessions: ms }, 'DEMO')).toBe(0);
  });
});

describe('Masaniello target helpers (spec 0006)', () => {
  // covers: AC-11, AC-13, AC-16
  test('per mode toggles default as the spec says and read each mode on its own', () => {
    expect(getMsAutoCopyBalanceForMode({}, 'DEMO')).toBe(false);
    expect(getMsAlertSessionEndForMode({}, 'DEMO')).toBe(true);
    expect(getMsAlertTargetReachedForMode({}, 'DEMO')).toBe(true);
    expect(getMsAlertSessionEndForMode({ msAlertSessionEndDemo: false }, 'DEMO')).toBe(false);
  });

  // covers: daily goal
  test('the daily goal in dollars: fixed $, or a % of the day start balance; null when missing', () => {
    expect(msTargetDollarsToday({}, 'DEMO', 500)).toBeNull();
    expect(msTargetDollarsToday({ msTargetValueDemo: 'x' }, 'DEMO', 500)).toBeNull();
    expect(msTargetDollarsToday({ msTargetValueReal: 75 }, 'REAL', 500)).toBe(75);
    expect(msTargetDollarsToday({ msTargetValueReal: 75 }, 'DEMO', 500)).toBeNull();
    expect(msTargetDollarsToday({ msTargetValueDemo: 10, msTargetUnitDemo: '%' }, 'DEMO', 500)).toBe(50);
    expect(msTargetDollarsToday({ msTargetValueDemo: 10, msTargetUnitDemo: '%' }, 'DEMO', 0)).toBeNull();
  });

  // covers: AC-7
  test('mode progress counts only that mode, and is null with no target', () => {
    const settings = { msTargetValueDemo: 100, msTargetUnitDemo: '$' };
    const mk = (id, mode, pnl, end) => ({ id, accountMode: mode, msN: 10, isActive: false, endTime: end, sPnl: pnl });
    const r = msModeProgress(settings, 'DEMO', [mk('a', 'DEMO', 60, 2), mk('t', 'DEMO', 50, 3), mk('real', 'REAL', 999, 4)], 500);
    expect(r).toMatchObject({ target: 100, count: 2, profit: 110, reached: true });
    expect(msModeProgress({}, 'DEMO', [], 500)).toBeNull();
  });

  // covers: AC-7
  test('no goal means no progress', () => {
    const done = { id: 'e', msN: 10, isActive: false, endTime: 5, sPnl: 500 };
    expect(msTargetProgress([done], 0)).toEqual({ count: 0, profit: 0, reached: false });
    expect(msTargetProgress([done], null)).toEqual({ count: 0, profit: 0, reached: false });
  });
});

describe('Day start balance (spec 0006 daily goal)', () => {
  const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); };
  const settings = { startingBalanceDemo: 500, startingBalanceReal: 1000 };
  const tr = (mode, pnl, ts, outcome = 'WIN') => ({ accountMode: mode, pnl, timestamp: ts, outcome });

  test('counts only trades before local midnight, for that mode', () => {
    const midnight = startOfToday();
    const trades = [tr('DEMO', 40, midnight - 1), tr('DEMO', 25, midnight), tr('DEMO', 25, midnight + 5), tr('REAL', 99, midnight - 1)];
    expect(dayStartBalForMode(settings, trades, [], 'DEMO')).toBe(540);
    expect(dayStartBalForMode(settings, trades, [], 'REAL')).toBe(1099);
  });

  test('ignores pending trades, and takes Real withdrawals before midnight only', () => {
    const midnight = startOfToday();
    const trades = [tr('DEMO', 40, midnight - 1, 'PENDING')];
    expect(dayStartBalForMode(settings, trades, [], 'DEMO')).toBe(500);
    const wds = [{ amount: 100, timestamp: midnight - 1 }, { amount: 50, timestamp: midnight + 1 }];
    expect(dayStartBalForMode(settings, [], wds, 'REAL')).toBe(900);
    expect(dayStartBalForMode(settings, [], wds, 'DEMO')).toBe(500); // Demo has no withdrawals
  });

  test('a trade with no timestamp is left out, not counted as zero', () => {
    expect(dayStartBalForMode(settings, [tr('DEMO', 40, undefined)], [], 'DEMO')).toBe(500);
  });
});

describe('Masaniello alerts (spec 0006 AC-13 to AC-15)', () => {
  const settings = { moneyMgmtStyleDemo: 'MASANIELLO', msStopLossPctDemo: 30, msTargetValueDemo: 100, msTargetUnitDemo: '$' };
  const fresh = () => ({ alerted: new Set(), prevReached: {} });
  const ms = (over = {}) => ({ id: 's1', accountMode: 'DEMO', msN: 10, msK: 6, msCapital: 100, isActive: true, endTime: null, sPnl: 0, ...over });
  const run = o => msAlertEvents({ dayBal: () => 500, settings, st: fresh(), ...o });
  const titles = ev => ev.map(e => e.title);

  test('first load only seeds: no alert for sessions already ended', () => {
    const ended = ms({ isActive: false, endTime: 5, endReason: 'MS_TARGET' });
    expect(run({ prevSessions: null, sessions: [ended] })).toEqual([]);
  });

  test('a cycle that ends after load gives one event with won, lost, or Stop Loss wording', () => {
    for (const [reason, what] of [['MS_TARGET', 'won'], ['MS_LOSS_LIMIT', 'lost'], ['MS_STOP_LOSS', 'stopped by Stop Loss'], ['MS_MANUAL', 'ended']]) {
      const ev = run({ prevSessions: [ms()], sessions: [ms({ isActive: false, endTime: 9, endReason: reason })] });
      expect(titles(ev)).toEqual([`Masaniello cycle ${what}`]);
    }
  });

  test('the cycle end alert is silent when its toggle is off, and never falls back to the generic chime', () => {
    const off = { ...settings, msAlertSessionEndDemo: false };
    const ev = run({ settings: off, prevSessions: [ms()], sessions: [ms({ isActive: false, endTime: 9, endReason: 'MS_LOSS_LIMIT' })] });
    expect(ev).toEqual([]);
  });

  test('a non Masaniello session still gets the Session locked alert', () => {
    const fixed = { id: 'f', accountMode: 'DEMO', isActive: false, endTime: 9, lockReason: 'max trades' };
    const ev = run({ prevSessions: [{ ...fixed, isActive: true, endTime: null }], sessions: [fixed] });
    expect(titles(ev)).toEqual(['Session locked']);
  });

  test('an ended session alerts only once', () => {
    const st = fresh();
    const next = [ms({ isActive: false, endTime: 9, endReason: 'MS_LOSS_LIMIT' })];
    expect(run({ st, prevSessions: [ms()], sessions: next })).toHaveLength(1);
    expect(run({ st, prevSessions: [ms()], sessions: next })).toHaveLength(0);
  });

  test('target reached fires once on a flip after load, and one chime covers a coinciding cycle end', () => {
    const st = fresh();
    expect(run({ st, prevSessions: null, sessions: [] })).toEqual([]);
    const win = ms({ isActive: false, endTime: 9, endReason: 'MS_TARGET', sPnl: 150 });
    expect(titles(run({ st, prevSessions: [ms()], sessions: [win] }))).toEqual(['Profit target reached']);
    expect(run({ st, prevSessions: [win], sessions: [win] })).toEqual([]);
  });

  // covers: AC-10, AC-15
  test('lowering the goal under profit already made gives no alert; a later flip on the new goal still fires', () => {
    const st = fresh();
    const done = ms({ isActive: false, endTime: 5, endReason: 'MS_LOSS_LIMIT', sPnl: 90 });
    expect(run({ st, prevSessions: null, sessions: [done] })).toEqual([]);
    const lowered = { ...settings, msTargetValueDemo: 80 };
    expect(run({ st, settings: lowered, prevSessions: [done], sessions: [done] })).toEqual([]);
    const raised = { ...settings, msTargetValueDemo: 150 };
    expect(run({ st, settings: raised, prevSessions: [done], sessions: [done] })).toEqual([]);
    const win = ms({ id: 's2', isActive: false, endTime: 9, endReason: 'MS_TARGET', sPnl: 70 });
    expect(titles(run({ st, settings: raised, prevSessions: [ms({ id: 's2' }), done], sessions: [win, done] }))).toEqual(['Profit target reached']);
  });

  // covers: AC-10, AC-15 (review: editing back to an earlier goal must not chime)
  test('editing the goal back to an earlier value gives no alert', () => {
    const st = fresh();
    const done = ms({ id: 'd', isActive: false, endTime: 5, endReason: 'MS_LOSS_LIMIT', sPnl: 90 });
    const win = ms({ id: 'w', isActive: false, endTime: 9, endReason: 'MS_LOSS_LIMIT', sPnl: 20 });
    const raised = { ...settings, msTargetValueDemo: 200 };
    run({ st, prevSessions: null, sessions: [done] });
    run({ st, settings: raised, prevSessions: [done], sessions: [done] });
    expect(run({ st, settings: raised, prevSessions: [done], sessions: [done, win] }).map(e => e.title)).toEqual(['Masaniello cycle lost']);
    expect(titles(run({ st, prevSessions: [done, win], sessions: [done, win] }))).toEqual([]);
  });

  // covers: daily goal (a new day starts again: reached yesterday, reached again today fires once)
  test('a new day resets the latch: reaching the goal again today fires exactly once', () => {
    const st = fresh();
    const yesterday = ms({ id: 'y', isActive: false, endTime: 5, endReason: 'MS_TARGET', sPnl: 150 });
    run({ st, prevSessions: null, sessions: [yesterday] });
    expect(run({ st, prevSessions: [yesterday], sessions: [] })).toEqual([]); // midnight: today's list is empty
    const today = ms({ id: 't', isActive: false, endTime: 9, endReason: 'MS_TARGET', sPnl: 150 });
    expect(titles(run({ st, prevSessions: [ms({ id: 't' })], sessions: [today] }))).toEqual(['Profit target reached']);
    expect(run({ st, prevSessions: [today], sessions: [today] })).toEqual([]);
  });

  test('with the target reached alert off, the cycle end alert still plays', () => {
    const win = ms({ isActive: false, endTime: 9, endReason: 'MS_TARGET', sPnl: 150 });
    const st = fresh();
    const off = { ...settings, msAlertTargetReachedDemo: false };
    run({ settings: off, st, prevSessions: null, sessions: [] });
    expect(titles(run({ settings: off, st, prevSessions: [ms()], sessions: [win] }))).toEqual(['Masaniello cycle won']);
  });

  // covers: AC-18
  test('no alert while an active cycle crosses the Stop Loss line; only the cycle end alerts', () => {
    const hit = [ms({ sPnl: -35 })];
    expect(run({ prevSessions: hit, sessions: hit })).toEqual([]);
    const ended = [ms({ sPnl: -35, isActive: false, endTime: 9, endReason: 'MS_STOP_LOSS' })];
    expect(titles(run({ prevSessions: hit, sessions: ended }))).toEqual(['Masaniello cycle stopped by Stop Loss']);
  });

  test('the Stop Loss line helper matches the dollar line and ignores draws and wins', () => {
    expect(msStopLossHit(ms({ sPnl: -30 }), settings, 'DEMO')).toBe(true);
    expect(msStopLossHit(ms({ sPnl: -29.99 }), settings, 'DEMO')).toBe(false);
    expect(msStopLossHit(ms({ sPnl: 0 }), settings, 'DEMO')).toBe(false);
    expect(msStopLossHit(ms({ sPnl: 50 }), settings, 'DEMO')).toBe(false);
  });
});

describe('Masaniello settings panel (spec 0006)', () => {
  const base = {
    moneyMgmtStyleDemo: 'MASANIELLO', startingBalanceDemo: 500, startingBalanceReal: 0,
    msTotalTradesDemo: 10, msWinTradesDemo: 6, msPayoutPctDemo: 92, msStopLossPctDemo: 20,
  };
  async function open(settings = {}, { sessions = [] } = {}) {
    const saveSettings = jest.fn().mockResolvedValue(undefined);
    const user = {
      click: async el => { fireEvent.click(el); },
      type: async (el, v) => { fireEvent.change(el, { target: { value: v } }); },
      clear: async el => { fireEvent.change(el, { target: { value: '' } }); },
    };
    render(<Cfg settings={{ ...base, ...settings }} saveSettings={saveSettings} ss={{ sessions }} trades={[]} wds={[]}
      strategies={[]} mode="DEMO" resetAccount={jest.fn()} addStrategy={jest.fn()} updateStrategy={jest.fn()} deleteStrategy={jest.fn()} />);
    await user.click(screen.getByRole('tab', { name: 'Money management' }));
    return { user, saveSettings, target: screen.getByLabelText('Profit target') };
  }
  const lastSaved = fn => fn.mock.calls[fn.mock.calls.length - 1][0];

  // covers: AC-6
  test('shows the empty target message before anything is typed', async () => {
    await open();
    expect(screen.getByText('Set a profit target to see how many sessions it takes.')).toBeInTheDocument();
  });

  // covers: AC-1, AC-2, AC-3
  test('a dollar target updates the answer line and saves the typed value and unit', async () => {
    const { user, saveSettings, target } = await open({ msTargetDollarsDemo: 50, msTargetSetAtDemo: 111 }); // stale keys from the old design
    await user.type(target, '200');
    expect(screen.getByText(/About 1 session to reach \$200\.00/)).toBeInTheDocument();
    expect(screen.getByText('Assumes every cycle reaches K wins')).toBeInTheDocument();
    expect(screen.getByText(/A daily goal/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(saveSettings).toHaveBeenCalled());
    expect(lastSaved(saveSettings)).toMatchObject({ msTargetValueDemo: 200, msTargetUnitDemo: '$' });
    expect(lastSaved(saveSettings)).not.toHaveProperty('msTargetDollarsDemo');
    expect(lastSaved(saveSettings)).not.toHaveProperty('msTargetSetAtDemo');
  });

  // covers: AC-2
  test('a percent target shows today as dollars of the day start balance and saves the percent', async () => {
    const { user, saveSettings, target } = await open();
    await user.type(target, '10');
    await user.click(screen.getByRole('button', { name: '%' }));
    expect(screen.getByText(/= \$50\.00 today/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(saveSettings).toHaveBeenCalled());
    expect(lastSaved(saveSettings)).toMatchObject({ msTargetValueDemo: 10, msTargetUnitDemo: '%' });
  });

  // covers: AC-1
  test('an out of range percent shows an inline error tied to the field', async () => {
    const { user, target } = await open();
    await user.type(target, '2000');
    await user.click(screen.getByRole('button', { name: '%' }));
    expect(screen.getByText('Percent from 0.1 to 1000')).toBeInTheDocument();
    expect(target).toHaveAttribute('aria-invalid', 'true');
    expect(screen.queryByText(/About \d+ sessions/)).not.toBeInTheDocument();
  });

  // covers: AC-1
  test('an invalid target keeps the last saved target', async () => {
    const { user, saveSettings, target } = await open({ msTargetValueDemo: 100, msTargetUnitDemo: '$' });
    await user.clear(target);
    await user.type(target, '0');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(saveSettings).toHaveBeenCalled());
    expect(lastSaved(saveSettings)).toMatchObject({ msTargetValueDemo: 100, msTargetUnitDemo: '$' });
  });

  // covers: AC-1, AC-2 (a % goal needs a balance above 0 at the start of the day)
  test('a percent goal with no day start balance says so and shows no answer line', async () => {
    const { user, target } = await open({ startingBalanceDemo: 0 });
    await user.type(target, '10');
    await user.click(screen.getByRole('button', { name: '%' }));
    expect(screen.getByText(/A % goal needs a balance above 0 at the start of the day/)).toBeInTheDocument();
    expect(screen.queryByText(/= \$0\.00 today/)).not.toBeInTheDocument();
    expect(screen.queryByText(/About \d+ sessions?/)).not.toBeInTheDocument();
  });

  // covers: AC-1, AC-2 (a % goal under $0.01 is not a goal either)
  test('a percent goal that rounds under one cent says so', async () => {
    const { user, target } = await open({ startingBalanceDemo: 4 });
    await user.type(target, '0.1');
    await user.click(screen.getByRole('button', { name: '%' }));
    expect(screen.getByText(/a goal of at least \$0\.01/)).toBeInTheDocument();
    expect(screen.queryByText(/About \d+ sessions?/)).not.toBeInTheDocument();
  });

  // covers: AC-1
  test('switching the unit on an empty target changes nothing', async () => {
    await open();
    fireEvent.click(screen.getByRole('button', { name: '%' }));
    expect(screen.getByRole('button', { name: '$' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('No changes')).toBeInTheDocument();
  });

  // covers: AC-3, AC-7, daily goal (the bug you hit: raising the target must keep today sessions)
  describe('editing a saved target', () => {
    const saved = { msTargetValueDemo: 100, msTargetUnitDemo: '$' };
    const done = { id: 'h1', accountMode: 'DEMO', msN: 10, isActive: false, endTime: 200, startTime: 100, sPnl: 90 };

    test('raising the goal subtracts profit already made today', async () => {
      const { user, target } = await open(saved, { sessions: [done] });
      await user.clear(target);
      await user.type(target, '110');
      // 20 left, not 110: one session covers it at this plan
      expect(screen.getByText(/About 1 session to reach \$110\.00/)).toBeInTheDocument();
    });

    test('lowering the goal under profit made says reached', async () => {
      const { user, target } = await open(saved, { sessions: [done] });
      await user.clear(target);
      await user.type(target, '80');
      expect(screen.getByText(/Target reached: \+\$90\.00 in 1 session\./)).toBeInTheDocument();
    });

    test('saving a raised goal stores only the new value', async () => {
      const { user, saveSettings, target } = await open({ ...saved, msTargetValueReal: 50, msTargetUnitReal: '$' }, { sessions: [done] });
      await user.clear(target);
      await user.type(target, '150');
      await user.click(screen.getByRole('button', { name: 'Save' }));
      await waitFor(() => expect(saveSettings).toHaveBeenCalled());
      expect(lastSaved(saveSettings)).toMatchObject({ msTargetValueDemo: 150, msTargetValueReal: 50 });
    });

    test('clearing the goal saves no target', async () => {
      const { user, saveSettings, target } = await open(saved, { sessions: [done] });
      await user.clear(target);
      await user.click(screen.getByRole('button', { name: 'Save' }));
      await waitFor(() => expect(saveSettings).toHaveBeenCalled());
      expect(lastSaved(saveSettings)).toMatchObject({ msTargetValueDemo: null });
    });

    test('sessions of the other mode never count', async () => {
      const { user, target } = await open(saved, { sessions: [{ ...done, accountMode: 'REAL' }] });
      await user.clear(target);
      await user.type(target, '110');
      expect(screen.getByText(/About \d+ sessions? to reach \$110\.00/)).toBeInTheDocument();
      expect(screen.queryByText(/Target reached:/)).not.toBeInTheDocument();
    });
  });

  // covers: AC-11
  test('auto copy balance disables the Capital field and says why', async () => {
    const { user } = await open({ msCapitalDemo: 50 });
    const capital = screen.getByLabelText('Capital ($)');
    expect(capital).toBeEnabled();
    await user.click(screen.getByRole('checkbox', { name: /Auto copy balance/ }));
    expect(capital).toBeDisabled();
    expect(screen.getAllByText('Following your balance').length).toBeGreaterThan(0);
  });

  // covers: AC-18, AC-19
  test('the end hint is always shown and the two removed toggles are gone', async () => {
    await open({ msStopLossEndsDemo: true, msAlertStopLossDemo: true });
    expect(screen.getByText('Cycle ends at a loss of $100.00')).toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: /Stop Loss ends cycle/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: /Stop loss alert/ })).not.toBeInTheDocument();
  });

  // covers: AC-20
  test('Max Loss Limit shows the straight run count and the plan limit when below N-K+1', async () => {
    await open(); // balance 500, Stop Loss 20% = $100 line, first stake $154.50 crosses it
    expect(screen.getByText('1 losses')).toBeInTheDocument();
    expect(screen.getByText('plan limit 5')).toBeInTheDocument();
    expect(screen.getByText(/Counts a straight losing run/)).toBeInTheDocument();
  });

  // covers: AC-22
  test('Max Loss Limit updates live when Stop Loss % changes', async () => {
    const { user } = await open();
    expect(screen.getByText('1 losses')).toBeInTheDocument(); // 20% of $500
    const sl = screen.getByLabelText('Stop Loss %');
    await user.clear(sl);
    await user.type(sl, '100');
    expect(screen.getByText('5 losses')).toBeInTheDocument();
    expect(screen.queryByText(/plan limit/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Counts a straight losing run/)).not.toBeInTheDocument();
  });

  // covers: AC-13, AC-18
  test('the two alert toggles start on', async () => {
    await open();
    expect(screen.getByRole('checkbox', { name: /Cycle end alert/ })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /Target reached alert/ })).toBeChecked();
  });
});
