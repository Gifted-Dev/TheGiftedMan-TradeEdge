import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';

// Controls what the mocked settings upsert returns, so a save can succeed or fail.
let mockUpsertError = null;
const mockUpsert = jest.fn();

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
      upsert: row => { if (table === 'settings') { mockUpsert(row); return Promise.resolve({ error: mockUpsertError }); } return c; },
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

beforeEach(() => {
  mockUpsertError = null;
  mockUpsert.mockClear();
  supabase.auth.signOut.mockClear();
  window.sessionStorage.clear();
  window.sessionStorage.setItem('gm_view', 'settings');
});

async function openDirtySettings() {
  render(<App />);
  const input = await screen.findByLabelText('Starting balance ($)');
  fireEvent.change(input, { target: { value: '777' } });
  expect(screen.getByText(/Unsaved changes/)).toBeInTheDocument();
}
const navButton = name => screen.getAllByRole('button', { name }).find(b => b.closest('aside'));
const sidebarBalance = () => document.querySelector('aside').textContent;
const dialog = () => screen.queryByRole('dialog', { name: 'Unsaved settings' });

describe('Settings leave guard in App (spec 0005 AC-7)', () => {
  test('opens a three action dialog when leaving with unsaved changes', async () => {
    await openDirtySettings();
    fireEvent.click(navButton(/Dashboard/));
    expect(dialog()).toBeInTheDocument();
    expect(within(dialog()).getByRole('button', { name: 'Save and leave' })).toBeInTheDocument();
    expect(within(dialog()).getByRole('button', { name: 'Discard' })).toBeInTheDocument();
    expect(within(dialog()).getByRole('button', { name: 'Stay' })).toBeInTheDocument();
  });

  test('Escape, backdrop click and Stay all keep you on Settings', async () => {
    await openDirtySettings();
    fireEvent.click(navButton(/Dashboard/));
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(dialog()).not.toBeInTheDocument();
    fireEvent.click(navButton(/Dashboard/));
    fireEvent.click(dialog());
    expect(dialog()).not.toBeInTheDocument();
    fireEvent.click(navButton(/Dashboard/));
    fireEvent.click(within(dialog()).getByRole('button', { name: 'Stay' }));
    expect(dialog()).not.toBeInTheDocument();
    expect(screen.getByLabelText('Starting balance ($)')).toHaveValue(777);
  });

  test('Discard leaves without saving', async () => {
    await openDirtySettings();
    fireEvent.click(navButton(/Dashboard/));
    fireEvent.click(within(dialog()).getByRole('button', { name: 'Discard' }));
    expect(await screen.findByText('Total balance')).toBeInTheDocument();
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  test('Save and leave saves once, then leaves', async () => {
    await openDirtySettings();
    fireEvent.click(navButton(/Dashboard/));
    fireEvent.click(within(dialog()).getByRole('button', { name: 'Save and leave' }));
    expect(await screen.findByText('Total balance')).toBeInTheDocument();
    expect(mockUpsert).toHaveBeenCalledTimes(1);
  });

  test('Save and leave stays on Settings when the save fails', async () => {
    mockUpsertError = { message: 'db down' };
    await openDirtySettings();
    fireEvent.click(navButton(/Dashboard/));
    fireEvent.click(within(dialog()).getByRole('button', { name: 'Save and leave' }));
    expect(await screen.findByText('db down')).toBeInTheDocument();
    expect(screen.getByLabelText('Starting balance ($)')).toHaveValue(777);
    expect(screen.queryByText('Total balance')).not.toBeInTheDocument();
  });

  test('a failed save restores the previous settings for the rest of the app', async () => {
    mockUpsertError = { message: 'db down' };
    render(<App />);
    await screen.findByLabelText('Starting balance ($)');
    const before = sidebarBalance();
    fireEvent.change(screen.getByLabelText('Starting balance ($)'), { target: { value: '777' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await screen.findByText('db down');
    await waitFor(() => expect(sidebarBalance()).toBe(before));
    expect(sidebarBalance()).not.toContain('777');
  });

  test('no dialog when nothing is unsaved', async () => {
    render(<App />);
    await screen.findByLabelText('Starting balance ($)');
    fireEvent.click(navButton(/Dashboard/));
    expect(dialog()).not.toBeInTheDocument();
    expect(await screen.findByText('Total balance')).toBeInTheDocument();
  });

  test('clicking Settings while on Settings never opens the dialog', async () => {
    await openDirtySettings();
    fireEvent.click(navButton(/Settings/));
    expect(dialog()).not.toBeInTheDocument();
  });

  test('Log out with unsaved changes asks first and does not sign out until you choose', async () => {
    await openDirtySettings();
    fireEvent.click(screen.getAllByRole('button', { name: 'Log out' })[0]);
    expect(dialog()).toBeInTheDocument();
    expect(supabase.auth.signOut).not.toHaveBeenCalled();
    fireEvent.click(within(dialog()).getByRole('button', { name: 'Discard' }));
    expect(supabase.auth.signOut).toHaveBeenCalledTimes(1);
  });

  test('switching Demo and Real never opens the dialog and keeps the draft', async () => {
    await openDirtySettings();
    fireEvent.click(screen.getAllByRole('button', { name: /REAL/ })[0]);
    expect(dialog()).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Configuring: Real account')).toBeInTheDocument());
    fireEvent.click(screen.getAllByRole('button', { name: /DEMO/ })[0]);
    await waitFor(() => expect(screen.getByLabelText('Starting balance ($)')).toHaveValue(777));
  });
});
