---
name: verify
description: Use when a change alters what the product does, before calling it done and before each commit that changes behavior: starts this repo's app or game from a clean checkout and drives it the way a person would.
---

# Verify

The editors suite: a web page where a team opens its game from its GitHub repo, changes the content files by touch, and saves each change into the game or as a suggestion. Here it runs against a pretend GitHub, never the real one.

## Start it

From a clean checkout in a cloud container, in order. First pick the Node version (or other runtime) that `engines` in `package.json` asks for. Then install, build, and start every stand-in for an outside service (a database, payments, mail, sign-in), never the real one.

```sh
export PATH=/opt/node24/bin:$PATH
export SCRATCH=/path/to/the/session/scratchpad   # the session scratchpad directory named in your instructions; drive.js writes the screenshots here, so this line is needed
export S=$(mktemp -d -p "$SCRATCH")   # everything below lives in $S, outside the repo
R=$(git rev-parse HEAD)   # works on a branch and on a detached checkout; commit and push first, the clone has only what is pushed
git clone -q "$(git remote get-url origin)" $S/repo && cd $S/repo && git checkout -q $R   # a fresh clone is the clean start
pnpm install --frozen-lockfile || {
  # 403 from codeload.github.com: the framework is a git dependency and the host is turned away here. Install it from git:
  git clone -q https://github.com/mcthaydt/AutomataFramework $S/fw && git -C $S/fw checkout -q $(grep -o 'AutomataFramework#[0-9a-f]*' package.json | cut -d# -f2)
  (cd $S/fw && pnpm install --frozen-lockfile && pnpm pack --pack-destination $S)
  sed -i "s|github:mcthaydt/AutomataFramework#[0-9a-f]*|file:$S/automataframework-framework-0.1.0.tgz|" package.json
  pnpm install --no-frozen-lockfile; git checkout package.json pnpm-lock.yaml   # never commit that change
}
pnpm build:journeys
cat > $S/raw.mjs <<'EOF'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
export async function load(url, ctx, next) {
  if (!url.endsWith('?raw')) return next(url, ctx)
  const source = 'export default ' + JSON.stringify(readFileSync(fileURLToPath(url.slice(0, -4)), 'utf8'))
  return { format: 'module', shortCircuit: true, source }
}
export async function resolve(spec, ctx, next) {
  if (!spec.endsWith('?raw')) return next(spec, ctx)
  const r = await next(spec.slice(0, -4), ctx)
  return { ...r, url: r.url + '?raw', shortCircuit: true }
}
EOF
cat > $S/reg.mjs <<EOF
import { register } from 'node:module'
register('$S/raw.mjs', import.meta.url)
EOF
cat > $S/up.mjs <<'EOF'
const here = process.cwd()
const { startFakeGitHub } = await import(here + '/tests/fixtures/fake-github/server.ts')
const { startSite } = await import(here + '/tests/fixtures/serve.ts')
const { DEMO } = await import(here + '/tests/fixtures/api.ts')
const fake = await startFakeGitHub(4801, 'http://127.0.0.1:4800')
await startSite(4800, { ...fake.env, DEMO_GAME: DEMO })
console.log('up')
EOF
node --import $S/reg.mjs $S/up.mjs > $S/up.log 2>&1 &
n=0; until grep -q '^up' $S/up.log && [ "$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:4800/)" = 200 ]; do
  n=$((n+1)); [ $n -ge 60 ] && { echo "NOT READY after 60 tries (30 seconds); see $S/up.log:"; cat $S/up.log; exit 1; }
  sleep 0.5
done
```

It is ready when `$S/up.log` says `up` and `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:4800/` prints `200`. The page is the built suite in `dist/`, served with the real Function code (`/api`) in front of the pretend GitHub on port 4801 (`tests/fixtures/serve.ts`, `tests/fixtures/fake-github/`). Last clean start, timed with `date` before and after: 69 seconds on a detached checkout and 79 seconds on the branch, from a fresh clone to the page answering 200, with the install, the git fallback and the build included (2026-11-18); 20 seconds was measured with a warm package store, on commit 3369165.

## Drive it

Open it in a real browser: the Chromium and Playwright the container already has (`require('playwright')`, then `chromium.launch()`), at the sizes the change affects (see "Shoot what the change touches" in `visual-check`). The sizes come from `SIZES` in `tests/fixtures/journey.ts` (phone 390×844, iPad 834×1210, computer 1280×800); the sizes below copy them, so change both together. Tap, click, type and press keys the way a person would, and find things by their label or role. Take a screenshot at deviceScaleFactor 1 for your own check, and save it in the scratchpad, never in the repo. The main screen, what it shows and how to use it:

A person with no sign-in first sees "Choose your language" (tap "Go on"), then the welcome page "Automata Editors" with "Try it now" and "Sign in with GitHub". "Try it now" opens the demo game, Crate Game: a top bar (`[data-bar]`, with the game's name), the level drawn big, a tool bar at the bottom (Pick, Place, Paint, Erase, Join, List, Show), and a "Welcome to the editor" card to dismiss. Never sign in for real: the real sign-in goes to GitHub.

```sh
cat > $S/drive.js <<'EOF'
const { chromium } = require('playwright')
;(async () => {
  const size = JSON.parse(process.argv[2] || '{"width":834,"height":1210}')
  const b = await chromium.launch()
  const p = await (await b.newContext({ viewport: size, hasTouch: true })).newPage()
  await p.goto('http://127.0.0.1:4800')
  await p.getByRole('button', { name: 'Go on' }).tap()
  await p.getByRole('button', { name: 'Try it now' }).tap()
  await p.locator('[data-bar]').waitFor()
  await p.screenshot({ path: process.env.SCRATCH + '/verify-main-' + size.width + '.png' })
  await b.close()
})()
EOF
export NODE_PATH=$(pnpm root)
node $S/drive.js '{"width":390,"height":844}'     # small phone
node $S/drive.js '{"width":834,"height":1210}'    # tablet
node $S/drive.js '{"width":1280,"height":800}'    # computer
```

Read the screenshots in `$SCRATCH` (`verify-main-390.png`, `-834.png`, `-1280.png`; they survive the stop step). Run "Start it" and "Drive it" as one script, or set `PATH`, `SCRATCH`, `S` and `NODE_PATH` again in every call, since each call is a new shell. What each size shows: at 834 and 1280 the top bar says "Crate Game", and the tool bar is at the bottom (at 1280, List and Add sit in a left side rail); at 390 the bar shows "Levels · Level 1", "Play" and "Up to date" instead of the game's name, and the welcome card covers the tool bar until it is closed.

## The journeys

One line each, from a person's side: where it starts, the steps, and what they see at the end.

- First run: open the page with nothing remembered, pick English, tap "Go on", tap "Try it now", and see Crate Game open with the welcome card.
- Look around and change something: tap a thing in the level, drag it, and see the top right button change to say the change can be put in the game (sign in first to save).
- Every other path (sign in, put it in the game, waiting changes, share, approve) is a file in `tests/journeys/`; run the ones a change reaches with `pnpm exec vitest run --project journeys` and the file's path (they start their own servers on ports 4800 and 4801, so stop the ones started above first).

## Stop it

Stop every server it started and clear what it wrote, so the next run starts clean.

```sh
pkill -f "$S/up.mjs"; cd; rm -rf "$S"; unset S   # deletes the fresh clone and the loader; the screenshots are in $SCRATCH and are kept
```

## When it breaks

A step that breaks or flakes is fixed in this skill first. Each known way a start or a step fails, what it looks like, and the fix:

- `pnpm install` stops with `ERR_PNPM_FETCH_403` on `codeload.github.com`: the session does not have mcthaydt/AutomataFramework attached, and the framework is a git dependency. The install step already falls back to git, which needs no extra access; if it still fails, check that `$S/fw` was cloned.
- `vite: not found` after a failed install: the install did not finish; fix the install first.
- `ERR_UNKNOWN_FILE_EXTENSION ".toml"` when starting: the `--import $S/reg.mjs` part is missing; the fixtures read `automata.toml?raw`, which only Vite or that loader understands.
- `EADDRINUSE` on 4800 or 4801: an earlier run is still up (or a journey test); stop it with the stop commands.
- The default `node` is 22 and `engines` asks for 24.21 or later: set the PATH line first.
- `Cannot find module 'playwright'` in `drive.js`: `NODE_PATH` must point at the repo's `node_modules` (`pnpm root`).
- Never the real GitHub: if a screen offers "Sign in with GitHub", do not follow it.
