# Rocket Life: notes for Claude

A personal work tracker PWA for one user (Blue). The phone is used for check-in/out, stats, places and short notes. The computer (screen ≥ 1024px) is used for writing to-dos and projects. Both share data through Supabase.

- **Live:** https://milkcakelychee-hue.github.io/rocket-life/ (GitHub Pages deploys automatically on each push to `main`)
- **Repo:** `milkcakelychee-hue/rocket-life`. This folder is the repo root.
- **Reply to the user in Thai**, using plain, short language. The user isn't a developer.

## Working rules (agreed with the user)
- **Redesigns and new features:** show them to the user in the preview first, and push only after they say "Push it".
- **Small edits** (wording, size, color, removing text): edit and push without asking.
- **Batch edits:** push once a round is done. Don't push often.
- **New features:** add a line to `CHANGELOG` in `src/2-views.js`, the "มีอะไรใหม่" section on the settings page. Wording/size/color tweaks don't need one.
- Commits end with an attribution line, as the system reminder says.

## Build and ship
Edit only `src/`, then concatenate it into `app.js` (no bundler):
```bash
cat src/0-map.js src/1-core.js src/2-views.js src/3-sheets.js src/4-sync.js src/5-desk.js > app.js && node --check app.js
```
1. Bump `CACHE` in `sw.js` on every push (currently `rocketlife-v23`). Otherwise the iPhone keeps loading the old version.
2. `git add -A && git commit && git push`. If the push fails with `RPC failed`, push again.
3. Wait for the Pages run to succeed (`gh run list -L1`), then check that the live `sw.js` has the new version. A run once got a GitHub 500 and needed `gh run rerun`.
4. Tell the user to close and reopen the app.

**Local preview:** `python3 -m http.server 8123` in this folder, then open http://localhost:8123.
- Clear old caches first: unregister the service worker and `caches.delete` everything, then reload.
- Check at phone size (375×812) and at computer size (≥1024px wide).
- Test data you add for checking must have ids starting with `zz`, and you must delete it afterwards.
- Never sign in to sync in the preview, so test data never reaches the real data.

## Code layout
| File | Contents |
|---|---|
| `src/0-map.js` | Thailand map SVG paths, used to highlight provinces |
| `src/1-core.js` | Icons, constants (`STATUS`, `PRIORITY`, `WAIT`, `CATEGORIES`), date helpers, `db` + `load()`/`save()` (localStorage `rocketlife.v1`), `runDailyRules()`, `todayItems()` |
| `src/2-views.js` | Every page as an HTML string: `viewToday`, `viewProjects`, `viewProject`, `viewCalendar`, `viewRecords`, `viewStats`, `viewSettings`, `todoRow`, `timelineCard`, plus `ui` (in-memory state) and `CHANGELOG` |
| `src/3-sheets.js` | Bottom sheets, the `ACT` action map (`data-act`), the `FORM` handlers (`data-form`), the router `render()`, drag-to-reorder of Today to-dos, swipe-left actions, app startup |
| `src/4-sync.js` | Supabase sync (see below) |
| `src/5-desk.js` | Computer layout: `isDesk()`, and `deskBoard(scope)` with card / table / calendar views and mouse drag and drop |
| `styles.css` | Color tokens, light and dark. The `@media (min-width:1024px)` block at the end is the computer layout. |

**Order trap:** the files are joined into one script, and `render()`/`save()` run during startup inside `3-sheets.js`, before the code in `4-sync.js` and `5-desk.js` has run. So in those two files use only `function` and `var` (not `const`/`let` at top level), and guard against `undefined`.

## Data (summary)
- `projects`: `status` is todo · doing · waiting · revise · hold · done · archived. Done projects move to `archived` the next day. Also `priority` 1–4, `start`, `due`, `categories[]`.
- `tasks` (subtasks):
  - `projectId`, `plannedFor` (date it sits in Today's to-do), `due`, `order`, `done`, `cat`.
  - `wait`: null (to-do) · `doing` · `info` (waiting for info) · `review` (waiting for review).
  - The computer board uses `wait` as its columns. The phone shows only `info` and `review`, as grey cards.
- `todos` (floating to-dos): `date`, `hold` (postponed indefinitely), `cat`. Linking a to-do to a project turns it into a task.
- `appts`: `placeId`, `projectId`, `visitId`. When the day comes, Today shows an "ถึงแล้ว" (arrived) button. Tapping it records a visit on that place.
- `places` (`visits[]`, `province`, `cat`), `people`, `notes`, `timeLogs` (check-in/out, mood).
- `settings.todayOrder[date]` keeps the order of Today's to-dos. Finished items always sink to the bottom.

## Supabase sync
- Project `riudqjmefgsdyyumbepd` in the user's "Blue" organization (free plan). The publishable key is already in `src/4-sync.js`, which is fine for front-end code. **Never ask for or use the service_role / secret key.**
- Table `app_state(user_id, data jsonb, updated_at)`. Row-level security lets each user see only their own row. The whole `db` is one row.
- Login is email + password. Confirm email is turned off on the Supabase side.
  - Magic links aren't used: they open in Safari, not in the PWA.
  - OTP codes aren't used: the free plan can't edit email templates.
- Behavior:
  - On open, or on returning to the app, pull from the server.
  - On `save()`, mark the data dirty and push after 1.5 seconds.
  - If both sides changed, the server copy wins and the local copy is kept in `rocketlife.v1-conflict`.
  - The sync state lives separately in localStorage `rocketlife-sync`.
- Free-plan limit: the project pauses after 7 days with no use. Restore it in the dashboard.
- Reusable skill for other apps: `.claude/skills/supabase-sync/` (it uses the shared table `app_data` with an `app` column).

## Decisions already made
- One link for both phone and computer, split by screen width (1024px). Data is never duplicated.
- Computer: left sidebar, and a board in Today and on the project page that switches between cards, table and calendar (remembered in localStorage `rocketlife-boardview`).
  - Card columns: ต้องทำ / กำลังทำ / รอข้อมูล / รอตรวจสอบ / เสร็จแล้ว.
  - The circle on each card is a category icon, not a person (single user).
- Theme: purple `--purple`, dark `--dark`, font Bai Jamjuree. Supports light and dark mode.
- Bangkok is always highlighted on the province map (the user's workplace).

## Next steps the user has planned (not done yet)
1. A quick-add box on the computer that understands `#project @tomorrow !urgent`, plus keyboard shortcuts (N add, / search, Esc close).
2. Trim the phone: hide creating and editing projects, keep check-in, stats, places and notes, add a center quick-add button, and change the menu to Today · Records · (+) · Stats · Settings.
3. Extras: attach photos, check in with a location, end-of-day summary.
4. Not yet tested with a real finger or mouse: dragging cards on the computer, and swipe-to-delete and drag-to-reorder on iPhone. Ask the user to try them.
