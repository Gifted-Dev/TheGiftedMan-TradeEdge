import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Cfg } from './App';

const BASE = { setupComplete: true, activeMode: 'DEMO', startingBalanceDemo: 100, startingBalanceReal: 50, brokerMin: 10, sessionsPerDay: 2, mbTierDemo: 3, mbTierReal: 1 };

function setup(over = {}, props = {}) {
  const saveSettings = props.saveSettings || jest.fn().mockResolvedValue(undefined);
  const utils = render(
    <Cfg settings={{ ...BASE, ...over }} saveSettings={saveSettings} ss={null} resetAccount={jest.fn()} trades={[]} wds={[]}
      strategies={[]} mode="DEMO" addStrategy={jest.fn()} updateStrategy={jest.fn()} deleteStrategy={jest.fn()} {...props} />
  );
  return { saveSettings, ...utils };
}
const openTab = name => fireEvent.click(screen.getByRole('tab', { name }));
const saveBtn = () => screen.getByRole('button', { name: 'Save' });
const discardBtn = () => screen.getByRole('button', { name: 'Discard' });

describe('Settings tabs and Save bar (spec 0005)', () => {
  test('AC-1: six tabs in order, Account selected, one panel', () => {
    setup();
    const tabs = screen.getAllByRole('tab').map(t => t.textContent);
    expect(tabs).toEqual(['Account', 'Money management', 'Session rules', 'Strategies', 'AI', 'Danger zone']);
    expect(screen.getByRole('tab', { name: 'Account' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getAllByRole('tabpanel')).toHaveLength(1);
    expect(screen.getByText('Configuring: Demo account')).toBeInTheDocument();
  });

  test('AC-1/6: edit survives tab switch, bar dirty then Discard restores', () => {
    setup();
    const input = () => screen.getByLabelText('Starting balance ($)');
    fireEvent.change(input(), { target: { value: '250' } });
    expect(screen.getByText(/Unsaved changes/)).toBeInTheDocument();
    openTab('AI'); openTab('Account');
    expect(input()).toHaveValue(250);
    fireEvent.click(discardBtn());
    expect(input()).toHaveValue(100);
    expect(saveBtn()).toBeDisabled();
    expect(screen.getByText('No changes')).toBeInTheDocument();
  });

  test('AC-4/5: Save writes once with activeMode and mbTier echoed, then shows Saved', async () => {
    const { saveSettings } = setup();
    fireEvent.change(screen.getByLabelText('Starting balance ($)'), { target: { value: '250' } });
    fireEvent.click(saveBtn());
    fireEvent.click(saveBtn()); // double click: second is ignored
    await waitFor(() => expect(screen.getByText('Saved')).toBeInTheDocument());
    expect(saveSettings).toHaveBeenCalledTimes(1);
    const sent = saveSettings.mock.calls[0][0];
    expect(sent.startingBalanceDemo).toBe(250);
    expect(sent.activeMode).toBe('DEMO');
    expect(sent.mbTierDemo).toBe(3);
    expect(saveBtn()).toBeDisabled();
  });

  test('AC-5: failed save shows error and keeps the draft unsaved', async () => {
    setup({}, { saveSettings: jest.fn().mockRejectedValue(new Error('boom')) });
    fireEvent.change(screen.getByLabelText('Starting balance ($)'), { target: { value: '250' } });
    fireEvent.click(saveBtn());
    await waitFor(() => expect(screen.getByText('boom')).toBeInTheDocument());
    expect(screen.getByLabelText('Starting balance ($)')).toHaveValue(250);
    expect(saveBtn()).not.toBeDisabled();
  });

  test('AC-3/4: style picker edits the draft only, no save until Save', () => {
    const { saveSettings } = setup();
    openTab('Money management');
    fireEvent.click(screen.getByRole('radio', { name: 'Anti-Martingale' }));
    expect(saveSettings).not.toHaveBeenCalled();
    expect(screen.getByText(/Unsaved changes/)).toBeInTheDocument();
    expect(screen.getAllByRole('radio', { name: /Fixed Risk %|Anti-Martingale|Profit Lock|Masaniello/ })).toHaveLength(4);
  });

  test('AC-8: Masaniello hides risk sizing, milestone sizing, calculator', () => {
    setup();
    openTab('Money management');
    expect(screen.getByText('Risk sizing')).toBeInTheDocument();
    expect(screen.getByText(/Suggested risk % calculator/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('radio', { name: 'Masaniello' }));
    expect(screen.getByText('Masaniello sizes stakes from its own capital.')).toBeInTheDocument();
    expect(screen.queryByText('Risk sizing')).not.toBeInTheDocument();
    expect(screen.queryByText(/Milestone base sizing/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Suggested risk % calculator/)).not.toBeInTheDocument();
  });

  test('AC-9: non Fixed style swaps cards for one note, keeps sessions and alerts', () => {
    setup({ moneyMgmtStyleDemo: 'ANTI_MARTINGALE' });
    openTab('Session rules');
    expect(screen.queryByText('Precision')).not.toBeInTheDocument();
    expect(screen.queryByText('Strict Session Locking')).not.toBeInTheDocument();
    expect(screen.getByText(/Anti-Martingale, which ends its own/)).toBeInTheDocument();
    expect(screen.getByText('Sessions per day')).toBeInTheDocument();
    expect(screen.getByText('Session-lock alert sound')).toBeInTheDocument();
  });

  test('AC-1: Add strategy text survives tab switch and is not unsaved', () => {
    setup();
    openTab('Strategies');
    fireEvent.change(screen.getByLabelText('Strategy name'), { target: { value: 'My edge' } });
    openTab('AI'); openTab('Strategies');
    expect(screen.getByLabelText('Strategy name')).toHaveValue('My edge');
    expect(screen.getByText('No changes')).toBeInTheDocument();
  });

  test('AC-13: arrow, Home and End keys move between tabs', () => {
    setup();
    const list = screen.getByRole('tablist');
    fireEvent.keyDown(list, { key: 'ArrowRight' });
    expect(screen.getByRole('tab', { name: 'Money management' })).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(list, { key: 'End' });
    expect(screen.getByRole('tab', { name: 'Danger zone' })).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(list, { key: 'ArrowRight' });
    expect(screen.getByRole('tab', { name: 'Account' })).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(list, { key: 'ArrowLeft' });
    expect(screen.getByRole('tab', { name: 'Danger zone' })).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(list, { key: 'Home' });
    expect(screen.getByRole('tab', { name: 'Account' })).toHaveAttribute('aria-selected', 'true');
  });

  test('AC-11: Masaniello error is skipped on save, rest saved, bar names the mode', async () => {
    const { saveSettings } = setup({ moneyMgmtStyleDemo: 'MASANIELLO', msTotalTradesDemo: 10 });
    openTab('Money management');
    fireEvent.change(screen.getByLabelText('Total trades (N)'), { target: { value: '99' } });
    expect(screen.getByText(/1 Masaniello field \(Demo\) not saved/)).toBeInTheDocument();
    openTab('Account');
    fireEvent.change(screen.getByLabelText('Starting balance ($)'), { target: { value: '300' } });
    fireEvent.click(saveBtn());
    await waitFor(() => expect(saveSettings).toHaveBeenCalled());
    const sent = saveSettings.mock.calls[0][0];
    expect(sent.startingBalanceDemo).toBe(300);
    expect(sent.msTotalTradesDemo).toBe(10); // last saved value kept
  });

});

describe('Settings Save bar edge cases (spec 0005)', () => {
  const activeSession = accountMode => ({ date: '2026-01-01', sessions: [{ id: 's1', num: 1, accountMode, isActive: true }], perMode: {} });
  const editBalance = v => fireEvent.change(screen.getByLabelText('Starting balance ($)'), { target: { value: v } });
  const baseProps = () => ({ saveSettings: jest.fn(), ss: null, resetAccount: jest.fn(), trades: [], wds: [], strategies: [], addStrategy: jest.fn(), updateStrategy: jest.fn(), deleteStrategy: jest.fn() });

  test('AC-5: Saved shows the next session notice when a Demo session is active', async () => {
    setup({}, { ss: activeSession('DEMO') });
    editBalance('120');
    fireEvent.click(saveBtn());
    await waitFor(() => expect(screen.getByText(/Changes start from your next session/)).toBeInTheDocument());
  });

  test('AC-5: Saved shows the notice when only a Real session is active (any session counts)', async () => {
    setup({}, { ss: activeSession('REAL') });
    editBalance('120');
    fireEvent.click(saveBtn());
    await waitFor(() => expect(screen.getByText(/Changes start from your next session/)).toBeInTheDocument());
  });

  test('AC-5: no notice when no session is active', async () => {
    setup({}, { ss: { date: '2026-01-01', sessions: [], perMode: {} } });
    editBalance('120');
    fireEvent.click(saveBtn());
    await waitFor(() => expect(screen.getByText('Saved')).toBeInTheDocument());
    expect(screen.queryByText(/next session/)).not.toBeInTheDocument();
  });

  test('AC-5: an edit made while saving stays unsaved after the save finishes', async () => {
    let release;
    const saveSettings = jest.fn(() => new Promise(res => { release = res; }));
    setup({}, { saveSettings });
    editBalance('120');
    fireEvent.click(saveBtn());
    expect(discardBtn()).toBeDisabled();
    expect(screen.getByText('Saving…')).toBeInTheDocument();
    editBalance('130');
    release();
    await waitFor(() => expect(screen.getByText(/Unsaved changes/)).toBeInTheDocument());
    expect(saveBtn()).not.toBeDisabled();
    expect(saveSettings.mock.calls[0][0].startingBalanceDemo).toBe(120);
  });

  test('AC-4: reports the saving state to App so the mode toggle can lock', async () => {
    const onSavingChange = jest.fn();
    setup({}, { onSavingChange });
    editBalance('120');
    fireEvent.click(saveBtn());
    await waitFor(() => expect(screen.getByText('Saved')).toBeInTheDocument());
    const calls = onSavingChange.mock.calls.map(c => c[0]);
    expect(calls).toContain(true);
    expect(calls[calls.length - 1]).toBe(false);
  });

  test('AC-7: registers dirty and save with the leave guard ref', async () => {
    const guardRef = { current: null };
    setup({}, { guardRef });
    expect(guardRef.current.dirty).toBe(false);
    editBalance('120');
    expect(guardRef.current.dirty).toBe(true);
    expect(await guardRef.current.save()).toBe(true);
  });

  test('AC-7: the guard save resolves false when the save fails', async () => {
    const guardRef = { current: null };
    setup({}, { guardRef, saveSettings: jest.fn().mockRejectedValue(new Error('nope')) });
    editBalance('120');
    expect(await guardRef.current.save()).toBe(false);
  });

  test('AC-2: switching mode keeps the draft and shows the other mode values', () => {
    const props = baseProps();
    const { rerender } = render(<Cfg settings={BASE} mode="DEMO" {...props} />);
    editBalance('250');
    rerender(<Cfg settings={BASE} mode="REAL" {...props} />);
    expect(screen.getByText('Configuring: Real account')).toBeInTheDocument();
    expect(screen.getByLabelText('Starting balance ($)')).toHaveValue(50);
    expect(screen.getByText(/Unsaved changes/)).toBeInTheDocument();
    rerender(<Cfg settings={BASE} mode="DEMO" {...props} />);
    expect(screen.getByLabelText('Starting balance ($)')).toHaveValue(250);
  });

  test('AC-6: Discard resets the draft for both modes', () => {
    const props = baseProps();
    const { rerender } = render(<Cfg settings={BASE} mode="DEMO" {...props} />);
    editBalance('250');
    rerender(<Cfg settings={BASE} mode="REAL" {...props} />);
    editBalance('75');
    fireEvent.click(discardBtn());
    expect(screen.getByLabelText('Starting balance ($)')).toHaveValue(50);
    rerender(<Cfg settings={BASE} mode="DEMO" {...props} />);
    expect(screen.getByLabelText('Starting balance ($)')).toHaveValue(100);
  });

  test('AC-14: reset with balances zeroes the draft balance and keeps the bar clean', async () => {
    const resetAccount = jest.fn().mockResolvedValue(undefined);
    const { saveSettings } = setup({}, { resetAccount });
    openTab('Danger zone');
    fireEvent.click(screen.getByLabelText(/Also reset starting balances/));
    fireEvent.click(screen.getByRole('button', { name: /Reset Demo/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    await waitFor(() => expect(resetAccount).toHaveBeenCalledWith('DEMO', true));
    await waitFor(() => expect(screen.getByText('Account reset.')).toBeInTheDocument());
    expect(screen.getByText('No changes')).toBeInTheDocument();
    openTab('Account');
    expect(screen.getByLabelText('Starting balance ($)')).toHaveValue(0);
    expect(saveSettings).not.toHaveBeenCalled();
  });

  test('AC-14: reset without balances leaves the draft balance alone', async () => {
    const resetAccount = jest.fn().mockResolvedValue(undefined);
    setup({}, { resetAccount });
    openTab('Danger zone');
    fireEvent.click(screen.getByRole('button', { name: /Reset Demo/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    await waitFor(() => expect(resetAccount).toHaveBeenCalledWith('DEMO', false));
    openTab('Account');
    expect(screen.getByLabelText('Starting balance ($)')).toHaveValue(100);
  });

  test('AC-12: trade style, sessions per day and strict lock save the same keys as before', async () => {
    const { saveSettings } = setup();
    openTab('Session rules');
    fireEvent.click(screen.getByRole('radio', { name: /Active/ }));
    fireEvent.click(screen.getByRole('button', { name: '3 sessions' }));
    fireEvent.click(screen.getByLabelText('Block logging after a stop or take profit'));
    expect(saveSettings).not.toHaveBeenCalled();
    fireEvent.click(saveBtn());
    await waitFor(() => expect(saveSettings).toHaveBeenCalledTimes(1));
    const sent = saveSettings.mock.calls[0][0];
    expect(sent.tradeStyleDemo).toBe(2);
    expect(sent.sessionsPerDay).toBe(3);
    expect(sent.strictLockingDemo).toBe(true);
  });

  test('AC-8: Masaniello keeps hidden Risk sizing values in the saved payload', async () => {
    const { saveSettings } = setup({ riskPercentDemo: 7 });
    openTab('Money management');
    fireEvent.click(screen.getByRole('radio', { name: 'Masaniello' }));
    fireEvent.click(saveBtn());
    await waitFor(() => expect(saveSettings).toHaveBeenCalled());
    const sent = saveSettings.mock.calls[0][0];
    expect(sent.moneyMgmtStyleDemo).toBe('MASANIELLO');
    expect(sent.riskPercentDemo).toBe(7);
  });

  test('AC-13: tabs use one tab stop and every tab points at the tabpanel', () => {
    setup();
    const tabs = screen.getAllByRole('tab');
    expect(tabs.filter(t => t.tabIndex === 0)).toHaveLength(1);
    tabs.forEach(t => expect(t).toHaveAttribute('aria-controls', 'settings-tabpanel'));
    expect(screen.getByRole('tabpanel')).toHaveAttribute('id', 'settings-tabpanel');
  });
});
