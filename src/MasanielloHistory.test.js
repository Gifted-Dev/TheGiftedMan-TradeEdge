// loadMsTargetHistory: the one read of earlier Masaniello sessions (spec 0006 AC-7, AC-9).
const mockCalls = [];
let mockResult = { data: [], error: null };

jest.mock('./supabaseClient', () => {
  const builder = {};
  for (const m of ['select', 'eq', 'gte']) {
    builder[m] = (...args) => { mockCalls.push([m, ...args]); return builder; };
  }
  builder.then = (res, rej) => Promise.resolve(mockResult).then(res, rej);
  return {
    supabase: { from: table => { mockCalls.push(['from', table]); return builder; }, auth: {} },
    isSupabaseConfigured: true,
  };
});

const { loadMsTargetHistory } = require('./App');

const row = (id, extra) => ({ id, account_mode: 'DEMO', start_time: '2026-11-10T10:00:00Z', end_time: '2026-11-10T11:00:00Z', session_pnl: 12, is_active: false, extra });

beforeEach(() => { mockCalls.length = 0; mockResult = { data: [], error: null }; });

test('asks for the signed in users ended sessions of that mode since the target start, as an ISO time', async () => {
  await loadMsTargetHistory('u1', 'DEMO', Date.UTC(2026, 10, 9));
  expect(mockCalls).toEqual(expect.arrayContaining([
    ['from', 'sessions'],
    ['eq', 'user_id', 'u1'],
    ['eq', 'account_mode', 'DEMO'],
    ['eq', 'is_active', false],
    ['gte', 'end_time', '2026-11-09T00:00:00.000Z'],
  ]));
});

test('keeps only Masaniello sessions and maps stored rows to session objects', async () => {
  mockResult = { data: [row('a', { msN: 10, msK: 6 }), row('b', { msN: null }), row('c', {})], error: null };
  const out = await loadMsTargetHistory('u1', 'DEMO', 0);
  expect(out.map(s => s.id)).toEqual(['a']);
  expect(out[0]).toMatchObject({ accountMode: 'DEMO', sPnl: 12, isActive: false, msN: 10 });
  expect(typeof out[0].endTime).toBe('number');
});

test('returns an empty list when nothing is stored', async () => {
  mockResult = { data: null, error: null };
  await expect(loadMsTargetHistory('u1', 'REAL', 0)).resolves.toEqual([]);
});

test('throws the database error so the caller can show the failed state', async () => {
  mockResult = { data: null, error: new Error('boom') };
  await expect(loadMsTargetHistory('u1', 'DEMO', 0)).rejects.toThrow('boom');
});
