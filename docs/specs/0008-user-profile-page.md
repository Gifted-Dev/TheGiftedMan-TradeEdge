# 0008. User Profile Page

**Date**: 2026-11-15
**Status**: Accepted

## Summary

Logged in users have no place in the app that says who they are. This spec adds one Profile page, opened from the sidebar, that shows your email, when the account was created, and how you sign in. You can set a display name, change your password, sign out, or jump to Settings. Nothing new is stored by us: the display name rides on the Supabase auth user (as `user_metadata`, a small free form record Supabase keeps on every user), so there is no table and no migration.

## Context

The app has a Login screen (sign in, sign up, reset by email) and a `ResetPassword` screen that only appears after a reset email link. Once you are in, the only account action is a Log out icon in the sidebar footer. You cannot see your email, change your password without going through email, or give the account a name.

Auth is Supabase email and password only. The app keeps the auth user in `App` state (`authUser`) and its listener ignores updates when the user id has not changed. Settings (spec 0005) already has Account and Danger zone tabs, but those hold trading settings, not identity. The Settings leave guard (`requestLeave`) protects unsaved Settings edits on every nav click and on Log out.

Profile data that belongs to the login (email, created date, provider, name, password) is different from trading settings. It is saved by Supabase auth calls, not through the Settings draft and Save bar. Without a clear home for it, each new account action would be bolted onto Settings or the Login screen.

## Requirements

**User stories**:
- As a trader, I want to see my email, account age, and sign in method so I know which account I am using.
- As a trader, I want to change my password inside the app so I do not need a reset email.
- As a trader, I want a display name so the account feels like mine.
- As a trader, I want to sign out from my profile.

**Acceptance criteria**:
- **AC-1**: A "Profile" item appears in the sidebar nav (desktop) and the mobile menu, just before Settings. It opens the Profile page, shows the active state like other items, and survives a reload through `gm_view`. Opening Profile from Settings with unsaved edits still opens the existing leave dialog.
- **AC-2**: Profile shows the email (read only), the created date, the sign in method, and the display name field. It is one single column of cards in this order: Account details, Display name, Password, Session.
- **AC-3**: The created date shows in the browser's locale as a plain date (for example "Nov 15, 2026"). The sign in method shows "Email and password" for an email account and the capitalized provider name for any other provider.
- **AC-4**: Change password takes New password and Confirm new password. With valid input, one click calls `supabase.auth.updateUser({password})`. On success it shows "Password updated", clears both fields, and keeps the user signed in on this device. Other devices stay signed in.
- **AC-5**: Change password validates before any call: an empty new password, shorter than 6 characters (same rule as Login), or a confirm that does not match shows a clear inline message next to the form and makes no network call.
- **AC-6**: If `updateUser` returns an error (for example the new password equals the old one, or the session needs a recent login), the error text shows, the fields keep their values, and the user stays on the page. A thrown network error shows "Could not reach the server. Try again."
- **AC-7**: For an account with no email password identity, the Password card does not show the form. It shows one line: "You sign in with <Provider>. Manage your password there."
- **AC-8**: Display name accepts any text. It is trimmed, limited to 40 characters (the input stops at 40), and may be empty. Save calls `supabase.auth.updateUser({data:{display_name}})`; an empty value clears the name. On success it shows "Saved" and the new name is still shown after leaving Profile and returning, and after a reload. Save is disabled when the value equals the saved name.
- **AC-9**: If the display name save fails, the error shows, the input keeps what the user typed, and the saved name does not change.
- **AC-10**: "Sign out" on Profile ends the session immediately through the existing logout path (`requestLeave({type:'logout'})`), with no extra confirm dialog, and returns to the landing page.
- **AC-11**: A "Go to Settings" link on Profile opens Settings through `requestLeave({type:'view',id:'settings'})`.
- **AC-12**: At phone width the page is one column, has no sideways scroll, and every input and button is reachable and at least 40px tall.
- **AC-13**: While a password or name save runs, its button is disabled so a double click cannot send twice. A success or error message clears when the user edits that card's field again. The two forms are independent: saving one does not touch the other's fields.
- **AC-14**: No regression. Settings, Login, `ResetPassword`, and the Settings leave guard behave as before. No migration and no new env var.

## Options considered

### Option 1: Profile page backed by the Supabase auth user

A new `Profile` page in the app shell. Email, created date, and provider come from the auth user. The display name is stored in `user_metadata`. Password change uses `updateUser`. One small change in the auth listener makes saved metadata show up after navigation.

**Pros**:
- No migration, no table, no row level security work.
- Reuses the same `updateUser` call that `ResetPassword` already uses.
- Smallest slice, thin and complete through the UI and auth layers.

**Cons**:
- Display name cannot be queried across users or joined to trades. That is fine today, with one user per account and no sharing.
- A name lives in auth metadata, so moving auth providers later means moving the name too.

### Option 2: A `profiles` table

A new Supabase table keyed by user id with a display name, loaded with the other data on sign in.

**Pros**:
- Room for more profile fields later (avatar, timezone) with real columns.
- The name can be joined in SQL.

**Cons**:
- Migration, row level security policies, a fetch on load, and a failure path for a single optional field.
- Builds for fields nobody asked for yet.

### Option 3: Put identity on the Settings Account tab

No new page. Add email, password, and name to the existing Settings Account tab.

**Pros**:
- No new nav item.

**Cons**:
- Settings has a draft and one Save bar for trading settings. Password and name save instantly by their own calls, which would bring back the mixed saving styles that spec 0005 removed.
- The scope asks for a Profile page you can open from the shell.

## Decision

**Chosen option**: Option 1: Profile page backed by the Supabase auth user

Add a `Profile` component in `src/App.js` opened from a new sidebar nav item, using Supabase auth calls only, with the display name in `user_metadata`.

**Implementation skills**: `supabase` (`supabase/agent-skills`, `.agents/skills/supabase/`) · `vercel-react-best-practices` (`vercel-labs/agent-skills`, `.agents/skills/vercel-react-best-practices/`)

## Rationale

The data a profile shows already lives on the Supabase auth user, and the one editable extra (a name) is a single optional string. A table would add a migration, security policies, and a load step for that one string, which is the kind of cost the project's Tracer Bullet approach avoids. Keeping password and name off the Settings Save bar protects the single save behavior that spec 0005 created.

Show the user metadata straight from the session user, but fix the one place that would make it look stale: `App`'s auth listener keeps the old user object when the id is the same. The recommended fix accepts the `USER_UPDATED` event, which Supabase sends after every `updateUser`. The data load effect depends on `userId`, so this does not refetch anything. Runner up was a local override in `Profile` only, rejected because navigating away would show the old name again.

Decided small calls (the engineer chose or accepted each):
- Password form asks for new and confirm only, matching `ResetPassword`. Runner up: ask for the current password too. Rejected because the live session already proves identity, and Supabase can still demand a recent login and returns an error we show.
- Leave other devices signed in after a password change. Runner up: `signOut({scope:'others'})`. Rejected as an extra call that can fail, with no stated threat.
- No leave guard on Profile. Each form is one field or two and saves on its own click, so a lost draft costs seconds.
- Delete account and change email are out of scope (see Follow-up).

## Feature design

**Data model sketch**:
No new tables, columns, or migrations. Everything is read from, or written to, the Supabase auth user:

| Field | Where it lives | Editable |
|---|---|---|
| email | `user.email` | no |
| created | `user.created_at` | no |
| sign in method | `user.identities[].provider` (fallback `user.app_metadata.provider`) | no |
| display name | `user.user_metadata.display_name` (string, optional, max 40) | yes |
| password | Supabase auth (never read, never stored by us) | yes |

**State transitions**:
None beyond form states per card: idle, busy, success message, error message.

**API surface** (Supabase client calls from the browser, no new serverless endpoint):
| Call | Used for | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `supabase.auth.updateUser({password})` | change password | new password (string, 6 or more) | updated user | current session | weak or same password, recent login needed, network |
| `supabase.auth.updateUser({data:{display_name}})` | save display name | name (string, 0 to 40, trimmed) | updated user | current session | session expired, network |
| `supabase.auth.signOut()` | sign out | none | none | current session | none shown (existing path) |

**Value sourcing**:
| Action | Value produced / displayed | Source |
|---|---|---|
| Show email | email | `authUser.email` |
| Show created date | formatted date | `authUser.created_at`, formatted with `toLocaleDateString` in the browser locale and timezone |
| Show sign in method | "Email and password" or provider name | `authUser.identities[].provider`, fallback `authUser.app_metadata.provider`, default "email" |
| Show whether the password form appears | has password identity | true when any identity provider is `email` |
| Show display name | current saved name | `authUser.user_metadata.display_name`, empty string when missing |
| Save display name | stored name | typed input, trimmed, sliced to 40 |
| Name still shown after leaving the page | fresh user object | `App` auth listener, updated on `USER_UPDATED` (RECOMMEND item below) |
| Password rules | minimum length 6 | the same value as Login (`minLength={6}`) |
| Sign out | session end | existing `requestLeave({type:'logout'})` in `App` |
| Go to Settings | view change | existing `requestLeave({type:'view',id:'settings'})` |

**Key invariants**:
- The email, created date, and provider are never editable on this page.
- A password value is never logged, stored in browser storage, or put in the URL. Password inputs use `type="password"` and `autoComplete="new-password"`.
- The display name renders as plain text (React escapes it). It is never injected as HTML.
- `App`'s auth listener replaces the user object on `USER_UPDATED` only, and still never triggers the data reload (the load effect keys on `userId`).

**Security model**:
Only the signed in user can change their own password and metadata, enforced by Supabase auth through the session token. There is no new table, so no row level security change. No regulated data is added. The page is not reachable without a session (the app shows Login when there is no `authUser`).

**Configuration required**:
None. No new env var, secret, migration, or Supabase dashboard change.

**Critical test scenarios**:
- Happy path: open Profile from the nav, see email, date, and "Email and password", change password with matching valid input, see "Password updated" and cleared fields, verifies **AC-1**, **AC-2**, **AC-3**, **AC-4**
- Validation: short password, empty password, and mismatched confirm each show a message and make no `updateUser` call, verifies **AC-5**
- Failure: `updateUser` returns an error and a thrown network error each show their message and keep the fields, verifies **AC-6**, **AC-9**
- Non password account: provider `google` hides the form and shows the provider note, verifies **AC-7**
- Display name: trims, stops at 40, empty clears, Save disabled when unchanged, name still shown after navigating away and back (listener on `USER_UPDATED`), verifies **AC-8**
- Navigation: Sign out calls the logout path, Settings link goes through the leave guard with a dirty Settings draft, verifies **AC-10**, **AC-11**
- Double click: second click while busy sends no second call, verifies **AC-13**
- Phone width: single column, no sideways scroll, verifies **AC-12**

Tests follow project rules: `@testing-library/user-event` v13 (no `userEvent.setup()`), and clear `sessionStorage` between full app tests because the app restores `gm_view`.

## Build plan

Tracer Bullet: thin and complete first, then thicken. Each step leaves a working app.

1. Thin thread: add the `Profile` nav item (one entry in the shared `nav` array feeds both desktop and mobile menus, before Settings), a `view==='profile'` line in the page switch next to the other views, a `User` icon from `lucide-react`, the page shell with Account details (email, created date, sign in method), Sign out, and the Go to Settings link, restored through `gm_view`, satisfies **AC-1**, **AC-2**, **AC-3**, **AC-10**, **AC-11**
2. Change password: form, validation, `updateUser`, success and error messages, busy lock, provider note for non password accounts, satisfies **AC-4**, **AC-5**, **AC-6**, **AC-7**, **AC-13**
3. Display name: input with trim and 40 limit, save, messages, and the `USER_UPDATED` listener change in `App` so the saved name survives navigation and reload, satisfies **AC-8**, **AC-9**, **AC-13**
4. Phone width pass, regression check of Settings, Login, and the leave guard, and the tests listed above, satisfies **AC-12**, **AC-14**

## Consequences

**Positive**:
- Users can see and manage their identity in one place, with no migration or backend work.
- Password change works in app, so the reset email is only needed when the password is lost.
- The single Settings Save bar behavior stays intact.

**Negative / tradeoffs**:
- The display name lives in auth metadata, so it cannot be joined to trades in SQL and moves with the auth provider.
- Password change with no current password check relies on Supabase's own recent login rule; a left open laptop could have its password changed by whoever holds the session.
- The sign in method row is mostly a guard today, since only email and password exists.

**Neutral**:
- `App`'s auth listener gains one rule (`USER_UPDATED` replaces the user object), a small change to shared code.
- The name is not shown outside Profile in this spec.

## Follow-up

- [ ] Enroll "Delete account" as a deferred idea: needs a server endpoint with the Supabase service role key and a full data cascade, so it is its own feature
- [ ] Enroll "Change email" as a deferred idea: needs the confirm mail flow and a pending state
- [ ] Optional later: show the display name in the sidebar footer (chosen out for this slice)
- [ ] `supabase` and `vercel-react-best-practices` are already listed in root `AGENTS.md`, no context file change needed
