import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { msTable, msPlanSummary, liveMasanielloNextStake, advanceMasaniello, checkMasanielloSessionEnd, msFieldErrors, msSessionsToTarget, msTargetProgress, msTargetToDollars, msTargetAnswer, msCounterLabel, getMsCapitalForMode, amPlLossTargetSessionCount, msMergeSessions, msModeProgress, getMsAutoCopyBalanceForMode, getMsAlertSessionEndForMode, getMsAlertTargetReachedForMode, getMsAlertStopLossForMode, getMsStopLossEndsForMode, getMsTargetDollarsForMode, getMsTargetSetAtForMode, msAlertEvents, msStopLossHit, Cfg } from './App';

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
    expect(p.maxLossLimit).toBe(5);
    expect(msPlanSummary(200, 10, 6, 92, 500).stopLoss).toBe(200);
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
    expect(msFieldErrors({ msTargetValueDemo: '10', msTargetUnitDemo: '%' }, 'Demo', 0).msTargetValue).toBeTruthy();
    expect(msFieldErrors({ msTargetValueDemo: '10', msTargetUnitDemo: '%' }, 'Demo', 500).msTargetValue).toBeUndefined();
    expect(msFieldErrors({ msTargetValueDemo: '0.1', msTargetUnitDemo: '%' }, 'Demo', 1).msTargetValue).toBeTruthy();
    expect(msFieldErrors({ msTargetValueDemo: '0', msTargetUnitDemo: '$' }, 'Demo', 500).msTargetValue).toBeTruthy();
    expect(msFieldErrors({ msTargetValueDemo: '1000001' }, 'Demo', 500).msTargetValue).toBeTruthy();
  });

  test('progress counts in end order and stops at the crossing session', () => {
    const s = (id, end, pnl, over = {}) => ({ id, msN: 10, isActive: false, endTime: end, sPnl: pnl, ...over });
    const r = msTargetProgress([s('d', 4, 20), s('c', 3, 50), s('a', 1, 30), s('b', 2, 40), s('old', 0, 999)], 100, 1);
    expect(r).toEqual({ count: 3, profit: 120, reached: true });
    const ignored = msTargetProgress([s('x', 5, 10), s('y', 9, 10, { msN: null }), s('z', 9, 10, { isActive: true })], 100, 6);
    expect(ignored).toEqual({ count: 0, profit: 0, reached: false });
  });

  test('counter label: x includes active, loss raises y, reached, no target, other style', () => {
    const settings = { moneyMgmtStyleDemo: 'MASANIELLO', msTargetDollarsDemo: 100, msTargetSetAtDemo: 1, msCapitalDemo: 50 };
    const ended = { id: 'e', accountMode: 'DEMO', msN: 10, isActive: false, endTime: 5, sPnl: -50 };
    const active = { id: 'a', accountMode: 'DEMO', msN: 10, isActive: true, endTime: null, sPnl: 0 };
    const ok = { status: 'ok', sessions: [] };
    const base = msCounterLabel(settings, 'DEMO', 500, ok, [active]);
    expect(base).toMatch(/^Session 1\/\d+$/);
    const afterLoss = msCounterLabel(settings, 'DEMO', 500, ok, [ended, active]);
    expect(Number(afterLoss.split('/')[1])).toBeGreaterThan(Number(base.split('/')[1]));
    const won = { ...ended, id: 'w', sPnl: 150 };
    expect(msCounterLabel(settings, 'DEMO', 500, ok, [won])).toBe('Target reached · 1 session');
    expect(msCounterLabel(settings, 'DEMO', 500, { status: 'loading' }, [active])).toBe('Session 1');
    expect(msCounterLabel({ ...settings, msTargetDollarsDemo: null }, 'DEMO', 500, ok, [ended, active])).toBe('Session 2');
    expect(msCounterLabel({ moneyMgmtStyleDemo: 'FIXED' }, 'DEMO', 500, ok, [active])).toBeNull();
  });

  // covers: AC-7, AC-10 (bug: raising the target reset sessions done to zero)
  test('raising the target keeps sessions done and only grows the total', () => {
    const settings = { moneyMgmtStyleDemo: 'MASANIELLO', msTargetDollarsDemo: 100, msTargetSetAtDemo: 1, msCapitalDemo: 50 };
    const done = [1, 2, 3].map(i => ({ id: `d${i}`, accountMode: 'DEMO', msN: 10, isActive: false, endTime: 5 + i, sPnl: 10 }));
    const active = { id: 'a', accountMode: 'DEMO', msN: 10, isActive: true, endTime: null, sPnl: 0 };
    const ok = { status: 'ok', sessions: [] };
    const before = msCounterLabel(settings, 'DEMO', 500, ok, [...done, active]);
    const after = msCounterLabel({ ...settings, msTargetDollarsDemo: 1000 }, 'DEMO', 500, ok, [...done, active]);
    expect(before).toMatch(/^Session 4\/\d+$/);
    expect(after).toMatch(/^Session 4\/\d+$/);
    expect(Number(after.split('/')[1])).toBeGreaterThan(Number(before.split('/')[1]));
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

  test('Stop Loss ends cycle only when toggled on; plan rules win; draw never ends', () => {
    const on = { msStopLossEndsDemo: true, msStopLossPctDemo: 30 };
    const lossy = cycle({ msLosses: 1, sPnl: -35 });
    expect(checkMasanielloSessionEnd(lossy, on, 'DEMO')).toBe('MS_STOP_LOSS');
    expect(checkMasanielloSessionEnd(lossy, { ...on, msStopLossEndsDemo: false }, 'DEMO')).toBeNull();
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
    expect(getMsAlertStopLossForMode({}, 'DEMO')).toBe(false);
    expect(getMsStopLossEndsForMode({}, 'DEMO')).toBe(false);
    expect(getMsStopLossEndsForMode({ msStopLossEndsReal: true }, 'DEMO')).toBe(false);
    expect(getMsStopLossEndsForMode({ msStopLossEndsReal: true }, 'REAL')).toBe(true);
    expect(getMsAlertSessionEndForMode({ msAlertSessionEndDemo: false }, 'DEMO')).toBe(false);
  });

  // covers: AC-2, AC-10
  test('target getters return null for missing or non numeric values', () => {
    expect(getMsTargetDollarsForMode({}, 'DEMO')).toBeNull();
    expect(getMsTargetSetAtForMode({ msTargetSetAtDemo: 'x' }, 'DEMO')).toBeNull();
    expect(getMsTargetDollarsForMode({ msTargetDollarsReal: 75 }, 'REAL')).toBe(75);
    expect(getMsTargetDollarsForMode({ msTargetDollarsReal: 75 }, 'DEMO')).toBeNull();
  });

  // covers: AC-9
  test('merge keeps earlier history and lets a live session replace the stored copy', () => {
    const merged = msMergeSessions([{ id: 'a', sPnl: 1 }, { id: 'b', sPnl: 2 }], [{ id: 'b', sPnl: 9 }, { id: 'c', sPnl: 3 }]);
    expect(merged.sort((x, y) => x.id.localeCompare(y.id))).toEqual([{ id: 'a', sPnl: 1 }, { id: 'b', sPnl: 9 }, { id: 'c', sPnl: 3 }]);
    expect(msMergeSessions(undefined, undefined)).toEqual([]);
  });

  // covers: AC-7, AC-9
  test('mode progress joins history with today, only for that mode, and is null with no target', () => {
    const settings = { msTargetDollarsDemo: 100, msTargetSetAtDemo: 1 };
    const mk = (id, mode, pnl, end) => ({ id, accountMode: mode, msN: 10, isActive: false, endTime: end, sPnl: pnl });
    const hist = { status: 'ok', sessions: [mk('h', 'DEMO', 60, 2)] };
    const r = msModeProgress(settings, 'DEMO', hist, [mk('t', 'DEMO', 50, 3), mk('real', 'REAL', 999, 4)]);
    expect(r).toMatchObject({ target: 100, status: 'ok', count: 2, profit: 110, reached: true });
    expect(msModeProgress({}, 'DEMO', hist, [])).toBeNull();
    expect(msModeProgress(settings, 'DEMO', undefined, []).status).toBe('loading');
  });

  // covers: AC-7
  test('a session that ended before the target was set never counts', () => {
    const early = { id: 'e', msN: 10, isActive: false, endTime: 5, sPnl: 500 };
    expect(msTargetProgress([early], 100, 6)).toEqual({ count: 0, profit: 0, reached: false });
    expect(msTargetProgress([early], 0, 1)).toEqual({ count: 0, profit: 0, reached: false });
  });
});

describe('Masaniello alerts (spec 0006 AC-13 to AC-15)', () => {
  const settings = { moneyMgmtStyleDemo: 'MASANIELLO', msStopLossPctDemo: 30, msTargetDollarsDemo: 100, msTargetSetAtDemo: 1 };
  const fresh = () => ({ alerted: new Set(), stopLossAlerted: new Set(), prevReached: {} });
  const ms = (over = {}) => ({ id: 's1', accountMode: 'DEMO', msN: 10, msK: 6, msCapital: 100, isActive: true, endTime: null, sPnl: 0, ...over });
  const run = o => msAlertEvents({ histFor: () => ({ status: 'ok', sessions: [] }), settings, st: fresh(), ...o });
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
    const lowered = { ...settings, msTargetDollarsDemo: 80 };
    expect(run({ st, settings: lowered, prevSessions: [done], sessions: [done] })).toEqual([]);
    const raised = { ...settings, msTargetDollarsDemo: 150 };
    expect(run({ st, settings: raised, prevSessions: [done], sessions: [done] })).toEqual([]);
    const win = ms({ id: 's2', isActive: false, endTime: 9, endReason: 'MS_TARGET', sPnl: 70 });
    expect(titles(run({ st, settings: raised, prevSessions: [ms({ id: 's2' }), done], sessions: [win, done] }))).toEqual(['Profit target reached']);
  });

  // covers: AC-10, AC-15 (review: editing back to an earlier goal must not chime)
  test('editing the goal back to an earlier value gives no alert', () => {
    const st = fresh();
    const done = ms({ id: 'd', isActive: false, endTime: 5, endReason: 'MS_LOSS_LIMIT', sPnl: 90 });
    const win = ms({ id: 'w', isActive: false, endTime: 9, endReason: 'MS_LOSS_LIMIT', sPnl: 20 });
    const raised = { ...settings, msTargetDollarsDemo: 200 };
    run({ st, prevSessions: null, sessions: [done] });
    run({ st, settings: raised, prevSessions: [done], sessions: [done] });
    expect(run({ st, settings: raised, prevSessions: [done], sessions: [done, win] }).map(e => e.title)).toEqual(['Masaniello cycle lost']);
    expect(titles(run({ st, prevSessions: [done, win], sessions: [done, win] }))).toEqual([]);
  });

  test('target reached is not seeded or fired while history is still loading', () => {
    const st = fresh();
    const loading = () => ({ status: 'loading', sessions: [] });
    const win = ms({ isActive: false, endTime: 9, endReason: 'MS_TARGET', sPnl: 150 });
    run({ st, histFor: loading, prevSessions: null, sessions: [] });
    expect(st.prevReached).toEqual({});
    expect(titles(run({ st, histFor: loading, prevSessions: [ms()], sessions: [win] }))).toEqual(['Masaniello cycle won']);
  });

  test('with the target reached alert off, the cycle end alert still plays', () => {
    const win = ms({ isActive: false, endTime: 9, endReason: 'MS_TARGET', sPnl: 150 });
    const st = fresh();
    const off = { ...settings, msAlertTargetReachedDemo: false };
    run({ settings: off, st, prevSessions: null, sessions: [] });
    expect(titles(run({ settings: off, st, prevSessions: [ms()], sessions: [win] }))).toEqual(['Masaniello cycle won']);
  });

  test('Stop Loss alert fires once per cycle, only when its toggle is on and the line is crossed', () => {
    const on = { ...settings, msAlertStopLossDemo: true };
    const st = fresh();
    expect(run({ settings: on, st, prevSessions: [ms()], sessions: [ms({ sPnl: -20 })] })).toEqual([]);
    const hit = [ms({ sPnl: -35 })];
    expect(titles(run({ settings: on, st, prevSessions: hit, sessions: hit }))).toEqual(['Masaniello stop loss']);
    expect(run({ settings: on, st, prevSessions: hit, sessions: hit })).toEqual([]);
    expect(run({ settings, st: fresh(), prevSessions: hit, sessions: hit })).toEqual([]);
  });

  test('Stop Loss alert stays quiet while Stop Loss ends the cycle', () => {
    const both = { ...settings, msAlertStopLossDemo: true, msStopLossEndsDemo: true };
    const hit = [ms({ sPnl: -35 })];
    expect(run({ settings: both, prevSessions: hit, sessions: hit })).toEqual([]);
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
  async function open(settings = {}, { msHist = {}, sessions = [] } = {}) {
    const saveSettings = jest.fn().mockResolvedValue(undefined);
    const user = {
      click: async el => { fireEvent.click(el); },
      type: async (el, v) => { fireEvent.change(el, { target: { value: v } }); },
      clear: async el => { fireEvent.change(el, { target: { value: '' } }); },
    };
    render(<Cfg settings={{ ...base, ...settings }} saveSettings={saveSettings} ss={{ sessions }} trades={[]} wds={[]}
      strategies={[]} mode="DEMO" msHist={msHist} resetAccount={jest.fn()} addStrategy={jest.fn()} updateStrategy={jest.fn()} deleteStrategy={jest.fn()} />);
    await user.click(screen.getByRole('tab', { name: 'Money management' }));
    return { user, saveSettings, target: screen.getByLabelText('Profit target') };
  }
  const lastSaved = fn => fn.mock.calls[fn.mock.calls.length - 1][0];

  // covers: AC-6
  test('shows the empty target message before anything is typed', async () => {
    await open();
    expect(screen.getByText('Set a profit target to see how many sessions it takes.')).toBeInTheDocument();
  });

  // covers: AC-1, AC-2, AC-3, AC-10
  test('a dollar target updates the answer line and saves dollars with a start time', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(1234567);
    const { user, saveSettings, target } = await open();
    await user.type(target, '200');
    expect(screen.getByText(/About 1 session to reach \$200\.00/)).toBeInTheDocument();
    expect(screen.getByText('Assumes every cycle reaches K wins')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(saveSettings).toHaveBeenCalled());
    expect(lastSaved(saveSettings)).toMatchObject({ msTargetValueDemo: 200, msTargetUnitDemo: '$', msTargetDollarsDemo: 200, msTargetSetAtDemo: 1234567 });
    Date.now.mockRestore();
  });

  // covers: AC-2
  test('a percent target shows the dollar amount and saves it as dollars of the balance', async () => {
    const { user, saveSettings, target } = await open();
    await user.type(target, '10');
    await user.click(screen.getByRole('button', { name: '%' }));
    expect(screen.getByText(/= \$50\.00/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(saveSettings).toHaveBeenCalled());
    expect(lastSaved(saveSettings)).toMatchObject({ msTargetValueDemo: 10, msTargetUnitDemo: '%', msTargetDollarsDemo: 50 });
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

  // covers: AC-1, AC-10
  test('an invalid target keeps the last saved target and start time', async () => {
    const { user, saveSettings, target } = await open({ msTargetValueDemo: 100, msTargetUnitDemo: '$', msTargetDollarsDemo: 100, msTargetSetAtDemo: 111 });
    await user.clear(target);
    await user.type(target, '0');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(saveSettings).toHaveBeenCalled());
    expect(lastSaved(saveSettings)).toMatchObject({ msTargetValueDemo: 100, msTargetDollarsDemo: 100, msTargetSetAtDemo: 111 });
  });

  // covers: AC-1
  test('switching the unit on an empty target changes nothing', async () => {
    await open();
    fireEvent.click(screen.getByRole('button', { name: '%' }));
    expect(screen.getByRole('button', { name: '$' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('No changes')).toBeInTheDocument();
  });

  // covers: AC-2
  test('a saved percent target stays valid after the balance drops to zero', async () => {
    await open({ startingBalanceDemo: 0, msTargetValueDemo: 10, msTargetUnitDemo: '%', msTargetDollarsDemo: 50, msTargetSetAtDemo: 111 });
    expect(screen.getByLabelText('Profit target')).not.toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText(/= \$50\.00/)).toBeInTheDocument();
  });

  // covers: AC-6
  test('a saved target shows a loading line, not a count, while earlier sessions are read', async () => {
    await open({ msTargetValueDemo: 100, msTargetUnitDemo: '$', msTargetDollarsDemo: 100, msTargetSetAtDemo: 111 });
    expect(screen.getByText('Reading your earlier sessions…')).toBeInTheDocument();
    expect(screen.queryByText(/About \d+ sessions?/)).not.toBeInTheDocument();
  });

  // covers: AC-3, AC-7, AC-10 (review: preview must count from the kept start time)
  describe('editing a saved target', () => {
    const saved = { msTargetValueDemo: 100, msTargetUnitDemo: '$', msTargetDollarsDemo: 100, msTargetSetAtDemo: 111 };
    const done = { id: 'h1', accountMode: 'DEMO', msN: 10, isActive: false, endTime: 200, startTime: 100, sPnl: 90 };
    const hist = { 'DEMO:111': { status: 'ok', sessions: [done] } };

    test('raising the goal subtracts profit already made', async () => {
      const { user, target } = await open(saved, { msHist: hist });
      await user.clear(target);
      await user.type(target, '110');
      // 20 left, not 110: one session covers it at this plan
      expect(screen.getByText(/About 1 session to reach \$110\.00/)).toBeInTheDocument();
    });

    test('lowering the goal under profit made says reached, and shows the start date', async () => {
      const { user, target } = await open(saved, { msHist: hist });
      await user.clear(target);
      await user.type(target, '80');
      expect(screen.getByText(/Target reached: \+\$90\.00 in 1 session\./)).toBeInTheDocument();
      expect(screen.getByText(/Counting sessions since/)).toBeInTheDocument();
    });

    test('a failed history read hides the count even when the goal is edited', async () => {
      const { user, target } = await open(saved, { msHist: { 'DEMO:111': { status: 'error', sessions: [] } } });
      await user.clear(target);
      await user.type(target, '150');
      expect(screen.getByText('Could not read your earlier sessions, so the session count is hidden.')).toBeInTheDocument();
    });

    test('a percent edit keeps the start time and recomputes the dollars', async () => {
      const { user, saveSettings, target } = await open({ startingBalanceDemo: 500, ...saved, msTargetValueDemo: 10, msTargetUnitDemo: '%', msTargetDollarsDemo: 50 }, { msHist: hist });
      await user.clear(target);
      await user.type(target, '20');
      await user.click(screen.getByRole('button', { name: 'Save' }));
      await waitFor(() => expect(saveSettings).toHaveBeenCalled());
      expect(lastSaved(saveSettings)).toMatchObject({ msTargetValueDemo: 20, msTargetUnitDemo: '%', msTargetDollarsDemo: 100, msTargetSetAtDemo: 111 });
    });

    test('Real start time is untouched when Demo is edited', async () => {
      const { user, saveSettings, target } = await open({ ...saved, msTargetValueReal: 50, msTargetUnitReal: '$', msTargetDollarsReal: 50, msTargetSetAtReal: 777 }, { msHist: hist });
      await user.clear(target);
      await user.type(target, '150');
      await user.click(screen.getByRole('button', { name: 'Save' }));
      await waitFor(() => expect(saveSettings).toHaveBeenCalled());
      expect(lastSaved(saveSettings)).toMatchObject({ msTargetDollarsDemo: 150, msTargetSetAtDemo: 111, msTargetDollarsReal: 50, msTargetSetAtReal: 777 });
    });

    test('clearing the goal nulls the dollars and the start time', async () => {
      const { user, saveSettings, target } = await open(saved, { msHist: hist });
      await user.clear(target);
      await user.click(screen.getByRole('button', { name: 'Save' }));
      await waitFor(() => expect(saveSettings).toHaveBeenCalled());
      expect(lastSaved(saveSettings)).toMatchObject({ msTargetDollarsDemo: null, msTargetSetAtDemo: null });
    });
  });

  // covers: AC-10
  test('saving another setting keeps the stored dollar goal and its start time', async () => {
    const { user, saveSettings } = await open({ msTargetValueDemo: 10, msTargetUnitDemo: '%', msTargetDollarsDemo: 40, msTargetSetAtDemo: 111 });
    const stop = screen.getByLabelText('Stop Loss %');
    await user.clear(stop);
    await user.type(stop, '25');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(saveSettings).toHaveBeenCalled());
    expect(lastSaved(saveSettings)).toMatchObject({ msTargetDollarsDemo: 40, msTargetSetAtDemo: 111, msStopLossPctDemo: 25 });
  });

  // covers: AC-10
  test('clearing the target clears the dollars and start time', async () => {
    const { user, saveSettings, target } = await open({ msTargetValueDemo: 100, msTargetUnitDemo: '$', msTargetDollarsDemo: 100, msTargetSetAtDemo: 111 });
    await user.clear(target);
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(saveSettings).toHaveBeenCalled());
    expect(lastSaved(saveSettings)).toMatchObject({ msTargetValueDemo: null, msTargetDollarsDemo: null, msTargetSetAtDemo: null });
  });

  // covers: AC-10
  test('a changed dollar goal keeps the start time so done sessions still count', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(999);
    const { user, saveSettings, target } = await open({ msTargetValueDemo: 100, msTargetUnitDemo: '$', msTargetDollarsDemo: 100, msTargetSetAtDemo: 111 });
    await user.clear(target);
    await user.type(target, '150');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(saveSettings).toHaveBeenCalled());
    expect(lastSaved(saveSettings)).toMatchObject({ msTargetDollarsDemo: 150, msTargetSetAtDemo: 111 });
    Date.now.mockRestore();
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

  // covers: AC-16
  test('Stop Loss ends cycle shows the dollar line only while it is on', async () => {
    const { user } = await open();
    expect(screen.queryByText(/Cycle ends at a loss of/)).not.toBeInTheDocument();
    await user.click(screen.getByRole('checkbox', { name: /^Stop Loss ends cycle/ }));
    expect(screen.getByText('Cycle ends at a loss of $100.00')).toBeInTheDocument();
  });

  // covers: AC-13
  test('the three alert toggles start as on, on, off', async () => {
    await open();
    expect(screen.getByRole('checkbox', { name: /Cycle end alert/ })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /Target reached alert/ })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /Stop loss alert/ })).not.toBeChecked();
  });
});
