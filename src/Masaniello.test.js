import { msTable, msPlanSummary, liveMasanielloNextStake, advanceMasaniello, checkMasanielloSessionEnd, msFieldErrors } from './App';

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
