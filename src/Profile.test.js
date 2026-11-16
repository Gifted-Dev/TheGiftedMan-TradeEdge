import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mutable auth state the mock reads, so each test can pick the user and
// control what updateUser returns. Names start with "mock" for jest.mock.
let mockUser;
let mockAuthCb;
const mockUpdateUser = jest.fn();

jest.mock('./supabaseClient', () => {
  const settingsRow = {
    user_id: 'u1', starting_balance: 20, risk_percent: 5, trade_style: 1,
    sessions_per_day: 2, broker_min: 10, milestones: [{ mul: 2, pct: 20 }],
    api_keys: {}, setup_complete: true, created_at: new Date().toISOString(),
    extra: { startingBalanceDemo: 20, startingBalanceReal: 20, activeMode: 'DEMO' },
  };
  const thenable = (result, table) => {
    const c = {
      select: () => c, eq: () => c, order: () => c, in: () => c, insert: () => c, delete: () => c,
      upsert: () => c,
      maybeSingle: () => Promise.resolve({ data: table === 'settings' ? settingsRow : null, error: null }),
      then: (res, rej) => Promise.resolve(result).then(res, rej),
    };
    return c;
  };
  return {
    supabase: {
      auth: {
        getSession: () => Promise.resolve({ data: { session: { user: mockUser } } }),
        onAuthStateChange: cb => { mockAuthCb = cb; return { data: { subscription: { unsubscribe() {} } } }; },
        updateUser: (...a) => mockUpdateUser(...a),
        signOut: jest.fn(() => Promise.resolve({})),
      },
      from: table => thenable({ data: [], error: null }, table),
      storage: { from: () => ({ createSignedUrl: () => Promise.resolve({ data: { signedUrl: 'x' }, error: null }) }) },
    },
    isSupabaseConfigured: true,
  };
});

const App = require('./App').default;
const { supabase } = require('./supabaseClient');

const emailUser = (extra = {}) => ({
  id: 'u1', email: 'trader@example.com', created_at: '2026-11-15T12:00:00Z',
  identities: [{ provider: 'email' }], user_metadata: {}, ...extra,
});

beforeEach(() => {
  mockUser = emailUser();
  mockUpdateUser.mockReset();
  mockUpdateUser.mockResolvedValue({ error: null });
  supabase.auth.signOut.mockClear();
  window.sessionStorage.clear();
  window.sessionStorage.setItem('gm_view', 'profile');
});

const openProfile = async () => {
  render(<App />);
  await screen.findByRole('heading', { name: 'Profile' });
};
const enter = (el, v) => { userEvent.clear(el); if (v) userEvent.type(el, v); };
const pwFields = () => [screen.getByLabelText('New password'), screen.getByLabelText('Confirm new password')];
const submitPw = () => userEvent.click(screen.getByRole('button', { name: 'Update password' }));
const nameInput = () => screen.getByLabelText('Display name', { selector: 'input' });
const saveName = () => screen.getByRole('button', { name: 'Save' });

describe('Profile page (spec 0008)', () => {
  test('AC-1/2/3: restores from gm_view, shows details in card order', async () => {
    await openProfile();
    expect(screen.getByText('trader@example.com')).toBeInTheDocument();
    expect(screen.getByText(new Date('2026-11-15T12:00:00Z').toLocaleDateString(undefined, { dateStyle: 'medium' }))).toBeInTheDocument();
    expect(screen.getByText('Email and password')).toBeInTheDocument();
    const text = document.querySelector('main').textContent;
    const order = ['Account details', 'Display name', 'Password', 'Session'].map(t => text.indexOf(t));
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(order.every(i => i >= 0)).toBe(true);
    expect(screen.getAllByRole('button', { name: /Profile/ }).length).toBeGreaterThan(0);
  });

  test('AC-3/7: other provider shows capitalized name and no password form', async () => {
    mockUser = emailUser({ identities: [{ provider: 'google' }] });
    await openProfile();
    expect(screen.getByText('You sign in with Google. Manage your password there.')).toBeInTheDocument();
    expect(screen.queryByLabelText('New password')).not.toBeInTheDocument();
  });

  test('AC-4: valid change calls updateUser, shows success, clears fields', async () => {
    await openProfile();
    const [a, b] = pwFields();
    enter(a, 'secret1');
    enter(b, 'secret1');
    submitPw();
    expect(await screen.findByText('Password updated')).toBeInTheDocument();
    expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'secret1' });
    expect(a).toHaveValue('');
    expect(b).toHaveValue('');
    expect(supabase.auth.signOut).not.toHaveBeenCalled();
  });

  test.each([
    ['empty', '', '', 'Enter a new password.'],
    ['short', 'abc', 'abc', 'Password must be at least 6 characters.'],
    ['mismatch', 'secret1', 'secret2', 'Passwords do not match.'],
  ])('AC-5: %s password shows a message and makes no call', async (_n, p1, p2, text) => {
    await openProfile();
    const [a, b] = pwFields();
    enter(a, p1);
    enter(b, p2);
    submitPw();
    expect(await screen.findByText(text)).toBeInTheDocument();
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  test('AC-6: error text shows and fields keep values; thrown error shows network text', async () => {
    await openProfile();
    const [a, b] = pwFields();
    enter(a, 'secret1');
    enter(b, 'secret1');
    mockUpdateUser.mockResolvedValueOnce({ error: { message: 'Same as old password' } });
    submitPw();
    expect(await screen.findByText('Same as old password')).toBeInTheDocument();
    expect(a).toHaveValue('secret1');
    mockUpdateUser.mockRejectedValueOnce(new Error('offline'));
    submitPw();
    expect(await screen.findByText('Could not reach the server. Try again.')).toBeInTheDocument();
    expect(b).toHaveValue('secret1');
  });

  test('AC-13: button disabled while saving, one call only, message clears on edit', async () => {
    let resolve;
    mockUpdateUser.mockReturnValueOnce(new Promise(r => { resolve = r; }));
    await openProfile();
    const [a, b] = pwFields();
    enter(a, 'secret1');
    enter(b, 'secret1');
    submitPw();
    const btn = screen.getByRole('button', { name: 'Updating...' });
    expect(btn).toBeDisabled();
    fireEvent.submit(btn.closest('form')); // a disabled button swallows clicks, so hit the submit guard directly
    expect(mockUpdateUser).toHaveBeenCalledTimes(1);
    await act(async () => { resolve({ error: null }); });
    expect(await screen.findByText('Password updated')).toBeInTheDocument();
    enter(a, 'x');
    expect(screen.queryByText('Password updated')).not.toBeInTheDocument();
  });

  test('AC-8: name input stops at 40, Save disabled when unchanged, trims and saves', async () => {
    await openProfile();
    expect(nameInput()).toHaveAttribute('maxLength', '40');
    expect(saveName()).toBeDisabled();
    enter(nameInput(), '  Ada  ');
    expect(saveName()).toBeEnabled();
    userEvent.click(saveName());
    expect(await screen.findByText('Saved')).toBeInTheDocument();
    expect(mockUpdateUser).toHaveBeenCalledWith({ data: { display_name: 'Ada' } });
    expect(nameInput()).toHaveValue('Ada');
  });

  test('AC-8: emptying a saved name sends an empty string', async () => {
    mockUser = emailUser({ user_metadata: { display_name: 'Ada' } });
    await openProfile();
    expect(nameInput()).toHaveValue('Ada');
    enter(nameInput(), '');
    userEvent.click(saveName());
    await waitFor(() => expect(mockUpdateUser).toHaveBeenCalledWith({ data: { display_name: '' } }));
  });

  test('AC-9: name save error shows and keeps the typed value', async () => {
    mockUpdateUser.mockResolvedValueOnce({ error: { message: 'Session expired' } });
    await openProfile();
    enter(nameInput(), 'Grace');
    userEvent.click(saveName());
    expect(await screen.findByText('Session expired')).toBeInTheDocument();
    expect(nameInput()).toHaveValue('Grace');
    expect(saveName()).toBeEnabled();
  });

  test('AC-8: USER_UPDATED event refreshes the name after leaving and returning', async () => {
    await openProfile();
    await act(async () => {
      mockAuthCb('USER_UPDATED', { user: emailUser({ user_metadata: { display_name: 'Linus' } }) });
    });
    const nav = name => screen.getAllByRole('button', { name }).find(b => b.closest('aside'));
    userEvent.click(nav(/Dashboard/));
    userEvent.click(nav(/Profile/));
    expect(await screen.findByLabelText('Display name', { selector: 'input' })).toHaveValue('Linus');
  });

  test('AC-11: Go to Settings opens Settings', async () => {
    await openProfile();
    userEvent.click(screen.getByRole('button', { name: 'Go to Settings' }));
    expect(await screen.findByLabelText('Starting balance ($)')).toBeInTheDocument();
  });

  test('AC-10: Sign out calls signOut with no confirm dialog', async () => {
    await openProfile();
    userEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(supabase.auth.signOut).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('Profile extras (review follow ups)', () => {
  test('AC-1: opening Profile from Settings with unsaved edits opens the leave dialog', async () => {
    window.sessionStorage.setItem('gm_view', 'settings');
    render(<App />);
    enter(await screen.findByLabelText('Starting balance ($)'), '777');
    userEvent.click(screen.getAllByRole('button', { name: /Profile/ }).find(b => b.closest('aside')));
    expect(screen.getByRole('dialog', { name: 'Unsaved settings' })).toBeInTheDocument();
    expect(within(screen.getByRole('dialog')).getByRole('button', { name: 'Stay' })).toBeInTheDocument();
  });

  test('shows every provider when an account has more than one identity', async () => {
    mockUser = emailUser({ identities: [{ provider: 'google' }, { provider: 'email' }] });
    await openProfile();
    expect(screen.getByText('Google, Email and password')).toBeInTheDocument();
    expect(screen.getByLabelText('New password')).toBeInTheDocument();
  });

  test('name field follows the saved name when it changes while open', async () => {
    await openProfile();
    await act(async () => {
      mockAuthCb('USER_UPDATED', { user: emailUser({ user_metadata: { display_name: 'Margaret' } }) });
    });
    expect(nameInput()).toHaveValue('Margaret');
  });
});
