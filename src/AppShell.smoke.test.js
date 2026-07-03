import { render, screen } from '@testing-library/react';

jest.mock('./supabaseClient', () => {
  const settingsRow = {
    user_id: 'u1', starting_balance: 20, risk_percent: 5, trade_style: 1,
    sessions_per_day: 2, broker_min: 10, milestones: [{ mul: 2, pct: 20 }],
    api_keys: {}, setup_complete: true, created_at: new Date().toISOString(), extra: {},
  };
  const thenable = (result) => {
    const c = {
      select: () => c, eq: () => c, order: () => c,
      maybeSingle: () => Promise.resolve({ data: settingsRow, error: null }),
      then: (res, rej) => Promise.resolve(result).then(res, rej),
    };
    return c;
  };
  return {
    supabase: {
      auth: {
        getSession: () => Promise.resolve({ data: { session: { user: { id: 'u1' } } } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
        signOut: () => Promise.resolve({}),
      },
      from: () => thenable({ data: [], error: null }),
      storage: { from: () => ({ createSignedUrl: () => Promise.resolve({ data: { signedUrl: 'x' }, error: null }) }) },
    },
  };
});

const App = require('./App').default;

test('full app shell reaches the dashboard for a set-up user', async () => {
  render(<App />);
  expect(await screen.findByText('Total balance', {}, { timeout: 5000 })).toBeInTheDocument();
  expect(screen.getAllByText('TheGiftedMan').length).toBeGreaterThan(0);
});
