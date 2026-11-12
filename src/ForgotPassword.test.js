import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';

let mockSession = null;
let mockAuthCb = null;
const mockReset = jest.fn(() => Promise.resolve({ error: null }));
const mockUpdate = jest.fn(() => Promise.resolve({ error: null }));

jest.mock('./supabaseClient', () => {
  const settingsRow = {
    user_id: 'u1', starting_balance: 20, risk_percent: 5, trade_style: 1,
    sessions_per_day: 2, broker_min: 10, milestones: [{ mul: 2, pct: 20 }],
    api_keys: {}, setup_complete: true, created_at: new Date().toISOString(), extra: {},
  };
  const thenable = (result) => {
    const c = {
      select: () => c, eq: () => c, order: () => c, in: () => c, insert: () => c, upsert: () => c, delete: () => c,
      maybeSingle: () => Promise.resolve({ data: settingsRow, error: null }),
      then: (res, rej) => Promise.resolve(result).then(res, rej),
    };
    return c;
  };
  return {
    supabase: {
      auth: {
        getSession: () => Promise.resolve({ data: { session: mockSession } }),
        onAuthStateChange: (cb) => { mockAuthCb = cb; return { data: { subscription: { unsubscribe() {} } } }; },
        signOut: () => Promise.resolve({}),
        resetPasswordForEmail: (...a) => mockReset(...a),
        updateUser: (...a) => mockUpdate(...a),
      },
      from: () => thenable({ data: [], error: null }),
      storage: { from: () => ({ createSignedUrl: () => Promise.resolve({ data: { signedUrl: 'x' }, error: null }) }) },
    },
    isSupabaseConfigured: true,
  };
});

jest.setTimeout(30000);
const App = require('./App').default;

beforeEach(() => {
  // CRA sets resetMocks: true, so implementations must be set each test
  mockReset.mockResolvedValue({ error: null });
  mockUpdate.mockResolvedValue({ error: null });
});

test('forgot password sends the reset email', async () => {
  mockSession = null;
  render(<App />);
  fireEvent.click((await screen.findAllByText('Get Started Free', {}, { timeout: 5000 }))[0]);
  fireEvent.click(await screen.findByText('Forgot password?'));
  fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'a@b.co' } });
  fireEvent.click(screen.getByText('Send reset email'));
  expect(await screen.findByText(/Password reset email sent/)).toBeInTheDocument();
  expect(mockReset).toHaveBeenCalledWith('a@b.co', { redirectTo: window.location.origin });
});

test('recovery link shows set password form and updates the password', async () => {
  mockSession = { user: { id: 'u1' } };
  render(<App />);
  await waitFor(() => expect(mockAuthCb).toBeTruthy());
  await act(async () => { mockAuthCb('PASSWORD_RECOVERY', mockSession); });
  expect(await screen.findByText('Set a new password')).toBeInTheDocument();
  fireEvent.change(screen.getByPlaceholderText('Min 6 characters'), { target: { value: 'newpass1' } });
  fireEvent.click(screen.getByText('Update password'));
  await waitFor(() => expect(mockUpdate).toHaveBeenCalledWith({ password: 'newpass1' }));
  expect(await screen.findByText('Total balance', {}, { timeout: 5000 })).toBeInTheDocument();
});

test('update password error is shown and form stays', async () => {
  mockSession = { user: { id: 'u1' } };
  mockUpdate.mockResolvedValueOnce({ error: { message: 'Password too weak' } });
  render(<App />);
  await waitFor(() => expect(mockAuthCb).toBeTruthy());
  await act(async () => { mockAuthCb('PASSWORD_RECOVERY', mockSession); });
  fireEvent.change(await screen.findByPlaceholderText('Min 6 characters'), { target: { value: 'newpass1' } });
  fireEvent.click(screen.getByText('Update password'));
  expect(await screen.findByText('Password too weak')).toBeInTheDocument();
  expect(screen.getByText('Set a new password')).toBeInTheDocument();
});
