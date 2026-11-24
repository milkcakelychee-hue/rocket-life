---
name: supabase-sync
description: Add cross-device sync to a single-user vanilla JS / PWA app that keeps all its data in one localStorage object, using Supabase (one JSON row per user per app, email + password login). Use when the user wants an app's data "ตรงกันทุกเครื่อง", "ซิงก์ข้ามเครื่อง", to open the same app on computer and phone, or asks to reuse the Rocket Life Supabase sync in another project.
---

# Supabase sync for single-user PWAs

Pattern proven in Rocket Life (`src/4-sync.js` in the rocket-life repo). The whole app state (`db`) is stored as one `jsonb` row per user per app. Newest write wins, and the losing local copy is kept as a backup.

## When it fits
- The app keeps all its state in one JS object saved to localStorage through a single `save()` function.
- Only one person uses it (no sharing or collaboration).
- If the app has separate tables or several users, design real tables instead. This pattern doesn't fit that case.

## 1. Supabase setup (the user does this; Claude can't create accounts)

The user may already have a Supabase project. The free plan allows 2 projects, so **reuse the existing one** and give each app its own `app` key. Ask the user for the **Project URL** and the **publishable / anon key**. To find them: click **Connect**, then the Framework tab, then scroll to `.env.local`. Never ask for the `service_role` / secret key or the database password.

Check whether the shared table already exists. If it doesn't, have the user run this in **SQL Editor**:

```sql
create table if not exists app_data (
  user_id uuid not null references auth.users on delete cascade,
  app text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, app)
);
alter table app_data enable row level security;
create policy "own data only" on app_data
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

Note: Rocket Life uses an older table, `app_state`, which has no `app` column. Leave it as it is. New apps use `app_data`.

The user also needs to go to **Authentication → Sign In / Providers → Email** and turn **Confirm email** OFF, otherwise sign-up gets stuck waiting for an email link. This is already done if the project is shared with Rocket Life.

## 2. Code

1. Copy `template-sync.js` (in this skill folder) into the app. Fill in `SB_URL`, `SB_KEY` and `APP`, and adapt these hooks to the app's own names:
   - `db`, `blank()` and `KEY`: the app's state object, its default factory and its localStorage key
   - `render()`, `toast()`, `openSheet()`, `closeSheet()`, `esc()` and the action map: the app's UI helpers. Replace them if the app has none.
2. Load supabase-js **before** the app script, with the version pinned:
   `<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js"></script>`
3. At the end of `save()`, add `if (typeof queuePush === 'function') queuePush();`
4. Add a settings entry that opens `sheetLogin()` and shows `syncLabel()`.
5. If a service worker caches assets, allow `cdn.jsdelivr` so the library works offline. Bump the cache version.

## Gotchas (learned the hard way)
- **Use email + password, not a magic link or OTP.** On iPhone, a magic link from email opens in Safari, not in the installed PWA. The free plan can't edit email templates without custom SMTP, so OTP codes never appear in the email.
- **Script order:** if the sync file is concatenated after code that runs at startup (`render()` or `save()` at load), declare its state with `var` and guard against `undefined`. `const` would throw a TDZ error.
- The free project **pauses after 7 days with no activity**. Data is kept, but the user has to restore it in the dashboard. Mention this to the user.
- The built-in email sender only allows a few emails per hour. That's fine with password login.
- Supabase errors: show `error.message` on sign-up failure, but a generic "wrong email or password" on sign-in failure.

## Verify
- In the preview, `await sb.from('app_data').select('*')` without logging in should return 0 rows with no error. That shows the access rules (RLS) work.
- The user tests sign-up and sign-in themselves. Never type their password.
- Before shipping, tell the user to back up their local data first.
