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
export S=$(mktemp -d)   # scratch for the loader and the screenshots, outside the repo
pnpm install --frozen-lockfile
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
```

It is ready when `$S/up.log` says `up` and `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:4800/` prints `200`. The page is the built suite in `dist/`, served with the real Function code (`/api`) in front of the pretend GitHub on port 4801 (`tests/fixtures/serve.ts`, `tests/fixtures/fake-github/`). Last clean start, timed with `date` before and after: 14 seconds from a fresh clone to the page answering 200, install, build and the git workaround for the blocked host included (2026-11-18 02:03 UTC), on commit fa7e558.

## Drive it

Open it in a real browser: the Chromium and Playwright the container already has (`require('playwright')`, then `chromium.launch()`), at each size in the device matrix in Settings. Tap, click, type and press keys the way a person would, and find things by their label or role. Take a screenshot at deviceScaleFactor 1 for your own check, and save it in the scratchpad, never in the repo. The main screen, what it shows and how to use it:

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
  await p.screenshot({ path: process.env.S + '/main-' + size.width + '.png' })
  await b.close()
})()
EOF
NODE_PATH=$(pnpm root)/ node $S/drive.js
```

Read the screenshot: the top bar with "Crate Game", the level, the tool bar.

## The journeys

One line each, from a person's side: where it starts, the steps, and what they see at the end.

- First run: open the page with nothing remembered, pick English, tap "Go on", tap "Try it now", and see Crate Game open with the welcome card.
- Look around and change something: tap a thing in the level, drag it, and see the top right button change to say the change can be put in the game (sign in first to save).
- Every other path (sign in, put it in the game, waiting changes, share, approve) is a file in `tests/journeys/`; run the ones a change reaches with `pnpm exec vitest run --project journeys` and the file's path (they start their own servers on ports 4800 and 4801, so stop the ones started above first).

## Stop it

Stop every server it started and clear what it wrote, so the next run starts clean.

```sh
pkill -f "$S/up.mjs"; rm -rf "$S"; unset S
git clean -xfd   # only on a throwaway checkout: it also removes node_modules and dist
```

## When it breaks

A step that breaks or flakes is fixed in this skill first. Each known way a start or a step fails, what it looks like, and the fix:

- `pnpm install` stops with `ERR_PNPM_FETCH_403 ... codeload.github.com/mcthaydt/AutomataFramework/tar.gz/` plus the pinned commit: this happens when the session does not have mcthaydt/AutomataFramework attached, and the framework is a git dependency; the git fallback below needs no extra access. Install it from git instead, then put `package.json` and `pnpm-lock.yaml` back:
  ```sh
  git clone https://github.com/mcthaydt/AutomataFramework "$S/fw" && git -C "$S/fw" checkout $(grep -o 'AutomataFramework#[0-9a-f]*' package.json | cut -d# -f2)
  (cd "$S/fw" && pnpm install --frozen-lockfile && pnpm pack --pack-destination "$S")
  sed -i "s#\"github:mcthaydt/AutomataFramework[^\"]*\"#\"file:$S/automataframework-framework-0.1.0.tgz\"#" package.json
  pnpm install --no-frozen-lockfile; git checkout package.json pnpm-lock.yaml
  ```
  Never commit that change. Use a normal install where the host is open.
- `vite: not found` after a failed install: the install did not finish; fix the install first.
- `ERR_UNKNOWN_FILE_EXTENSION ".toml"` when starting: the `--import $S/reg.mjs` part is missing; the fixtures read `automata.toml?raw`, which only Vite or that loader understands.
- `EADDRINUSE` on 4800 or 4801: an earlier run is still up (or a journey test); stop it with the stop commands.
- The default `node` is 22 and `engines` asks for 24.21 or later: set the PATH line first.
- `Cannot find module 'playwright'` in `drive.js`: `NODE_PATH` must point at the repo's `node_modules` (`pnpm root`).
- Never the real GitHub: if a screen offers "Sign in with GitHub", do not follow it.
