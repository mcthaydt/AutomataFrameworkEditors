# M1 Thin Thread: the Editors Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task, in
> one session, with no subagents (project rule). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A team works on its game together in the browser, on an iPad. Anyone can open a game and change it
freely without signing in, and keep a copy of what they made; saving it into the game and working with others
needs a sign-in with GitHub. What Save then does follows from the person's level (Look, Suggest, Approve, Edit,
Owner), which the game's Owner sets on a Share screen. Nobody but the Owner, once, has to touch GitHub. The editors
change a game's authorable content only (the JSON files the coding agents produce); the code stays the agents' work.

**Architecture:** One private package in two halves. The page is Svelte 5, built by Vite into static files; it never
talks to GitHub, only to this site's own `/api`. The other half is that API: Cloudflare Pages Functions that act as
the editor's GitHub App. They check who is asking, read the game's sharing file to find that person's level, and do
the GitHub work themselves: read the game, commit a change, open a suggestion (a side branch and a pull request),
approve one (merge it), or rewrite the sharing file. Both halves use the framework's `parseContent` and
`writeContent`, so every byte written is what the framework writes. End-to-end journeys drive the built page in
Chromium, WebKit and Firefox, with the real API code running against a pretend GitHub inside CI.

**Tech Stack:** TypeScript 6.0.3 strict (svelte-check needs TypeScript's JS API, which 7.0.2 does not have; the spec
allows 6.0.3 for that), Svelte 5.57.1, PixiJS 8.22.0, Zod 4.6.6, smol-toml 1.9.0, `@automataframework/framework` from
git at `ec4fddd96d0f1e39365ff807306faf9b42ac3190`, Vite 8.3.3, Vitest 5.0.3 (browser mode on Playwright 1.63.0),
Biome 2.5.15, knip 6.39.0, pnpm 10.34.6, Node 24.21.0; and, approved by the Owner on 2026-11-13,
`@sveltejs/vite-plugin-svelte` 7.3.1, `svelte-check` 4.7.6, `@types/node` 24.19.1, `@vitest/browser-playwright` 5.0.3.

**Spec:** [`2026-11-13-2d-first-layer-design.md`](https://github.com/mcthaydt/AutomataFramework/blob/main/docs/superpowers/specs/2026-11-13-2d-first-layer-design.md)
in the AutomataFramework repo: milestone M1, the Editors line ("the suite shell, GitHub sign-in and save, and the
Levels editor moving the crate, in the browser, at iPad size"), as widened by the Owner's decisions below. Principles
served: 1 (every action changes a documented file with the framework's own writer; who may do what is itself a file
in the game's repo), 2 (iPad size and touch first), 3 (2D only), 4 (its own repo), 6 (the old stack), 7 (nothing
built ahead of its use).

## Decided by the Owner (2026-11-13)

Answered through the coordinator while this plan was written. Several change what the spec says about Save and
sign-in; the spec in AutomataFramework needs a follow-up edit, which is the coordinator's to arrange.

- **The editors are a product for other teams**, working together on their own games in their own repos. They are
  not tied to this project's repos or its merge workflow. AutomataFrameworkExamples is only the test game.
- **"Collaboration between technical and non-technical people is non-negotiable."** Save must work for someone who
  has no rights on GitHub at all, and people get different levels of what they may do, "like Google Docs".
- **Every level is in M1:** Look, Suggest, Approve, Edit and Owner, with a Share screen.
- **People should "not need to interact with GitHub almost at all".** The editor's GitHub App does all the GitHub
  work. Levels live in a sharing file in the game's repo, which the API enforces; GitHub's own roles are not used,
  so a personal account or an organization makes no difference. Save makes the App open a pull request; Approve
  makes the App merge it; an Edit-level save goes straight in. Guests do not fork: the App writes their suggestion
  branch in the team's repo.
- **People still sign in with a GitHub account**, "just so they know" who they are to each other.
- **Agents working on the code are the primary way a game is made.** The editors are for the authorable content
  only: "exclusively the JSON stuff produced by the coding agents". An editor never opens or changes code.
- **Anyone can use the editor without signing in.** "They should be able to use the editor freely, they just can't
  save their work, export sure, but no saving or collaborating unless they sign in." A "Change this game" link on a
  site opens that game in the editor, straight away. A person who has not signed in is called a **visitor** below.
- **The App asks for as little as it can:** repository contents, pull requests, checks (read) and metadata. No
  Administration permission.
- **Onboarding is not to be neglected:** "one of the most important things for any product". The first run of each
  kind of person, visitors first, is its own task (Task 19), with its own journeys.
- **The browser editor gets its own Cloudflare Pages project**, connected to this repo by Cloudflare's GitHub
  integration. No deploy job, no token in GitHub.
- **Four development dependencies outside the spec's stack table are approved** (the Tech Stack line).
- **Nothing is published to npm in M1.**

## Access levels

Each level can do everything the one before it can.

| Level | In plain words | What the API lets them do |
|---|---|---|
| Nothing | Can't open the game | Nothing |
| Look | Can see the game | Read the game |
| Suggest | Can change things. Someone has to approve the changes | Save: a commit on their own branch, `automata/<login>`, and one pull request, both made by the App |
| Approve | Can suggest changes and approve other people's | Approve or turn down a waiting change that is not their own: the App merges or closes the pull request |
| Edit | Changes go straight into the game | Save: a commit on the default branch, made by the App. Approve any waiting change |
| Owner | Can do everything, and choose who helps | Rewrite the sharing file |

Who has which level is in **the sharing file**, `automata.access.toml`, at the root of the game's repo on its default
branch. It is a documented file like any other: an agent can read and change it (by pull request, like anything
else on a protected branch), and the Share screen is only a touch screen for it.

```toml
format = 1
everyone = "look"       # what anyone who signs in can do: "nothing", "look" or "suggest"

[[people]]
github = "grandpa"      # their GitHub name
level = "approve"       # "look", "suggest", "approve", "edit" or "owner"
```

The rules, which Task 3 builds and the API enforces on every call:

- The account that owns the repo is always an Owner, whatever the file says, so a game can never be left without one.
- A person's level is the higher of their own row and `everyone`. GitHub names are compared without regard to case.
- No file: `everyone` is `look` for a public repo and `nothing` for a private one, and there are no people.
- A file that cannot be read fails closed: only the repo's owner gets in, as Owner, and the Share screen says the
  list is broken and that saving it again mends it.
- The file is only ever read from the default branch. A suggestion that changes it changes nothing until it is
  approved, and the editor never approves a suggestion that touches it (that one is approved on GitHub).

**Visitors.** A person who has not signed in can open a game only if its repo is public and `everyone` is not
`nothing`; the API then reads it for them as Look, and never more, whatever `everyone` says. They can change
anything on the screen, and keep a copy of a level on their device (Task 18), and that is all: every route that
writes, lists waiting changes or shows the sharing list answers `signed-out` without a sign-in. Trying is not a
level in the file; it is what the editor does on the device, for everyone who can open a game, Look included.

**What GitHub is asked to guard.** With this design ordinary people have no rights on GitHub, so the sharing file is
the gate. A team that also wants GitHub to stop its own GitHub collaborators pushing to the default branch adds a
branch rule ("require a pull request with one approval") with Automata Editors on its bypass list; `docs/teams.md`
(Task 21) shows how. The editor works with or without the rule. If a rule blocks the App itself, the API answers
`blocked` and the Owner is told what to change.

## What this plan covers, and what it does not

In: the API (sign-in, who you are, open, save, waiting changes, approve, share), the suite's screens (welcome, pick
a game, the game's page, the Levels editor, waiting changes, Share), using all of it without signing in up to the
moment of saving, keeping a copy of a level, the first run for each kind of person, CI, journeys, and the deploy
steps.

Not in, because M1 does not use it, each with where it arrives:

| Left out | Arrives |
|---|---|
| Three-way merge of colliding edits. M1 never overwrites: it says the level changed elsewhere and offers their version; a waiting change that no longer fits is turned down, not merged by hand | M3 |
| Placing or deleting things, painting tiles, moving start points | M3 |
| Playing the game inside the suite | M3 |
| The other eight editors and the two builders | M3 |
| Opening a game, or a level file, straight from the device with no GitHub at all. In M1 a visitor opens a public game the editor has been added to | M3, if the Owner wants it |
| Languages. M1 is English, with every word in one file so Paraglide can take it over | M3 |
| The Tauri app and GitHub's device flow | M4 |
| Applying a branch rule for the team (it needs the Administration permission; see above) | not planned |
| The sharing file's schema in the framework's package, beside the content schemas. In M1 it is defined here; it should move, so `automata check` can check it | M2, a note for the framework's plan |

## Before starting

Stop and report to the coordinator if one is not true. Do not work around one.

1. `main` is protected in this repo, and GitHub-hosted runners accept its jobs (Task 1's first push shows it).
2. **The accounts** (spec, open item 1): a Cloudflare account with a Pages project for this repo, and the GitHub
   App. `docs/deploy.md` (Task 21) is the step-by-step. *Blocks:* only the real iPad check; CI goes green without
   them.

**Could not be checked while planning:** this session's network refused `docs.github.com`, so the GitHub calls in
Tasks 4 and 5 are written from memory of GitHub's REST documentation. The plan audit, or failing that the first step
of each of those tasks, checks every call (path, body, the permission it needs) against the documentation, and
reports any that differ before building on it.

## Global Constraints

- **Nothing is published to npm.** `package.json` has `"private": true`, no `publishConfig`, no changesets, and there
  is no release workflow.
- **The framework is a git dependency pinned to a commit on its `main`**, never a branch or a version:
  `"@automataframework/framework": "github:mcthaydt/AutomataFramework#ec4fddd96d0f1e39365ff807306faf9b42ac3190"`.
  That commit is the one that added the framework's `prepare` script, without which the install has no `dist/`. The
  same string is listed in `pnpm.onlyBuiltDependencies` in `package.json`; without it pnpm stops with
  `ERR_PNPM_GIT_DEP_PREPARE_NOT_ALLOWED` (if pnpm prints a different string to add, use the one it prints).
- **Only the framework's contract is relied on:** `loadGame`, `parseContent`, `parseProject`, `writeContent`,
  `formatDiagnostic`, `PROJECT_FILE`, `fitWorld`, `tileRuns`, `levelSize`, `SKY_COLOR`, `TILE_COLOR` and the `Level`,
  `Character`, `GameContent`, `Project`, `Diagnostic` types, as in the framework's `docs/api/framework.api.md`. A
  content file is written with `writeContent(type, value)` and nothing else.
- No dependency beyond the Tech Stack line. A task that needs one stops and asks.
- **Tests run only in GitHub-hosted CI, never locally.** `pnpm lint`, `pnpm typecheck`, `pnpm knip` and `pnpm build`
  are not tests and are run locally before every push.
- **The API side imports the framework only from `@automataframework/framework/headless`** (no page, no Pixi), and
  must stay small enough for a Cloudflare Function (Task 7 measures it).
- **The page never talks to GitHub.** It calls `/api` on its own origin and nothing else; the only GitHub address a
  browser is sent to is the sign-in page and, for an Owner, the page that adds the editor to a game.
- **The editors change authorable content only.** A game's content files (JSON, listed in its `automata.toml`) are
  the only part of a game an editor opens for changing, writes or exports. No screen shows, and no route reads or
  writes, a game's code, its `automata.toml` (read to find the content, never written) or anything else in the repo.
  The sharing file is the one other file written, and it says who may change the content, not what the game is.
- **Signing in is asked for only when it is needed:** to save, to see or approve waiting changes, to share, and to
  list your own games. Opening a game, changing it on the screen and keeping a copy never ask.
- **The API trusts nothing the page says about who someone is or what they may do.** Every call works out the
  person from their sign-in token, and their level from the sharing file on the default branch, afresh.
- **The API writes only two kinds of file:** a content file listed in the game's `automata.toml`, as
  `writeContent` writes it; and `automata.access.toml`, as `writeAccess` writes it, for an Owner.
- **No secret is ever in the page, the repo or a log.** The App's client secret and private key live only in
  Cloudflare's settings. Tests make their own key pair at run time; none is committed.
- PixiJS is the only renderer; only `src/features/levels/level-canvas.ts` imports it, and it imports
  `pixi.js/unsafe-eval` first. Zod is the only schema language. Effect is not used: the API is plain TypeScript.
- Game content is JSON; everything else is TOML (the sharing file is TOML).
- A source file has at most 600 lines. Comments say why. Conventional Commits.
- Touch targets are at least 44 px; primary actions at least 48 px. Layout follows the container's size. Sizes
  tested: iPad upright 820 by 1180, iPad sideways 1180 by 820, phone 390 by 844.
- World units are tiles, the origin is the level's top-left corner, **y points down**, and a thing's `x, y` is its
  centre (the framework's contract).
- **The drunk-grandma test.** Every word on a screen comes from `src/features/words/words.ts`, pinned in the task
  that adds it. No screen says repo, repository, commit, branch, pull request, token, OAuth, JSON, sync, push, merge
  or conflict. One primary action per screen. Task 20 uploads a picture of every screen at every size; the
  implementation audit reads them and treats a screen that fails as a defect.
- **No AI attribution** in commits, pull request bodies or docs. Set the author first:
  `git config --global user.name "McThayDT" && git config --global user.email "107786093+mcthaydt@users.noreply.github.com"`.
- Structure: as in `CLAUDE.md`. A feature imports only itself, `src/lib/` and features below it, and another feature
  only through its entry file.

## How every task is verified

There is no local test run. Each task proves itself in the pull request's CI (Task 1 creates it); read runs with the
session's GitHub tools.

- **Every task pushes twice.** First the tests alone: CI must fail, and the log must show the reason the step names.
  Then the implementation: every job must pass. Do not write the implementation before reading the red run.
- **Three kinds of test**, by file suffix: `*.test.ts` runs in Node; `*.browser.test.ts` runs in Chromium, WebKit and
  Firefox (Vitest browser mode: real layout, real pointer events); `*.journey.test.ts` runs in Node and drives the
  built page in one real browser, once per engine.
- After each task: tick its boxes here, update `docs/superpowers/progress.md` (stage 4 is the finished tasks out of 21),
  and send the coordinator one line: commit, test count, surprises.
- Stop rules (project): a failing check you cannot explain, a third fix for the same failure, an access refusal, a
  missing tool, or an item under "Before starting" that is not true. Stop that task and report at once. Hand off at
  90 minutes.

## The pretend GitHub

Tests never touch the real GitHub. `tests/fixtures/fake-github/` (Task 6) is a small Node HTTP server that keeps
repos in memory and answers the GitHub calls the API makes, the way GitHub's REST documentation says GitHub answers
them, including checking the App's signed token with the test's public key. From Task 7 on, the API's own tests run
the real API code against it over HTTP, and from Task 11 the journeys run the built page against that same API. What
only the real GitHub can prove (its sign-in and "add to a game" screens, a real branch rule, real checks) is the
iPad check in Task 21.

Its people: `grandma` (owns the game `grandma/crate-game`), `grandpa`, `kid` and `stranger`. A test says who is at
the keyboard with `fake.person`.

## File structure

```
package.json  tsconfig.json  svelte.config.js  vite.config.ts  vitest.config.ts  biome.json  knip.json
index.html  .env.journeys  public/_headers
.github/workflows/ci.yml
functions/api/[[path]].ts         the one Pages Function: hands every /api request to the service feature
src/index.ts                      mountSuite(target, config)
src/main.ts                       reads the build's settings and calls mountSuite
src/lib/                          base64.ts
                                  --- used by the page and the API ---
src/features/words/               words.ts (entry): every word a person reads
src/features/access/              access.ts (entry)  levels.ts  file.ts: the levels and the sharing file
src/features/wire/                wire.ts (entry): what the page and the API say to each other
                                  --- the API only (runs on Cloudflare; nothing of a page) ---
src/features/exchange/            exchange.ts (entry)  who.ts: the sign-in code swap, and who a token belongs to
src/features/github/              github.ts (entry)  app-token.ts  request.ts  repo.ts: GitHub, as the App
src/features/service/             service.ts (entry, the router)  enter.ts  games.ts  open.ts  save.ts
                                  waiting.ts  approve.ts  people.ts
                                  --- the page only ---
src/features/ui/                  ui.ts (entry)  Button.svelte  Screen.svelte  Notice.svelte  Choice.svelte  ui.css
src/features/api/                 api.ts (entry): calls /api
src/features/session/             session.ts (entry)
src/features/game/                game.ts (entry)  open.ts  save.ts  draft.ts  recent.ts  copy.ts
src/features/levels/              levels.ts (entry)  place.ts  edit.ts  level-canvas.ts  Levels.svelte
src/features/suite/               suite.ts (entry)  route.ts  guide.ts  App.svelte  Welcome.svelte  PickGame.svelte
                                  AddEditor.svelte  GameHome.svelte  LevelScreen.svelte  Waiting.svelte
                                  WaitingChange.svelte  Share.svelte  Guide.svelte
tests/architecture.test.ts  tests/architecture/rules.ts
tests/lib/  tests/features/<feature>/     mirror src/
tests/fixtures/game/              automata.toml, content/levels/level-1.json, content/characters/{hero,crate}.json
tests/fixtures/fake-github/       server.ts  repos.ts  keys.ts
tests/fixtures/api.ts             starts the pretend GitHub and gives a function that calls the real API code
tests/fixtures/serve.ts           serves dist/ and runs the real API code
tests/fixtures/journey.ts         the journeys' helpers (openPage, signIn, dragByTouch, picture, SIZES)
tests/journeys/                   *.journey.test.ts, global-setup.ts
tests/workflows/                  package.test.ts  ci.test.ts  bundle.test.ts
docs/deploy.md                    setting up Cloudflare and the GitHub App (whoever runs the site)
docs/teams.md                     for a team's Owner: adding the editor to a game, and the optional branch rule
```

Features, lowest first: `words`, `access`, `wire`, `exchange`, `github`, `service`, `ui`, `api`, `session`, `game`,
`levels`, `suite`. The API side (`exchange`, `github`, `service`) uses nothing a page has and no Svelte; the page
side (`ui` and up) never imports the API side. They meet only in `wire`.

## Review Focus

What the spec does not name but a person, or someone unkind, will try. Each has a test in the task that owns the
code.

1. **Someone gives themselves a higher level:** by sending a level in a request, by suggesting a change to the
   sharing file, by saving to a path that is not a content file, by showing up with a GitHub token from some
   other app, or with no token at all (a visitor reads a public game and nothing else, and writes nothing). Each
   must change nothing and be refused in plain words. Tasks 3, 4, 7, 8, 9, 10.
2. **Someone else changes the level between open and Save** (an agent, another device, an approved suggestion): the
   person's change must never overwrite theirs, never vanish silently, and the screen must say what happened and
   what to press. Tasks 8, 15.
3. **A change approved before it is safe:** while the game's checks are still running or have failed, or a person
   approving their own. Tasks 9, 16.
4. **The sign-in runs out, or the internet drops, in the middle of an edit:** the unsaved change is still there after
   signing in again or pressing Save again, and a Save that failed halfway does not leave two commits. The same
   holds for a visitor's first sign-in: what they made before signing in is there when they come back. Tasks 8,
   11, 15, 18.
5. **A drag that never ends** (the system cancels the touch, a second finger lands, the iPad is turned mid-drag),
   or a box dropped where it cannot be: the box goes back or stays inside, with one sentence saying why. Tasks 13,
   14.

---

### Task 1: The repo's skeleton, the pin, CI and the architecture test

**Files:**
- Create: `package.json`, `tsconfig.json`, `svelte.config.js`, `vite.config.ts`, `vitest.config.ts`, `biome.json`,
  `knip.json`, `.gitignore`, `index.html`, `.github/workflows/ci.yml`, `src/index.ts`, `src/main.ts`,
  `tests/architecture.test.ts`, `tests/architecture/rules.ts`, `tests/architecture/rules.test.ts`,
  `tests/workflows/package.test.ts`, `tests/workflows/ci.test.ts`
- Modify: `CLAUDE.md` (only if the Structure block no longer matches), `README.md`

**Interfaces:**
- Produces: `pnpm lint`, `pnpm format`, `pnpm typecheck`, `pnpm knip`, `pnpm build`, `pnpm test:node`,
  `pnpm test:engine <engine>`, `pnpm test:journeys`; CI jobs `check`, `engines (chromium|webkit|firefox)` and
  `screens`; and in `tests/architecture/rules.ts`:

```ts
export const LAYERS = ['words', 'access', 'wire', 'exchange', 'github', 'service', 'ui', 'api', 'session', 'game',
  'levels', 'suite'] as const
export const API_SIDE = ['exchange', 'github', 'service'] as const   // runs on Cloudflare
export const PAGE_SIDE = ['ui', 'api', 'session', 'game', 'levels', 'suite'] as const
export type SourceFiles = Readonly<Record<string, string>> // path from the repo root -> file text
export interface Violation { readonly file: string; readonly rule: string; readonly detail: string }
export function checkArchitecture(files: SourceFiles): Violation[]
```

- [ ] **Step 1: Write the config.** `package.json`: name `@automataframework/editors`, version `0.0.0`,
  `"private": true`, `"type": "module"`, `packageManager` `pnpm@10.34.6`, `engines.node` `>=24.21.0`, imports
  `"#src/*": "./src/*"`. Dependencies: the framework (the pinned string in Global Constraints), `svelte`, `pixi.js`, `zod`, `smol-toml`.
  Dev: the rest of the Tech Stack line, plus `playwright` 1.63.0, all exact. `pnpm.onlyBuiltDependencies`: the pinned
  string. Scripts: `lint` (`biome check .`), `format` (`biome check --write .`), `typecheck`
  (`svelte-check --tsconfig ./tsconfig.json --fail-on-warnings`), `knip`, `build` (`vite build`), `build:journeys`
  (`vite build --mode journeys`), `test:node` (`vitest run --project node`), `test:engine`
  (`vitest run --passWithNoTests --project`), `test:journeys` (`vitest run --project journeys`). `tsconfig.json`,
  `biome.json`, `knip.json` and `.gitignore`: copy the framework's at the pinned commit, drop `isolatedDeclarations`
  and `declaration` (nothing here is published), add `functions` to `include`, and add `**/*.svelte` wherever a list
  names source files.
- [ ] **Step 2: Write `vitest.config.ts`** with five projects. `node`: `tests/**/*.test.ts` except
  `*.browser.test.ts` and `*.journey.test.ts`. `chromium`, `webkit`, `firefox`: `tests/**/*.browser.test.ts`, browser
  mode, headless, the Playwright provider, one instance of that engine, the Svelte plugin, timeouts as in the
  framework's config. `journeys`: `tests/journeys/**/*.journey.test.ts`, Node, `globalSetup`
  `tests/journeys/global-setup.ts`, `fileParallelism: false`, `testTimeout` 60 000.
- [ ] **Step 3: Write `.github/workflows/ci.yml`**, from the framework's at the pinned commit (same triggers,
  permissions, concurrency, runner, pinned action SHAs, Node and pnpm steps). Job `check`: `pnpm lint`,
  `pnpm typecheck`, `pnpm knip`, `pnpm build`, `pnpm test:node`. Job `engines`, matrix
  `engine: [chromium, webkit, firefox]`, `fail-fast: false`: install that browser with its system dependencies,
  `pnpm test:engine ${{ matrix.engine }}`, `pnpm build:journeys`, `pnpm test:journeys` with `ENGINE` set to the
  engine, then upload `tests/**/__screenshots__/**` as `screens-${{ matrix.engine }}` (`if: always()`). Job
  `screens`: the framework's, unchanged (it copies the pictures to the `ci-screens` branch, where a cloud session can
  read them). No deploy job and no release workflow.
- [ ] **Step 4: Write the failing tests.** `tests/architecture/rules.test.ts`, one violation each, by `rule`:

```ts
const one = (files: SourceFiles) => checkArchitecture(files).map((v) => v.rule)
test('a feature may not import a feature above it', () =>
  expect(one({ 'src/features/access/a.ts': "import '../wire/wire.ts'" })).toEqual(['imports-go-down']))
test('another feature is imported through its entry file', () =>
  expect(one({ 'src/features/game/a.ts': "import '../api/client.ts'" })).toEqual(['through-the-entry']))
test('lib imports no feature', () =>
  expect(one({ 'src/lib/a.ts': "import '../features/words/words.ts'" })).toEqual(['lib-is-below-features']))
test('no cycles', () =>
  expect(one({ 'src/lib/a.ts': "import './b.ts'", 'src/lib/b.ts': "import './a.ts'" })).toEqual(['no-cycles']))
test('no tests in src', () => expect(one({ 'src/lib/a.test.ts': '' })).toEqual(['no-tests-in-src']))
test('a Svelte file is read like any other', () =>
  expect(one({ 'src/features/ui/A.svelte': "<script lang=\"ts\">import '../suite/suite.ts'</script>" }))
    .toEqual(['imports-go-down']))
test('Pixi stays in the level canvas', () =>
  expect(one({ 'src/features/levels/edit.ts': "import { Graphics } from 'pixi.js'" })).toEqual(['package-confined']))
test('the API side uses nothing a page has', () =>
  expect(one({ 'src/features/service/a.ts': 'localStorage.getItem("x")' })).toEqual(['api-side-has-no-page']))
test('the page side never imports the API side', () =>
  expect(one({ 'src/features/api/a.ts': "import '../github/github.ts'" })).toEqual(['page-never-imports-api-side']))
test('the page never calls GitHub\'s API itself', () =>
  expect(one({ 'src/features/game/a.ts': "fetch('https://api.github.com/user')" })).toEqual(['page-calls-only-its-api']))
test('a function is a thin wrapper over the service feature', () =>
  expect(one({ 'functions/api/a.ts': "import '../../src/features/github/github.ts'" }))
    .toEqual(['functions-use-service']))
test('a file has at most 600 lines', () =>
  expect(one({ 'src/lib/a.ts': 'x\n'.repeat(601) })).toEqual(['at-most-600-lines']))
test('a feature folder has its entry file', () =>
  expect(one({ 'src/features/game/open.ts': '' })).toEqual(['feature-has-entry']))
```

  `tests/architecture.test.ts` reads every file under `src/` and `functions/` and expects `[]`.
  `tests/workflows/package.test.ts` reads `package.json` and expects: `private === true`; no `publishConfig`; the
  framework dependency matches `/^github:mcthaydt\/AutomataFramework#[0-9a-f]{40}$/`; that same string is in
  `pnpm.onlyBuiltDependencies`; every other dependency version is exact (no `^`, `~`, `*` or `latest`).
  `tests/workflows/ci.test.ts` reads the workflows folder and expects: one workflow file, `ci.yml`; no text matching
  `npm publish`, `pnpm publish`, `NPM_TOKEN` or `changeset`; every `uses:` pinned to a 40-character SHA.
- [ ] **Step 5: Push; the `check` job fails** because `checkArchitecture` is not defined. If the run is refused or
  never starts, or the install fails on the git dependency, stop and report with the log's text.
- [ ] **Step 6: Implement `checkArchitecture`,** starting from the framework's `tests/architecture/rules.ts` at the
  pinned commit (first line: `// Lifted from AutomataFramework@ec4fddd: tests/architecture/rules.ts`). Changes: the
  `LAYERS` above; `.svelte` files are sources; drop `sim-is-pure` and `headless-is-headless`; `package-confined` is
  `pixi.js` only in `features/levels/level-canvas.ts`, `smol-toml` only in `features/access/`, and `svelte` only on
  the page side; `api-side-has-no-page` forbids `window`, `document`, `localStorage`, `sessionStorage` and
  `navigator` in the `API_SIDE` features and in `access` and `wire`; `page-never-imports-api-side` is what it says
  (the two sides meet only in `wire` and `access`); `page-calls-only-its-api` forbids the text `api.github.com` on
  the page side; `functions-use-service` lets a file under `functions/` import only
  `src/features/service/service.ts`. `src/index.ts` and `src/main.ts` are empty modules with a comment until
  Task 11.
- [ ] **Step 7: Push; all jobs pass** (browser and journey projects have no tests yet and must say so, not fail).
- [ ] **Step 8: Commit** (`chore: repo skeleton, the framework pin, CI and the architecture test`), then open the
  stage's pull request as a draft with a few lines saying what M1 builds here.

### Task 2: The words and the three UI pieces

**Files:**
- Create: `src/features/words/words.ts`, `src/features/ui/ui.ts`, `src/features/ui/Button.svelte`,
  `src/features/ui/Screen.svelte`, `src/features/ui/Notice.svelte`, `src/features/ui/ui.css`
- Test: `tests/features/words/words.test.ts`, `tests/features/ui/ui.browser.test.ts`

**Interfaces:**
- Produces: `WORDS` (a frozen object; a value is a string, or a function of a name that returns one), and from
  `ui.ts` the three components:
  - `Button`: props `label: string`, `kind?: 'primary' | 'plain' | 'danger'` (default `plain`), `disabled?: boolean`,
    `onpress: () => void`. A real `<button type="button">`. `primary` is at least 48 px tall, the others 44.
  - `Screen`: props `title: string`, `back?: { label: string; onpress: () => void }`, children. One `<h1>`; the
    title takes focus when the screen appears, so a screen reader and a keyboard start at the top.
  - `Notice`: props `kind: 'info' | 'good' | 'problem'`, `text: string`. `role="status"`, or `role="alert"` for
    `problem`. Kind is shown by an icon and a word as well as colour.

The first words, exactly. Each later task that adds a screen pins its own rows in a table like this one, adds
them to `WORDS`, and adds them to `words.test.ts`:

| Key | Words |
|---|---|
| `appName` | Automata Editors |
| `welcomeLine` | Change your game by touch, together. |
| `signIn` | Sign in with GitHub |
| `signInNotReady` | Sign-in isn't ready on this site yet. |
| `signInCancelled` | You didn't sign in. Press the button to try again. |
| `signInFailed` | Sign-in didn't work. Press the button to try again. |
| `signedOutAgain` | You've been signed out. Sign in again to keep going. |
| `signOut` | Sign out |
| `hintIdle` | Touch a box and drag it to move it. |
| `hintSelected(name)` | Drag *name*, or press the arrows. |
| `thingLabel(name)` | *name*. Drag to move it. |
| `moveLeft` `moveRight` `moveUp` `moveDown` | Move left / Move right / Move up / Move down |
| `undo` | Undo |
| `save` | Save |
| `solid` | That spot is solid ground. Try another spot. |

- [ ] **Step 1: Write the failing tests.** `words.test.ts`: every row above equals `WORDS[key]` (functions called
  with `'crate-1'`); and no value, lower-cased, contains any of `repo`, `commit`, `branch`, `token`, `oauth`, `json`,
  `toml`, `sync`, `push`, `pull`, `merge`, `conflict`, `schema`, `sha`, `api`, `fork`, `error` as a whole word (the test
  exports this list as `BANNED`, for Task 20). `ui.browser.test.ts`
  mounts each piece with Svelte's `mount` into a 390 px wide box: a `primary` Button's box is at least 48 px tall and
  44 wide, a `plain` one at least 44 by 44; pressing a disabled Button does not call `onpress`; Enter and Space on a
  focused Button call it once; a `problem` Notice has `role="alert"` and the others `role="status"`; a Screen has one
  `h1`, and it is `document.activeElement` after mount; a Button with a 60-letter label wraps inside the 390 px box
  (its right edge is inside).
- [ ] **Step 2: Push; `check` and the engines fail** on the missing modules.
- [ ] **Step 3: Implement.** `ui.css` holds the suite's few tokens (one font size scale starting at 18 px, the
  spacing, a light and a dark set of colours by `prefers-color-scheme`, a visible focus ring). No component library.
- [ ] **Step 4: Push; all jobs pass.**
- [ ] **Step 5: Commit** (`feat(ui): the words and the button, screen and notice`).

### Task 3: The levels and the sharing file

**Files:**
- Create: `src/features/access/access.ts`, `levels.ts`, `file.ts`
- Test: `tests/features/access/levels.test.ts`, `tests/features/access/file.test.ts`

**Interfaces:**
- Produces:

```ts
// levels.ts
export const LEVELS = ['nothing', 'look', 'suggest', 'approve', 'edit', 'owner'] as const
export type AccessLevel = (typeof LEVELS)[number]
export type Action = 'look' | 'save' | 'approve' | 'save-direct' | 'share'
export function can(level: AccessLevel, action: Action): boolean   // look: look+; save: suggest+; approve: approve+; save-direct: edit+; share: owner
export function higher(a: AccessLevel, b: AccessLevel): AccessLevel

// file.ts
export const ACCESS_FILE = 'automata.access.toml'
export const MAX_PEOPLE = 100
export interface AccessPerson { readonly github: string; readonly level: Exclude<AccessLevel, 'nothing'> }
export interface AccessFile {
  readonly format: 1
  readonly everyone: 'nothing' | 'look' | 'suggest'
  readonly people: readonly AccessPerson[]
}
export const AccessSchema: z.ZodType<AccessFile>
export function parseAccess(text: string): { readonly ok: true; readonly value: AccessFile } | { readonly ok: false; readonly problems: readonly string[] }
/** The one way to write the file: keys in the order above, people sorted by name without regard to case. */
export function writeAccess(file: AccessFile): string
export function defaultAccess(isPublic: boolean): AccessFile
export const CLOSED: AccessFile                                    // everyone nothing, no people: what a broken file counts as
export function levelOf(file: AccessFile, login: string, repoOwner: string): AccessLevel
```

  A GitHub name is 1 to 39 letters, digits or single dashes, not starting or ending with a dash. A name may be in
  `people` once, without regard to case. The file's problems are plain sentences, like the framework's
  (`people[1].level: This must be one of: look, suggest, approve, edit, owner.`).

- [ ] **Step 1: Write the failing tests.**

```ts
// levels.test.ts
test.each([
  ['nothing', []], ['look', ['look']], ['suggest', ['look', 'save']], ['approve', ['look', 'save', 'approve']],
  ['edit', ['look', 'save', 'approve', 'save-direct']], ['owner', ['look', 'save', 'approve', 'save-direct', 'share']],
])('%s can %j and nothing else', ...)

// file.test.ts
test('the repo owner is an owner whatever the file says', () =>
  expect(levelOf(CLOSED, 'Grandma', 'grandma')).toBe('owner'))
test('a listed person has their level', ...)                       // grandpa: approve
test('names are compared without regard to case', ...)             // 'GrandPa' finds 'grandpa'
test('a person gets the higher of their row and everyone', ...)    // row look, everyone suggest -> suggest
test('someone not listed gets everyone', ...)
test('no file: a public game lets everyone look, a private one lets nobody in', ...)
test('what writeAccess writes, parseAccess reads back the same', ...)
test('two writers of the same list make the same bytes, whatever order the people came in', ...)
test('the written file is the example in this plan, byte for byte', ...)   // the TOML under "Access levels", without its comments
test.each([
  ['not TOML at all', 'format = '],
  ['an unknown key', 'format = 1\neveryone = "look"\nadmins = []\n'],
  ['everyone set to owner', 'format = 1\neveryone = "owner"\n'],
  ['a level that does not exist', '...level = "god"'],
  ['a name GitHub would not allow', '...github = "-bad-"'],
  ['the same person twice, in different case', '...'],
  ['more than 100 people', '...'],
])('%s is refused with a plain sentence', ...)
test('writeAccess throws on a list parseAccess would refuse', ...)
```

- [ ] **Step 2: Push; `check` fails** on the missing modules.
- [ ] **Step 3: Implement** with Zod and smol-toml (`parse` and `stringify`).
- [ ] **Step 4: Push; all jobs pass.**
- [ ] **Step 5: Commit** (`feat(access): the levels and the sharing file`).

### Task 4: The sign-in step, and who a token belongs to

**Files:**
- Create: `src/features/wire/wire.ts`, `src/features/exchange/exchange.ts`, `who.ts`, `public/_headers`
- Test: `tests/features/exchange/exchange.test.ts`, `tests/features/exchange/who.test.ts`,
  `tests/features/exchange/headers.test.ts`

**Interfaces:**
- Produces:

```ts
// wire.ts (this task's part; later tasks add to it)
export type ProblemKind =
  | 'signed-out' | 'not-found' | 'not-a-game' | 'not-allowed' | 'own-change' | 'changed-elsewhere' | 'not-ready'
  | 'checks-failed' | 'clashes' | 'broken' | 'blocked' | 'bad-request' | 'not-set-up' | 'busy' | 'offline' | 'unknown'
export type Answer<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly problem: ProblemKind; readonly details?: readonly string[] }
export interface GameRef { readonly owner: string; readonly name: string }
export type Checks = 'passing' | 'running' | 'failing' | 'none'
export const STATUS: Readonly<Record<ProblemKind, number>>
// 401 signed-out; 403 not-allowed, own-change, blocked; 404 not-found, not-a-game; 409 changed-elsewhere, not-ready,
// checks-failed, clashes; 422 broken, bad-request; 500 not-set-up, unknown; 503 busy. 'offline' is only ever made by the page.
/** What the page keeps after sign-in. The token runs out after some hours; `refresh` gets the next one. */
export interface Tokens { readonly token: string; readonly refresh?: string }

// exchange.ts
export interface ExchangeEnv {
  readonly GITHUB_CLIENT_ID?: string
  readonly GITHUB_CLIENT_SECRET?: string
  readonly GITHUB_WEB_URL?: string   // default 'https://github.com'; tests point it at the pretend GitHub
  readonly GITHUB_API_URL?: string   // default 'https://api.github.com'
}
/** POST { "code" } (a new sign-in) or { "refresh" } (the next token). Gives Answer<Tokens>. */
export function handleTokenRequest(request: Request, env: ExchangeEnv, fetcher?: typeof fetch): Promise<Response>
/** Every /api answer is made here: JSON, the status from STATUS, `cache-control: no-store`. */
export function answer<T>(result: Answer<T>): Response
/** True when the request comes from this site's own pages: its Origin header is the request URL's origin. */
export function sameOrigin(request: Request): boolean

// who.ts
export interface Who { readonly login: string; readonly id: number }
/** Asks GitHub whether this token was made by *this* App's sign-in, and for whom. Any other token is 'signed-out'. */
export function whoIs(token: string, env: ExchangeEnv, fetcher?: typeof fetch): Promise<Answer<Who>>
```

  The code swap is `POST {web}/login/oauth/access_token` with `client_id`, `client_secret` and either `code` or
  `grant_type=refresh_token` and `refresh_token`, asking for JSON. `whoIs` is
  `POST {api}/applications/{client_id}/token` with Basic auth (client id and secret) and `{ access_token }`: 200
  gives `user.login` and `user.id`; 404 or 422 is `signed-out`. Asking GitHub's `/user` instead would accept a token
  made by any app, which is why it is not used.

- [ ] **Step 1: Write the failing tests** (a made-up `fetcher` that records its call):

```ts
const post = (body: unknown, origin = 'https://editors.example') =>
  new Request('https://editors.example/api/token', {
    method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify(body) })
const env = { GITHUB_CLIENT_ID: 'id', GITHUB_CLIENT_SECRET: 'secret' }

test('a good code comes back as tokens', async () => {
  const res = await handleTokenRequest(post({ code: 'abc' }), env, github({ access_token: 'ghu_1', refresh_token: 'ghr_1' }))
  expect(res.status).toBe(200)
  expect(await res.json()).toEqual({ ok: true, value: { token: 'ghu_1', refresh: 'ghr_1' } })
  expect(res.headers.get('cache-control')).toBe('no-store')
})
test('an App whose tokens do not run out gives a token and no refresh', ...)
test('a code: GitHub is asked with the id, the secret and the code, wanting JSON', ...)
test('a refresh: the same call with grant_type=refresh_token and refresh_token', ...)
test('a code or refresh GitHub refuses is 401 signed-out', ...)   // GitHub answers 200 { error: 'bad_verification_code' } or 'bad_refresh_token'
test('a request from another origin, or with no Origin, is 403 not-allowed and GitHub is never asked', ...)
test('GET is 422 bad-request', ...)
test.each([{}, { code: 7 }, { code: '' }, { code: 'a', refresh: 'b' }, 'not json'])('a body of %j is 422 bad-request', ...)
test('a missing id or secret is 500 not-set-up, and GitHub is never asked', ...)
test('GitHub down, or answering with something that is not JSON, is 503 busy', ...)
test('the secret is in no response body and no thrown message', ...)

// who.test.ts
test('a token this App made gives the login and id', ...)          // Basic auth header is base64('id:secret'); body { access_token }
test('a token GitHub does not know for this App is signed-out', ...)   // 404
test('GitHub down is busy, never signed-out', ...)                 // so a blip does not throw a person out
test('an empty token is signed-out and GitHub is never asked', ...)
```

  `headers.test.ts` reads `public/_headers` and expects, for `/*`: `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: no-referrer` (so the sign-in code never leaves in a Referer), and a `Content-Security-Policy`
  with `default-src 'self'`, `script-src 'self' 'wasm-unsafe-eval'`, `connect-src 'self'` (the page never talks to
  GitHub), `img-src 'self' data:`, `frame-ancestors 'none'`.
- [ ] **Step 2: Push; `check` fails** on the missing modules.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Push; all jobs pass.**
- [ ] **Step 5: Commit** (`feat(exchange): the sign-in step, and who a token belongs to`).

### Task 5: GitHub, as the App

**Files:**
- Create: `src/lib/base64.ts`, `src/features/github/github.ts`, `app-token.ts`, `request.ts`, `repo.ts`
- Test: `tests/lib/base64.test.ts`, `tests/features/github/app-token.test.ts`,
  `tests/features/github/request.test.ts`, `tests/features/github/repo.test.ts`

**Interfaces:**
- Consumes: `ExchangeEnv`, `Answer`, `ProblemKind`, `GameRef`, `Checks` (Task 4).
- Produces:

```ts
// src/lib/base64.ts: UTF-8 text to and from base64. `fromBase64` ignores the line breaks GitHub puts in.
export function toBase64(text: string): string
export function fromBase64(base64: string): string

// github.ts
export interface AppEnv extends ExchangeEnv {
  readonly GITHUB_APP_ID?: string
  readonly GITHUB_APP_PRIVATE_KEY?: string    // the .pem GitHub gives, pasted whole (PKCS#1), or a PKCS#8 one
}
export interface Deps { readonly env: AppEnv; readonly fetcher: typeof fetch; readonly now: () => number } // now: ms

// app-token.ts
/** The App's own short-lived pass: a JWT signed RS256 with WebCrypto. iss the App id, iat now - 60 s, exp now + 9 min. */
export function appJwt(appId: string, privateKeyPem: string, nowMs: number): Promise<string>

// repo.ts
export interface RepoFacts { readonly branch: string; readonly isPublic: boolean; readonly ownerLogin: string } // branch: the default one
export interface FileRead { readonly path: string; readonly text: string; readonly version: string } // version: GitHub's blob sha
export interface Pull {
  readonly number: number; readonly title: string
  readonly head: string; readonly headCommit: string; readonly headIsHere: boolean  // false for a pull from a fork
  readonly base: string; readonly createdAt: number                                // ms
}
export interface Author { readonly name: string; readonly email: string }

export interface Repo {
  readonly facts: RepoFacts
  branchHead(branch: string): Promise<Answer<string>>               // 'not-found' if no such branch
  createBranch(branch: string, fromCommit: string): Promise<Answer<true>>
  deleteBranch(branch: string): Promise<Answer<true>>
  readFile(branch: string, path: string): Promise<Answer<FileRead>>
  /** `version` undefined makes a new file. A version that is no longer the file's is 'changed-elsewhere'. */
  saveFile(save: { branch: string; path: string; text: string; version: string | undefined; message: string; author: Author }): Promise<Answer<{ version: string; commit: string }>>
  openPulls(): Promise<Answer<readonly Pull[]>>                     // open, into the default branch
  pull(number: number): Promise<Answer<Pull>>                       // 'not-found' if closed, merged or unknown
  pullPaths(number: number): Promise<Answer<readonly string[]>>     // every path it changes, old names included
  createPull(p: { branch: string; title: string; body: string }): Promise<Answer<Pull>>
  mergePull(number: number, m: { title: string; message: string; headCommit: string }): Promise<Answer<true>>
  closePull(number: number): Promise<Answer<true>>
  checks(commit: string): Promise<Answer<Checks>>
}
/** The App's hands in one repo. 'not-found' when the editor has not been added to that repo. */
export function openRepo(deps: Deps, ref: GameRef): Promise<Answer<Repo>>
export function userExists(deps: Deps, login: string): Promise<Answer<boolean>>
/** The repos this *person* can see on GitHub that the editor has been added to: asked with the person's own token. */
export function reposOf(deps: Deps, personToken: string): Promise<Answer<readonly GameRef[]>>
```

The calls. `openRepo` uses the App's JWT for the first two, then the installation's token for the rest; every call
carries `Accept: application/vnd.github+json` and `X-GitHub-Api-Version: 2022-11-28`:

| Method | Call |
|---|---|
| `openRepo` | `GET /repos/{owner}/{name}/installation` (JWT): the installation's `id`; 404 is `not-found`. Then `POST /app/installations/{id}/access_tokens` (JWT): `token`. Then `GET /repos/{owner}/{name}`: `default_branch`, `private`, `owner.login` |
| `branchHead` | `GET /repos/{owner}/{name}/git/ref/heads/{branch}`: `object.sha` |
| `createBranch` | `POST /repos/{owner}/{name}/git/refs` with `{ ref: 'refs/heads/{branch}', sha }` |
| `deleteBranch` | `DELETE /repos/{owner}/{name}/git/refs/heads/{branch}` |
| `readFile` | `GET /repos/{owner}/{name}/contents/{path}?ref={branch}`: `text` is the decoded `content`, `version` is `sha` |
| `saveFile` | `PUT /repos/{owner}/{name}/contents/{path}` with `{ message, content: toBase64(text), sha: version, branch, author, committer: author }` |
| `openPulls` | `GET /repos/{owner}/{name}/pulls?state=open&base={default}&per_page=100` |
| `pull` | `GET /repos/{owner}/{name}/pulls/{number}`: `headIsHere` is `head.repo.full_name === base.repo.full_name`; a `state` that is not `open` is `not-found` |
| `pullPaths` | `GET /repos/{owner}/{name}/pulls/{number}/files?per_page=100`: each `filename`, and `previous_filename` where there is one; a hundred or more is `not-allowed` (too big to judge) |
| `createPull` | `POST /repos/{owner}/{name}/pulls` with `{ title, body, head: branch, base: default }` |
| `mergePull` | `PUT /repos/{owner}/{name}/pulls/{number}/merge` with `{ merge_method: 'merge', commit_title, commit_message, sha: headCommit }`, so a pull that changed since it was judged is not merged |
| `closePull` | `PATCH /repos/{owner}/{name}/pulls/{number}` with `{ state: 'closed' }` |
| `checks` | `GET /repos/{owner}/{name}/commits/{commit}/check-runs?per_page=100`: none is `none`; any not `completed` is `running`; else any `conclusion` other than `success`, `neutral` or `skipped` is `failing`; else `passing` |
| `userExists` | `GET /users/{login}` (JWT): 200 true, 404 false |
| `reposOf` | `GET /user/installations`, then for each `GET /user/installations/{id}/repositories?per_page=100`, with the person's token; first page of each in M1 |

`request.ts` is the one place a call is made and an answer becomes a problem: the request throws, or 5xx, `busy`;
401, `not-set-up` for the App's own tokens (its key is wrong) and `signed-out` for a person's; 404, `not-found`;
429, or 403 with `x-ratelimit-remaining: 0` or a `retry-after` header, `busy`; any other 403, `blocked`; anything
else unexpected, `unknown`. Three calls are settled by looking, not by reading GitHub's message. **A 409 or 422 on
`saveFile`:** read the file again on that branch; if its version is no longer the one sent, `changed-elsewhere`; if
it is the same, the branch refused the App, `blocked`. **A 405 or 409 on `mergePull`:** `clashes`. **A 422 on
`createBranch`** (it already exists): `changed-elsewhere`.

- [ ] **Step 1: Check each row above against GitHub's REST documentation** (see "Before starting"). Report any that
  differ before going on.
- [ ] **Step 2: Write the failing tests.** `base64.test.ts`: `fromBase64(toBase64(t)) === t` for `'crate'`,
  `'상자 📦'` and `''`; `fromBase64('Y3Jh\ndGU=\n') === 'crate'`. `app-token.test.ts`, with a key pair made in the
  test by WebCrypto and exported as PEM both ways: the JWT has three parts, header `{ alg: 'RS256', typ: 'JWT' }`,
  payload `iss`, `iat` and `exp` as above, and its signature verifies with the public key, for a PKCS#8 key and for
  the same key as PKCS#1 (the form GitHub hands out); a key that is not a key throws an error that does not contain
  the key's text. `request.test.ts`: the two headers; each line of the problem rules, one test each.
  `repo.test.ts`, with a made-up `fetcher`: each row of the table (method, URL, which token, body, and the value
  returned); the installation token is asked for once per `openRepo`, not once per call; a path or branch with a
  space, `#` or `/` in it is encoded segment by segment (`automata/grandma` keeps its slash in a ref path); the
  three "settled by looking" cases; `checks` for each of its four answers; no token and no key appears in any
  returned value or thrown message.
- [ ] **Step 3: Push; `check` fails** on the missing modules.
- [ ] **Step 4: Implement.** A PKCS#1 key is wrapped into PKCS#8 by putting the fixed RSA header in front of it, so
  whoever sets the site up pastes the key exactly as GitHub gave it.
- [ ] **Step 5: Push; all jobs pass.**
- [ ] **Step 6: Commit** (`feat(github): GitHub, as the App`).

### Task 6: The pretend GitHub

**Files:**
- Create: `tests/fixtures/game/automata.toml`, `tests/fixtures/game/content/levels/level-1.json`,
  `tests/fixtures/game/content/characters/hero.json`, `tests/fixtures/game/content/characters/crate.json`,
  `tests/fixtures/fake-github/server.ts`, `repos.ts`, `keys.ts`
- Test: `tests/fixtures/fake-github/server.test.ts`, `tests/fixtures/game.test.ts`

**Interfaces:**
- Produces:

```ts
// keys.ts
/** A fresh RSA key pair, made now. `privatePem` is PKCS#1, as GitHub hands a key out. */
export function makeKeys(): Promise<{ readonly privatePem: string; readonly publicKey: CryptoKey }>

// repos.ts
export interface FakeCommit { readonly sha: string; readonly branch: string; readonly message: string; readonly path: string; readonly text: string; readonly author: string }
export interface FakePull { readonly number: number; readonly title: string; readonly head: string; readonly base: string; state: 'open' | 'merged' | 'closed' }
export interface FakeRepo {
  readonly owner: string; readonly name: string; readonly defaultBranch: string
  isPublic: boolean
  installed: boolean                                   // has the editor been added to this repo?
  rule: 'none' | 'app-bypasses' | 'blocks-app'         // the branch rule on the default branch
  checks: 'passing' | 'running' | 'failing' | 'none'   // what every commit's checks say
  readonly branches: Map<string, Map<string, string>>  // branch -> path -> text
  readonly commits: FakeCommit[]
  readonly pulls: FakePull[]
  /** As when someone else changes the game: writes a file on a branch without going through the API. */
  put(branch: string, path: string, text: string): void
}
export function gameRepo(name: string): FakeRepo      // tests/fixtures/game on 'main', owned by 'grandma', public, installed
export function notAGameRepo(name: string): FakeRepo  // a README.md and nothing else

// server.ts
export const PEOPLE = ['grandma', 'grandpa', 'kid', 'stranger'] as const
export interface FakeGitHub {
  readonly url: string
  readonly env: AppEnv                       // what the real API code needs to reach this server: ids, secret, key, the two URLs
  readonly repos: Map<string, FakeRepo>      // by 'owner/name'
  person: (typeof PEOPLE)[number]            // who is at the keyboard: who the next sign-in is
  signIn: 'allow' | 'deny'
  /** A sign-in token for that person, as if they had signed in. */
  tokenFor(person: (typeof PEOPLE)[number]): string
  tokensRunOut(): void                       // every sign-in token stops working; a refresh gives a new one
  signedOutEverywhere(): void                // tokens and refreshes all stop working
  down: boolean                              // true: every call is dropped
  readonly log: readonly { readonly method: string; readonly path: string }[]   // every request it was sent, oldest first; emptied by reset()
  clock: number                              // ms; the time on new commits and pulls
  reset(): void                              // back to: grandma, allow, up, repos = crate-game and not-a-game
  close(): Promise<void>
}
export function startFakeGitHub(port: number, site: string): Promise<FakeGitHub>
```

What it answers, each as GitHub's REST documentation describes the real call. "App" means a call carrying a JWT that
verifies with the test's public key and is not expired; "installation" means a token it issued to the App;
"person" means a sign-in token it issued.

| Call | Answer |
|---|---|
| `GET /login/oauth/authorize` | `allow`: 302 to `redirect_uri` with a fresh `code` for `person` and the same `state`. `deny`: 302 with `error=access_denied` and the `state` |
| `POST /login/oauth/access_token` | Checks the client id and secret, then a code or refresh token it issued (each works once): `{ access_token, refresh_token }`. Otherwise 200 `{ error: 'bad_verification_code' }` or `{ error: 'bad_refresh_token' }` |
| `POST /applications/{client_id}/token` | Basic auth with the id and secret: the person a working sign-in token belongs to; 404 otherwise |
| `GET /apps/{slug}/installations/new` | Marks every repo `person` owns as `installed`, then 302 to the site with `?setup_action=install&installation_id=1` |
| `GET /user/installations`, `GET /user/installations/1/repositories` (person) | The `installed` repos that person owns |
| `GET /repos/{o}/{n}/installation`, `POST /app/installations/1/access_tokens` (App) | The installation and a token; 404 when the repo is not `installed`; 401 for a JWT that does not verify |
| `GET /users/{login}` (App) | 200 for one of `PEOPLE`, 404 otherwise |
| `GET /repos/{o}/{n}` (installation) | `default_branch`, `private`, `owner.login` |
| `GET`, `POST`, `DELETE` on `git/ref(s)` (installation) | As in Task 5's table; 422 for a branch that already exists or does not |
| `GET /repos/{o}/{n}/contents/*?ref=` (installation) | `{ content, encoding: 'base64', sha }`, with a line break every 60 characters as GitHub does; 404 for a missing file or branch |
| `PUT /repos/{o}/{n}/contents/*` (installation) | A `sha` that is not the file's on that branch (or a `sha` for a file that is not there, or none for one that is): 409. On the default branch with `rule` `blocks-app`: 409. Else a new commit on that branch, with the author sent |
| `GET /pulls`, `GET /pulls/{n}`, `GET /pulls/{n}/files`, `POST /pulls`, `PATCH /pulls/{n}` (installation) | As in Task 5's table; `POST` is 422 if that branch already has an open pull or has nothing new |
| `PUT /pulls/{n}/merge` (installation) | 409 when `sha` is not the head, or with `rule` `blocks-app`; 405 when a file changed on both the branch and the default branch since the branch was made; else the branch's files become the default branch's, one more commit, the pull is `merged` |
| `GET /commits/{sha}/check-runs` (installation) | One run that matches the repo's `checks` (none for `none`) |
| Everything | 401 for a token of the wrong kind or one that no longer works. No CORS headers: only the API calls GitHub |

A file's `sha` is git's blob sha (SHA-1 of `blob <bytes>\0<content>`), so it changes exactly when the bytes do.

- [ ] **Step 1: Write the failing tests.** `game.test.ts`: `loadGame` over `tests/fixtures/game` is `ok`, and each
  content file's bytes equal `writeContent(type, parsed)`. The level is 16 by 9, a floor on the bottom row and a
  wall at each side, `crate-1` at `{ x: 6.5, y: 7.5 }`, player 1 at `{ x: 2.5, y: 7.5 }`, as the Examples repo's
  game has it. `server.test.ts` starts the server on a spare port and drives it with `fetch` and Task 5's `appJwt`:
  one test per row of the table, plus: a JWT signed with some other key is 401; a person's token is refused where an
  installation's is wanted, and the other way round; a second PUT with the first PUT's old sha is 409; with `rule`
  `app-bypasses` a PUT to `main` works and with `blocks-app` it is 409 and `main` is unchanged; a merge of a pull
  whose file also changed on `main` is 405 and changes nothing; after `tokensRunOut()` the old token fails and a
  refresh gives one that works; `reset()` puts the crate back. And one test that runs Task 5's real `openRepo` and
  each `Repo` method against it, so the two halves are known to agree.
- [ ] **Step 2: Push; `check` fails** on the missing modules.
- [ ] **Step 3: Implement** with `node:http` and `node:crypto` only.
- [ ] **Step 4: Push; all jobs pass.**
- [ ] **Step 5: Commit** (`test: a pretend GitHub`).

### Task 7: The API: who is asking, and opening a game

**Files:**
- Create: `functions/api/[[path]].ts`, `src/features/service/service.ts`, `enter.ts`, `games.ts`, `open.ts`,
  `tests/fixtures/api.ts`, `tests/workflows/bundle.test.ts`
- Modify: `src/features/wire/wire.ts`
- Test: `tests/features/service/service.test.ts`, `enter.test.ts`, `open.test.ts`

**Interfaces:**
- Consumes: Tasks 3 to 6; the framework's `parseProject`, `PROJECT_FILE`.
- Produces:

```ts
// wire.ts, added
export interface WireFile { readonly path: string; readonly text: string; readonly version: string }
export interface Waiting { readonly number: number; readonly title: string; readonly by: string; readonly mine: boolean; readonly checks: Checks }
export interface OpenAnswer {
  readonly game: GameRef
  readonly login: string | undefined           // who the API says you are; undefined for a visitor
  readonly level: AccessLevel                  // what the API says you may do
  readonly branch: string                      // where these files were read from
  readonly mine: Waiting | undefined           // your own waiting change, if you have one
  readonly waiting: number                     // how many changes wait in all
  readonly files: readonly WireFile[]          // automata.toml and every file it lists
}

// service.ts
/** Every /api request. Routes by method and path, and never throws: anything unexpected is 500 unknown, with nothing of it in the body. */
export function handleApi(request: Request, env: AppEnv, deps?: Partial<Deps>): Promise<Response>

// enter.ts: the door every route but /api/token goes through
export interface Entered { readonly who: Who | undefined; readonly token: string | undefined; readonly repo: Repo; readonly access: AccessFile; readonly accessVersion: string | undefined; readonly level: AccessLevel }
export function suggestionBranch(login: string): string    // 'automata/' + the login in lower case
/** Who is asking (from the Bearer token), the repo, the sharing file from the default branch, and their level. Refuses unless they may do `action`. */
export function enter(deps: Deps, request: Request, game: GameRef, action: Action, opts?: { visitors: boolean }): Promise<Answer<Entered>>
/** What someone who has not signed in may do: 'look' at a public game whose `everyone` is not 'nothing'; otherwise 'nothing'. */
export function visitorLevel(repo: Repo, access: AccessFile): 'nothing' | 'look'

// tests/fixtures/api.ts
export interface TestApi {
  readonly fake: FakeGitHub
  /** Calls the real handleApi as `person`, from the site's own origin. */
  call<T>(person: (typeof PEOPLE)[number] | 'visitor', method: 'GET' | 'POST', path: string, body?: unknown): Promise<{ status: number; answer: Answer<T> }>   // 'visitor' sends no token
  close(): Promise<void>
}
export function startTestApi(): Promise<TestApi>
```

  `functions/api/[[path]].ts` is
  `export const onRequest = (context: { request: Request; env: AppEnv }) => handleApi(context.request, context.env)`.

The routes so far (Tasks 8 to 10 add the rest):

| Route | Does | Needs |
|---|---|---|
| `POST /api/token` | `handleTokenRequest` (Task 4) | nothing |
| `GET /api/games` | `reposOf` with the person's token: the games they own that have the editor | signed in |
| `GET /api/game?owner=&name=` | Opens the game: `OpenAnswer` | `look`, or a visitor (the only route that passes `visitors: true`) |

The rules of the door, in order: not `sameOrigin`, `not-allowed`; no `Authorization` header at all, `signed-out`
unless the route takes visitors, in which case there is no `who` and the level below is `visitorLevel` instead of
`levelOf` (a header that is there but empty or wrong is always `signed-out`, so a sign-in that ran out is renewed
and not quietly turned into a visit); `whoIs`;
`owner` and `name` that are not `[A-Za-z0-9._-]{1,100}`, `bad-request`; `openRepo` (`not-found` when the editor has
not been added); the sharing file read from the default branch (`defaultAccess` when there is none, `CLOSED` when it
will not parse); `levelOf`; if the level is `nothing`, `not-found` (a private game's existence is not given away);
if they may not do `action`, `not-allowed`.

Opening: a visitor always gets the default branch, `mine` undefined and `waiting` 0 (how busy a team is, is the
team's business). Otherwise, if the person has an open pull whose head is `suggestionBranch(login)`, the files are read from that
branch, so they see their own waiting change; otherwise from the default branch. `automata.toml` missing is
`not-a-game`; one that will not parse is still sent (the page shows the framework's sentences). Every file it lists
is read; one that is missing is left out (the page's `loadGame` then names it). `waiting` counts the open pulls
whose head starts `automata/` and is in this repo.

- [ ] **Step 1: Write the failing tests,** all through `startTestApi()` (the real code, the pretend GitHub):

```ts
// enter.test.ts
test('a call from another origin is refused before GitHub is asked anything', ...)
test('an empty token, a made-up token, and a token from before signedOutEverywhere() are all signed-out, on every route', ...)
test('with no token, every route but GET /api/game is signed-out, and GitHub is asked nothing', ...)
test('a real GitHub token that this App did not make is signed-out', ...)       // Review Focus 1
test('the level comes from the sharing file on main, never from the request', ...)
  // kid calls /api/game?owner=grandma&name=crate-game&level=owner with header x-level: owner -> level is 'look'
test('a sharing file on a suggestion branch changes nobody\'s level', ...)       // put it on automata/kid: kid is still 'look'
test('a broken sharing file lets only the repo owner in', ...)                   // grandma: owner; grandpa: 404 not-found
test('a private game with no sharing file is not-found for a stranger, and open for its owner', ...)
test('a game the editor was never added to is not-found', ...)
test('names with a slash or a space are bad-request', ...)
test('GitHub down is busy', ...)

// open.test.ts
test('a visitor opens a public game: look, no login, from main, the same files grandma gets', ...)
test('a visitor gets look even where everyone = "suggest"', ...)
test('a visitor sees none of kid\'s waiting change: main\'s files, mine undefined, waiting 0', ...)
test('a visitor is told not-found for a private game, for everyone = "nothing", for a broken sharing file, and for a game with no editor', ...)
test('grandma opens her game: owner, from main, with automata.toml and its three files', ...)
test('each file\'s text and version are GitHub\'s', ...)
test('kid has a change waiting: the files come from automata/kid, and mine names it', ...)
test('grandpa sees the same game from main, and waiting is 1', ...)
test('a repo with no automata.toml is not-a-game', ...)
test('a level file that is not JSON is still sent, as it is', ...)
test('/api/games lists what the person owns that has the editor, and nothing else', ...)

// service.test.ts
test('an unknown route is 404 not-found; a wrong method is 422 bad-request', ...)
test('every answer is JSON with cache-control: no-store', ...)
test('a thrown error inside a route is 500 unknown and its message is not in the body', ...)
test('no answer, for any route and any person, contains a token, the secret or the key', ...)
```

  `bundle.test.ts` (Node) bundles `functions/api/[[path]].ts` with Vite's `build` API (one ES module, minified,
  nothing external) into a temp folder and expects the result to be under 1 000 000 bytes and to contain neither
  `rapier` nor `pixi`: Cloudflare limits a Function's size, and the framework's physics and renderer must not ride
  along with `parseContent`.
- [ ] **Step 2: Push; `check` fails** on the missing modules.
- [ ] **Step 3: Implement.** If `bundle.test.ts` fails because the framework's headless entry does not shake down,
  stop and report: the fix is in the framework (a smaller entry for content only), not a workaround here.
- [ ] **Step 4: Push; all jobs pass.**
- [ ] **Step 5: Commit** (`feat(service): the API's door, and opening a game`).

### Task 8: The API: Save

**Files:**
- Create: `src/features/service/save.ts`
- Modify: `src/features/wire/wire.ts`, `src/features/service/service.ts`
- Test: `tests/features/service/save.test.ts`

**Interfaces:**
- Consumes: `enter`, `suggestionBranch`, `Entered` (Task 7); `Repo` (Task 5); the framework's `writeContent`,
  `parseProject`.
- Produces:

```ts
// wire.ts, added
export interface SaveAsk {
  readonly game: GameRef
  readonly path: string           // which content file
  readonly value: unknown         // the level, as data; the API writes the bytes
  readonly version: string        // the version the person opened
  readonly message: string        // what changed, in a few words
}
export interface SaveAnswer {
  readonly how: 'direct' | 'suggestion'
  readonly version: string        // the file's new version
  readonly mine: Waiting | undefined
}
```

  Route: `POST /api/save` with a `SaveAsk`, gives `SaveAnswer`. Needs `save`.

What Save does, in order. Nothing is written before step 4.

1. **The file must be a level of this game.** `path` must be listed as `type = "level"` in the `automata.toml` on
   the default branch; anything else is `not-allowed`. (M1 edits levels only; `automata.toml`, the sharing file and
   every other path are refused here.)
2. **The value must be a good level.** `writeContent('level', value)`; if it throws, `broken`, with its sentences as
   `details`. The value's `id` must be the file's name, or `broken`.
3. **The message** is cut to one line of at most 72 characters; empty becomes `Change <path>`.
4. **Where it goes.**
   - The person has a change waiting (an open pull from `suggestionBranch(login)`): the commit goes on that branch.
   - Otherwise, a person who may `save-direct`: the commit goes on the default branch.
   - Otherwise: if `suggestionBranch(login)` exists (left over from an approved, turned-down or half-made
     suggestion), delete it; create it from the default branch's newest commit; the commit goes there.
5. **The commit:** `saveFile` with the bytes from step 2, the `version` sent, the message, and the person as author
   (`name` their login, `email` `<id>+<login>@users.noreply.github.com`), so the game's history says who did it.
6. **The suggestion:** on a suggestion branch with no open pull, `createPull` with the message as title and
   `Made with Automata Editors by <login>.` as body.

Because step 4 branches from the default branch as it is *now* and step 5 sends the version the person *opened*, a
level changed in between is `changed-elsewhere`, and nothing of the person's is written over it. If step 6 fails,
the answer is that problem; the next Save finds the branch with no pull, starts it again from the default branch
and sends the change again, so there is never a second commit or a branch left behind for good.

- [ ] **Step 1: Write the failing tests,** through `startTestApi()`. `moved` is the fixture level with `crate-1` at
  `{ x: 8.5, y: 7.5 }`; `ask` is `{ game, path: 'content/levels/level-1.json', value: moved, version, message: 'Move crate-1 in level-1' }`:

```ts
test('kid (suggest) saves: one commit on automata/kid, one pull into main, main untouched', async () => {
  const { answer } = await api.call('kid', 'POST', '/api/save', ask)
  expect(answer).toMatchObject({ ok: true, value: { how: 'suggestion', mine: { number: 1, by: 'kid', mine: true } } })
  expect(repo.commits).toEqual([expect.objectContaining({
    branch: 'automata/kid', path: 'content/levels/level-1.json', message: 'Move crate-1 in level-1', author: 'kid' })])
  expect(repo.commits[0].text).toBe(writeContent('level', moved))        // byte for byte
  expect(repo.pulls).toEqual([{ number: 1, title: 'Move crate-1 in level-1', head: 'automata/kid', base: 'main', state: 'open' }])
  expect(repo.branches.get('main')).toEqual(fixtureFiles)
})
test('kid saves again: a second commit on the same branch, still one pull', ...)
test('grandma (owner) and an edit-level person save: one commit on main, no branch, no pull, how is direct', ...)
test('an edit-level person with a change already waiting adds to it instead', ...)
test('grandpa (approve) saves: a suggestion, like kid', ...)
test('a look-level person and a stranger are refused, and nothing is written', ...)
test('the bytes written are the framework\'s, whatever order the keys came in', ...)      // send value with keys shuffled
test.each([
  ['automata.toml'], ['automata.access.toml'], ['content/characters/crate.json'], ['.github/workflows/ci.yml'],
  ['content/levels/../../automata.access.toml'], ['content/levels/new-level.json'],
])('saving to %s is not-allowed and nothing is written', ...)                              // Review Focus 1
test('a level with a thing outside the map is broken, with the framework\'s sentence, and nothing is written', ...)
test('a level whose id is not the file\'s name is broken', ...)
test('the level changed on main since it was opened: changed-elsewhere, no pull, their file untouched', ...)   // Review Focus 2
test('my other device saved to my suggestion first: changed-elsewhere', ...)
test('a branch left from an approved suggestion is started again from main', ...)
test('the pull could not be made (GitHub drops that one call): the next save makes one commit and one pull, not two', ...)
test('a branch rule that blocks the App on main: an owner\'s save is blocked, and nothing is written', ...)     // rule = 'blocks-app'
test('a message of 300 characters with line breaks becomes one line of 72', ...)
test('a body that is not a SaveAsk is bad-request', ...)
```

- [ ] **Step 2: Push; `check` fails.**
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Push; all jobs pass.**
- [ ] **Step 5: Commit** (`feat(service): Save, straight in or as a suggestion, by level`).

**A visitor at these routes.** Tasks 8, 9 and 10 each add one test to their own file: with no token, every route
the task adds answers `signed-out`, the pretend GitHub's log shows no request, and no repo changed.

### Task 9: The API: waiting changes, approve and turn down

**Files:**
- Create: `src/features/service/waiting.ts`, `approve.ts`
- Modify: `src/features/wire/wire.ts`, `src/features/service/service.ts`
- Test: `tests/features/service/waiting.test.ts`, `approve.test.ts`

**Interfaces:**
- Consumes: `enter`, `suggestionBranch` (Task 7); `Repo`, `Pull`, `Checks` (Task 5); the framework's `parseContent`,
  `parseProject`.
- Produces:

```ts
// wire.ts, added
export interface WaitingChange extends Waiting {
  /** Each content file it changes, as it is in the game now and as it would be. */
  readonly changes: readonly { readonly path: string; readonly before: string | undefined; readonly after: string | undefined }[]
  /** Can it be approved in the editor at all? 'no' when it touches anything but this game's content files. */
  readonly here: boolean
}
export interface ChangeAsk { readonly game: GameRef; readonly number: number }
```

| Route | Does | Needs |
|---|---|---|
| `GET /api/waiting?owner=&name=` | Every waiting change: `Waiting[]`, oldest first | `look` |
| `GET /api/change?owner=&name=&number=` | One, with what it changes: `WaitingChange` | `look` |
| `POST /api/approve` with a `ChangeAsk` | Puts the change into the game | `approve` |
| `POST /api/turn-down` with a `ChangeAsk` | Closes it and deletes its branch | `approve`, or it is your own |

A **waiting change** is an open pull into the default branch whose head starts `automata/` and is in this repo
(`headIsHere`). Its `by` is the rest of the head's name. Other pulls (an agent's, a person's own on GitHub) are not
the editor's business: they are not listed, and asking for one by number is `not-found`.

Approve checks, in order, and changes nothing unless all pass:

1. It is a waiting change (else `not-found`).
2. Every path it changes is a content file listed in the `automata.toml` on the default branch. Anything else, the
   sharing file and `automata.toml` above all, is `not-allowed` (Review Focus 1). `here` is this check, told ahead.
3. It is not the person's own, unless they may `save-direct` (else `own-change`).
4. Every changed content file, as it is on the head, passes `parseContent` (else `broken`, with the sentences).
5. The head commit's checks: `failing` is `checks-failed`; `running` is `not-ready`; `none` is `not-ready` while the
   pull is younger than two minutes (checks may not have started) and counts as passing after that, so a game with
   no checks can still be approved.
6. `mergePull` with the head commit seen in step 5, title `Approve: <title>`, message `Approved by <login>.`. A
   clash is `clashes`. Then the branch is deleted (a failure to delete is not a failure to approve).

- [ ] **Step 1: Write the failing tests,** through `startTestApi()`, each starting from "kid has saved a change"
  with `repo.checks = 'passing'`:

```ts
test('grandpa sees one waiting change: by kid, not mine, checks passing', ...)
test('kid sees it too, as mine', ...)
test('the change shows the level before and after', ...)                 // before: main's bytes; after: kid's
test('grandpa approves: main has kid\'s level, the pull is merged, the branch is gone, the merge names grandpa', ...)
test('after approval kid opens the game from main, with nothing waiting', ...)
test('kid cannot approve at all (not-allowed); grandpa cannot approve his own (own-change)', ...)
test('grandma and an edit-level person can approve their own', ...)
test('checks running: not-ready, and main is untouched; checks failing: checks-failed', ...)   // Review Focus 3
test('no checks at all: not-ready for the first two minutes, approved after', ...)             // fake.clock
test('a change that also edits automata.access.toml: here is false, approve is not-allowed, nothing merges', ...)
test('the same for automata.toml, for a workflow file, and for a file renamed out of content/', ...)
test('a change whose level is broken on its branch is broken, with the sentence', ...)
test('main changed the same file since: clashes, and nothing merges', ...)
test('the head moved between looking and merging: nothing merges', ...)  // a commit lands after step 5
test('a pull that is not an automata/ branch is not-found, to list, to open and to approve', ...)
test('a pull from a fork named automata/kid is not-found', ...)
test('grandpa turns kid\'s change down: closed, branch gone, main untouched', ...)
test('kid takes their own change back; a look-level person cannot turn anything down', ...)
test('a branch rule that blocks the App: approve is blocked', ...)
```

- [ ] **Step 2: Push; `check` fails.**
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Push; all jobs pass.**
- [ ] **Step 5: Commit** (`feat(service): waiting changes, approve and turn down`).

### Task 10: The API: sharing

**Files:**
- Create: `src/features/service/people.ts`
- Modify: `src/features/wire/wire.ts`, `src/features/service/service.ts`
- Test: `tests/features/service/people.test.ts`

**Interfaces:**
- Consumes: `enter` (Task 7); `AccessFile`, `parseAccess`, `writeAccess`, `ACCESS_FILE` (Task 3); `userExists`,
  `Repo` (Task 5).
- Produces:

```ts
// wire.ts, added
export interface SharingAnswer {
  readonly access: AccessFile
  readonly version: string | undefined     // undefined: the game has no sharing file yet
  readonly owner: string                   // the account that owns the game: always an Owner, never in the list
  readonly broken: boolean                 // the file on the game is unreadable; saving this screen mends it
}
export interface SharingAsk { readonly game: GameRef; readonly access: AccessFile; readonly version: string | undefined }
```

| Route | Does | Needs |
|---|---|---|
| `GET /api/sharing?owner=&name=` | The sharing file as it is: `SharingAnswer` | `share` |
| `POST /api/sharing` with a `SharingAsk` | Writes it: `SharingAnswer` | `share` |

Writing: the list must pass `AccessSchema` (`bad-request`, with the sentences); the repo's owner, if listed, is
taken out (they are always an Owner); every *new* name is checked with `userExists`, and names GitHub does not know
are `not-found` with those names as `details`; then one commit on the default branch, `writeAccess` bytes, the
`version` sent, message `Change who can help with this game`, the Owner as author. A list equal to the one already
there writes nothing.

- [ ] **Step 1: Write the failing tests,** through `startTestApi()`:

```ts
test('grandma reads the sharing of a game with no file: everyone look, nobody listed, version undefined', ...)
test('grandma adds grandpa as approve: one commit on main, the plan\'s example file byte for byte', ...)
test('from then on grandpa\'s level is approve', ...)                          // GET /api/game as grandpa
test('grandma sets everyone to suggest: kid can now save', ...)
test('grandma sets everyone to nothing: stranger now gets not-found', ...)
test('grandma lowers grandpa to look: his next save is refused', ...)
test('grandma removes grandpa: he is back to what everyone gets', ...)
test('a second Owner (listed as owner) can change the list too', ...)
test('anyone below owner is refused, to read and to write, and nothing is written', ...)   // edit-level included
test('listing the repo owner is quietly dropped; she is still Owner', ...)
test('a name GitHub does not know is not-found, names it, and nothing is written', ...)
test('a list that breaks the rules (a level "god", everyone "owner", 101 people) is bad-request', ...)
test('two Owners at once: the second write is changed-elsewhere, and the first stands', ...)
test('saving the same list again makes no commit', ...)
test('a broken file on main reads as broken with an empty list, and saving mends it', ...)
test('a branch rule that blocks the App: blocked', ...)
```

- [ ] **Step 2: Push; `check` fails.**
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Push; all jobs pass.**
- [ ] **Step 5: Commit** (`feat(service): sharing a game`).

### Task 11: The page signs in

**Files:**
- Create: `src/features/api/api.ts`, `src/features/session/session.ts`, `src/features/suite/suite.ts`, `route.ts`,
  `App.svelte`, `Welcome.svelte`, `tests/fixtures/serve.ts`, `tests/fixtures/journey.ts`,
  `tests/journeys/global-setup.ts`, `.env.journeys`; fill `src/index.ts`, `src/main.ts`, `index.html`
- Test: `tests/features/api/api.test.ts`, `tests/features/session/session.test.ts`,
  `tests/features/suite/route.test.ts`, `tests/journeys/sign-in.journey.test.ts`

**Interfaces:**
- Consumes: everything in `wire` (Tasks 4, 7 to 10); `WORDS`, `Button`, `Screen`, `Notice` (Task 2).
- Produces:

```ts
// api.ts: the page's only way out. Every method is one /api call.
export interface Auth { token(): string | undefined; renew(): Promise<boolean> }
export interface Api {
  games(): Promise<Answer<readonly GameRef[]>>
  open(game: GameRef): Promise<Answer<OpenAnswer>>
  save(ask: SaveAsk): Promise<Answer<SaveAnswer>>
  waiting(game: GameRef): Promise<Answer<readonly Waiting[]>>
  change(ask: ChangeAsk): Promise<Answer<WaitingChange>>
  approve(ask: ChangeAsk): Promise<Answer<true>>
  turnDown(ask: ChangeAsk): Promise<Answer<true>>
  sharing(game: GameRef): Promise<Answer<SharingAnswer>>
  share(ask: SharingAsk): Promise<Answer<SharingAnswer>>
}
export function createApi(auth: Auth, fetcher?: typeof fetch): Api
/** POST /api/token. Undefined when it fails for any reason. */
export function swapTokens(ask: { code: string } | { refresh: string }, fetcher?: typeof fetch): Promise<Tokens | undefined>

// session.ts
export type SignInResult = 'nothing-to-do' | 'signed-in' | 'cancelled' | 'failed'
export interface SessionConfig { readonly webUrl: string; readonly clientId: string; readonly appSlug: string }
export interface Session extends Auth {
  /** Remembers where the person was, then sends the browser to GitHub's sign-in page. */
  begin(returnTo: string): void
  /** Call once at start-up with the page's URL. Finishes a sign-in that GitHub sent back, and cleans the URL. */
  finish(url: URL): Promise<{ result: SignInResult; returnTo: string }>
  signOut(): void
}
export function signInUrl(config: SessionConfig, opts: { redirectUri: string; state: string }): string  // {webUrl}/login/oauth/authorize, no scope
export function addToGameUrl(config: SessionConfig): string     // {webUrl}/apps/{appSlug}/installations/new
export function createSession(deps: {
  config: SessionConfig; origin: string
  kept: Storage      // localStorage: the Tokens as JSON, under 'af.tokens'
  brief: Storage     // sessionStorage: 'af.signin.state' and 'af.signin.return'
  go: (url: string) => void                      // location.assign
  clean: () => void                              // history.replaceState, dropping the query
  swap: typeof swapTokens
  random: () => string                           // 32 hex characters from crypto.getRandomValues
}): Session

// route.ts: the screen is in the URL's hash, so a link opens a game, a level or a screen directly
export type Route =
  | { screen: 'games' }
  | { screen: 'game'; owner: string; name: string }
  | { screen: 'level'; owner: string; name: string; level: string }
  | { screen: 'waiting'; owner: string; name: string }
  | { screen: 'change'; owner: string; name: string; number: number }
  | { screen: 'share'; owner: string; name: string }
export function parseRoute(hash: string): Route          // anything unknown is { screen: 'games' }
export function routeHash(route: Route): string          // '#/', '#/game/o/n', '#/game/o/n/level/level-1', '#/game/o/n/waiting', '#/game/o/n/waiting/3', '#/game/o/n/share'

// src/index.ts
export interface SuiteConfig extends SessionConfig {}
export function mountSuite(target: HTMLElement, config: SuiteConfig): { destroy(): void }

// tests/fixtures/serve.ts: serves dist/, and hands every /api request to the real handleApi
export function startSite(port: number, env: AppEnv): Promise<{ readonly url: string; close(): Promise<void> }>

// tests/fixtures/journey.ts
export const SIZES = { ipadUpright: { width: 820, height: 1180 }, ipadSideways: { width: 1180, height: 820 },
  phone: { width: 390, height: 844 } } as const
/** A fresh browser, nothing remembered, the pretend GitHub reset, `person` at the keyboard. */
export function openPage(size: keyof typeof SIZES, person?: (typeof PEOPLE)[number]): Promise<{ page: Page; fake: FakeGitHub; close(): Promise<void> }>
export function signIn(page: Page): Promise<void>
export function dragByTouch(page: Page, thing: string, by: { dx: number; dy: number }): Promise<void>   // from Task 14
export function picture(page: Page, name: string): Promise<void>        // tests/journeys/__screenshots__/<name>.png
```

  `createApi`: every call carries `Authorization: Bearer <token>`. With no token, `open` is sent with no such
  header (a visit) and every other method answers `signed-out` with nothing sent. A `signed-out` answer makes it call `auth.renew()` once and, if that says yes, make the call once
  more. A request that throws is `offline`. An answer that is not the `Answer` shape is `unknown`.

  `Session.renew()` swaps the kept `refresh` for new Tokens and says whether it worked; with no `refresh`, or a
  refusal, it forgets the tokens and says no. Two calls to `renew()` at once make one swap. A return from GitHub
  that carries `setup_action` and no `state` (an Owner has just added the editor to a game) is never swapped: the
  URL is cleaned and the result is `nothing-to-do`.

  `main.ts` builds the config from `import.meta.env`: `VITE_GITHUB_CLIENT_ID`, `VITE_GITHUB_APP_SLUG`, and
  `VITE_GITHUB_WEB_URL` (default `https://github.com`). The redirect address is the origin plus `/`.
  `.env.journeys` (read by `vite build --mode journeys`): `VITE_GITHUB_CLIENT_ID=journey-client`,
  `VITE_GITHUB_APP_SLUG=journey-editor`, `VITE_GITHUB_WEB_URL=http://127.0.0.1:4801`. Ports: the site on 4800, the
  pretend GitHub on 4801. `global-setup.ts` starts both (the site with `fake.env`) and stops them at the end; the
  browser is `process.env.ENGINE` (default `chromium`), from the `playwright` package, with `hasTouch: true`.

Screen: **Welcome.** `appName` as the title, `welcomeLine`, one primary Button `signIn`, and under it `signInWhy`.
With no client id: `signInNotReady` as a problem Notice and the Button disabled. After `cancelled` or `failed`: that
Notice above the Button. Signed in, every screen's top bar has a plain `signOut` Button; not signed in, the same
spot has a plain `signIn` Button, which calls `begin` with the screen the person is on, so they come back to it.
(Task 18 adds the "try it" Button to Welcome.)

**Which screens ask for sign-in.** A visitor is shown Welcome only for the routes that need a person: `games`,
`waiting`, `change` and `share`. The `game` and `level` routes open for a visitor without a word about signing in.

- [ ] **Step 1: Write the failing tests.** `api.test.ts`, with a made-up `fetcher`: each method's verb, path, query
  or body, and the Bearer header; with no token `open` is sent with no `Authorization` header and every other method is `signed-out` with nothing
  sent; a `signed-out` answer then a
  `renew()` that says yes makes the call again with the new token, and a second `signed-out` is final (no third
  call); a throw is `offline`; HTML where JSON was expected is `unknown`. `session.test.ts`: `begin` stores a fresh
  state and the return hash, then calls `go` with `signInUrl` carrying that state and no `scope`; `finish` with no
  `code` is `nothing-to-do`; with the stored state and a code it calls `swap` with `{ code }`, keeps the tokens,
  clears the two brief keys, calls `clean`, and returns `signed-in` with the remembered `returnTo`; with a different
  state it is `failed` and `swap` is never called; with `error=access_denied` it is `cancelled`; when `swap` gives
  `undefined` it is `failed` and nothing is kept; `renew` with a kept refresh calls `swap` with `{ refresh }`, keeps
  the new tokens and says yes; refused, it forgets everything and says no; two `renew()` calls at once call `swap`
  once; `?code=x&setup_action=install` with no state is `nothing-to-do`, `swap` is never called and `clean` is;
  `signOut` forgets the tokens; a `Storage` that throws (private mode) makes `token()` undefined, never an
  exception. `route.test.ts`: each route round-trips; names with `.` and `-`; `''`, `'#/nope'` and a half-written
  hash are `games`; a part that is not `[A-Za-z0-9._-]+`, or a change number that is not a whole number above
  zero, is `games`. `sign-in.journey.test.ts`: at iPad upright, Welcome shows its pieces and the Button is at least
  48 px tall; pressing it ends on the "Pick a game" title with a clean URL (no `code`); a reload stays signed in;
  `signOut` returns to Welcome and a reload stays there; with `fake.signIn = 'deny'` the person lands on Welcome
  reading `signInCancelled`; opening `#/game/grandma/crate-game` signed out shows no Welcome and asks for nothing,
  and pressing the top bar's `signIn` there comes back to that game, not to the list; opening
  `#/game/grandma/crate-game/share` signed out shows Welcome, and signing in lands on Share; after `fake.tokensRunOut()` a reload still shows "Pick a game" (renewed without the person
  noticing); during the whole journey the page made no request to any address but its own origin and the sign-in
  page (the journey records every request).
- [ ] **Step 2: Push; `check` and the journeys fail.**
- [ ] **Step 3: Implement.** `App.svelte` shows Welcome when there is no token and the route needs a person, and
  otherwise the screen for the route; until Task 12 the `games` and `game` screens are only their titles.
- [ ] **Step 4: Push; all jobs pass.**
- [ ] **Step 5: Commit** (`feat(session): the page signs in, and talks only to its own API`).

### Task 12: Opening a game

**Files:**
- Create: `src/features/game/game.ts`, `open.ts`, `recent.ts`, `src/features/suite/PickGame.svelte`,
  `AddEditor.svelte`, `GameHome.svelte`
- Test: `tests/features/game/open.test.ts`, `tests/features/game/recent.test.ts`,
  `tests/journeys/open-game.journey.test.ts`

**Interfaces:**
- Consumes: `Api`, `OpenAnswer`, `Waiting`, `ProblemKind` (Task 11, `wire`); `AccessLevel`, `can` (Task 3);
  `addToGameUrl` (Task 11); the framework's `loadGame`, `GameContent`, `Diagnostic`, `formatDiagnostic`.
- Produces:

```ts
// open.ts
export interface OpenGame {
  readonly ref: GameRef
  readonly login: string | undefined                    // undefined: a visitor
  readonly level: AccessLevel
  readonly mine: Waiting | undefined                    // my own waiting change
  readonly waiting: number                              // how many changes wait in all
  readonly content: GameContent
  readonly files: ReadonlyMap<string, WireFile>         // by path
}
export type Opened =
  | { readonly ok: true; readonly game: OpenGame }
  | { readonly ok: false; readonly problem: 'broken'; readonly diagnostics: readonly Diagnostic[] }
  | { readonly ok: false; readonly problem: ProblemKind }
export function openGame(api: Api, ref: GameRef): Promise<Opened>
/** The path of the level file whose id is `levelId`, from the project's content list. */
export function levelPath(game: OpenGame, levelId: string): string | undefined

// recent.ts: games this device has opened, so someone who was sent a link finds the game again
export function recentGames(store: Storage): readonly GameRef[]          // newest first, at most 20; localStorage 'af.recent'
export function rememberGame(store: Storage, ref: GameRef): void
export function forgetGame(store: Storage, ref: GameRef): void
```

  `openGame` calls `api.open`, then gives the framework's `loadGame` a reader over the files that came back;
  `loadGame` failing is `broken` with its diagnostics. A game that opens is remembered; one that answers `not-found`
  is forgotten.

More words, exactly:

| Key | Words |
|---|---|
| `pickTitle` | Pick a game |
| `pickFind` | Find a game by name |
| `pickNoMatch` | No game has that name. |
| `pickEmpty` | You don't have a game here yet. |
| `pickEmptyLink` | If someone shared a game with you, open the link they sent. |
| `pickAdd` | Add the editor to a game of mine |
| `loading` | Getting your game… |
| `notAGame` | This isn't an Automata game. Pick another one. |
| `brokenGame` | This game has problems that need fixing first: |
| `cantFindGame` | We can't find that game, or it hasn't been shared with you. Ask its owner. |
| `cantFindVisitor` | We can't find that game. If someone shared it with you, sign in to open it. |
| `visitorCan` | Try anything you like. To save your changes into the game, sign in. |
| `cantReach` | Can't reach the game right now. Check the internet and try again. |
| `tryAgain` | Try again |
| `gameLevels` | Levels |
| `gameMoreSoon` | More editors are coming. For now you can change levels. |
| `youAre(level)` | look: "You can look at this game." suggest: "You can change this game. Someone will approve your changes." approve: "You can change this game, and approve other people's changes." edit: "You can change this game. Your changes go straight in." owner: "This is your game. You can change it, and choose who helps." |
| `mineWaiting` | Your changes are waiting for approval. This is your version of the game. |
| `back` | Back |

Screens. **Pick a game:** title `pickTitle`; a text box labelled `pickFind` that filters as you type; one list of
the games `api.games()` gives and the remembered ones, without doubles, each a row at least 56 px tall showing its
name and, smaller, its owner; `pickNoMatch` when the filter leaves nothing; `loading` while asking; at the bottom
a plain Button `pickAdd`, to `addToGameUrl`. **No games** (`AddEditor.svelte`, in place of an empty list):
`pickEmpty`, `pickEmptyLink`, and one primary Button `pickAdd`. **The game's page:** the game's name
(`project.name`) as the title, Back to the list (for a visitor, Back goes to Welcome); `youAre(level)` as an info
Notice, or `visitorCan` for a visitor; `mineWaiting` as a second one
when the person has a change waiting; under `gameLevels`, one row per level, by id; then `gameMoreSoon`. (Tasks 16
and 17 add the waiting-changes row and the Share button.) For `not-a-game`: `notAGame`. For `not-found` and
`not-allowed`: `cantFindGame`; for a visitor `cantFindVisitor` with a primary `signIn` Button, which comes back to
this game. For `broken`: `brokenGame` and each `formatDiagnostic` line in a list. Each with a
Button back to the list. For `signed-out`: sign out and show Welcome with `signedOutAgain`. For `offline`, `busy`
and anything else: `cantReach` with a `tryAgain` Button that asks again.

- [ ] **Step 1: Write the failing tests.** `open.test.ts`, with a made-up `Api`: the fixture game opens with its
  level, `mine` and `waiting` passed through, and `files` by path; a level that is not JSON is `broken` with the
  framework's diagnostic for that file; each `ProblemKind` from `api.open` passes through; `levelPath(game,
  'level-1')` is `content/levels/level-1.json` and an unknown id is `undefined`. `recent.test.ts`: remembered games
  come back newest first, once each, at most 20; forgetting removes one; garbage in the store is an empty list; a
  `Storage` that throws never throws out. `open-game.journey.test.ts`, at iPad upright and phone, as `grandma`: the
  list shows `crate-game` and `not-a-game`, each row at least 56 px tall; typing `crate` leaves one row, typing
  `zzz` shows `pickNoMatch`; pressing `crate-game` shows "Crate Game", `youAre('owner')` and a `level-1` row;
  `not-a-game` shows `notAGame` and a way back; with the level file replaced by `{`, the page shows `brokenGame`
  and a line naming `content/levels/level-1.json`; after `fake.signedOutEverywhere()` the person is on Welcome
  reading `signedOutAgain`; `#/game/grandma/nope` shows `cantFindGame`; with `fake.down`, the game's page shows
  `cantReach`, and after `fake.down = false` pressing `tryAgain` shows the game. As `kid`, opening the link
  `#/game/grandma/crate-game`: the game opens with `youAre('look')`; back on the list, `crate-game` is there
  (remembered), and after a reload it still is. As `stranger` with the game made private: `cantFindGame`, and the
  list does not remember it. Not signed in, opening the link: the game opens with `visitorCan`, a `level-1` row and
  a `signIn` Button in the top bar, and the page asked for nothing. Not signed in, with the game made private:
  `cantFindVisitor`; pressing `signIn` as `grandma` comes back to the game, open, with `youAre('owner')`. As `grandma` with no repo `installed`: `pickEmpty` and the `pickAdd` Button.
- [ ] **Step 2: Push; `check` and the journeys fail.**
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Push; all jobs pass.**
- [ ] **Step 5: Commit** (`feat(game): pick a game and open it`).

### Task 13: Moving a thing, as plain functions

**Files:**
- Create: `src/features/levels/levels.ts`, `place.ts`, `edit.ts`
- Test: `tests/features/levels/place.test.ts`, `tests/features/levels/edit.test.ts`

**Interfaces:**
- Consumes: the framework's `Level`, `Character`, `Fit`, `levelSize`.
- Produces:

```ts
// place.ts: where a box may be
export const STEP = 0.5                                   // positions snap to half a tile, so files stay tidy
export interface Point { readonly x: number; readonly y: number }
export interface Size { readonly w: number; readonly h: number }
export function snap(value: number): number               // nearest multiple of STEP; halves round up
export function keepInside(level: Level, size: Size, at: Point): Point   // snap, then the whole box inside the level
export function onSolid(level: Level, size: Size, at: Point): boolean    // overlaps a '#' tile; touching an edge is not overlapping
export function toScreen(fit: Fit, at: Point): Point       // tiles to CSS pixels inside the stage
export function toWorld(fit: Fit, px: Point): Point        // and back; { x: 0, y: 0 } when fit.scale is 0

// edit.ts: the edit a person is in the middle of
export interface LevelEdit { readonly opened: Level; readonly now: Level; readonly past: readonly Level[] }
export type Moved = { readonly edit: LevelEdit; readonly moved: true } | { readonly edit: LevelEdit; readonly moved: false; readonly why: 'solid' | 'same' | 'no-such-thing' }
export type Characters = Readonly<Record<string, Character>>
export function startEdit(level: Level): LevelEdit
export function moveThing(edit: LevelEdit, characters: Characters, thingId: string, to: Point): Moved
export function nudgeThing(edit: LevelEdit, characters: Characters, thingId: string, way: 'left' | 'right' | 'up' | 'down'): Moved
export function undo(edit: LevelEdit): LevelEdit          // no past: the same edit back
export function isDirty(edit: LevelEdit): boolean         // now differs from opened, by value
export function describeChange(edit: LevelEdit): string   // the commit message
```

  `moveThing` puts the thing at `keepInside(...)` of `to`; if that spot is `onSolid`, nothing moves (`why: 'solid'`);
  if it is where the thing already is, `why: 'same'`. A move that happens pushes the old level onto `past`. A nudge is
  a move by one `STEP`. `describeChange`: one thing moved, `Move crate-1 in level-1`; several, `Move 3 things in
  level-1`; none, `''`. Moving a thing away and back leaves the edit not dirty.

- [ ] **Step 1: Write the failing tests,** on the fixture level (16 by 9, floor on row 8, walls in columns 0 and 15,
  the crate 1 by 1 at 6.5, 7.5):

```ts
test.each([[6.74, 6.5], [6.75, 7], [-0.2, 0], [8.5, 8.5]])('snap(%f) is %f', (v, want) => expect(snap(v)).toBe(want))
test('a box dragged past the right edge stops with its side on the edge', () =>
  expect(keepInside(level, { w: 1, h: 1 }, { x: 40, y: 3.5 })).toEqual({ x: 15.5, y: 3.5 }))
test('a box dragged above the top stops at the top', () =>
  expect(keepInside(level, { w: 1, h: 1 }, { x: 4.5, y: -9 })).toEqual({ x: 4.5, y: 0.5 }))
test('standing on the floor is not inside it', () => expect(onSolid(level, { w: 1, h: 1 }, { x: 6.5, y: 7.5 })).toBe(false))
test('half a tile lower is', () => expect(onSolid(level, { w: 1, h: 1 }, { x: 6.5, y: 8 })).toBe(true))
test('toWorld undoes toScreen', ...)                      // fit { scale: 48, left: 26, top: 100 }
test('a stage with no size gives the origin, not NaN', ...)

test('dragging the crate two tiles right', () => {
  const m = moveThing(startEdit(level), characters, 'crate-1', { x: 8.6, y: 7.4 })
  expect(m.moved).toBe(true)
  expect(m.edit.now.things[0]).toEqual({ id: 'crate-1', character: 'crate', x: 8.5, y: 7.5 })
  expect(m.edit.opened).toBe(level)                       // the opened level is never changed
  expect(describeChange(m.edit)).toBe('Move crate-1 in level-1')
})
test('dropping it in the wall leaves it where it was, and says solid', ...)   // to { x: 15.5, y: 7.5 }
test('a move to the same spot changes nothing and adds no undo step', ...)
test('an id that is not in the level is no-such-thing', ...)
test('four nudges right move two tiles', ...)
test('a nudge into the floor says solid', ...)            // 'down' from 6.5, 7.5
test('undo steps back one move at a time, and stops at the opened level', ...)
test('moved away and back is not dirty, and describes nothing', ...)
test('the edited level still passes the framework: writeContent does not throw', ...)
```

- [ ] **Step 2: Push; `check` fails** on the missing modules.
- [ ] **Step 3: Implement.** A thing's size is its character's `size`. Compare with a tolerance of `1e-9` in
  `onSolid`, so a box resting exactly on the floor is not "inside" it.
- [ ] **Step 4: Push; all jobs pass.**
- [ ] **Step 5: Commit** (`feat(levels): moving a thing, snapped, kept inside and off solid ground`).

### Task 14: The Levels editor on the screen

**Files:**
- Create: `src/features/levels/level-canvas.ts`, `src/features/levels/Levels.svelte`
- Test: `tests/features/levels/level-canvas.browser.test.ts`, `tests/features/levels/levels.browser.test.ts`

**Interfaces:**
- Consumes: Task 13; `WORDS`, `Button`, `Notice`; the framework's `fitWorld`, `tileRuns`, `levelSize`, `SKY_COLOR`,
  `TILE_COLOR`.
- Produces:

```ts
// level-canvas.ts: the picture of a level, drawn with Pixi. It only draws; it knows nothing of fingers.
export interface LevelCanvas {
  readonly canvas: HTMLCanvasElement
  show(level: Level, characters: Characters, selected?: string): void
  resize(w: number, h: number): void       // CSS pixels; a size not above zero is ignored; the last picture is redrawn
  destroy(): void                          // safe to call twice
}
export function createLevelCanvas(): Promise<LevelCanvas>

// Levels.svelte props
interface LevelsProps {
  level: Level
  characters: Characters
  canSave: boolean
  status: 'clean' | 'dirty' | 'saving' | 'saved'       // owned by the screen that saves (Task 15)
  onchange: (edit: LevelEdit) => void                  // after every move and undo
  statusText: string                                   // the words for `status`, from the screen that saves
  onsave: () => void
}
```

What is on the screen, top to bottom: a top bar with Back, the level's id as the title, and the primary `save`
Button (disabled when `status` is `clean` or `saving`, or `canSave` is false); a status line (a `statusText: string` prop from the screen that saves, in a `role="status"` region); **the stage**, which fills the rest; and
under it a bar with the hint (`hintIdle`, or `hintSelected(id)`), and, when a thing is selected, four arrow Buttons
(`moveLeft`, `moveRight`, `moveUp`, `moveDown`) and `undo`. Sideways, the bar sits to the right of the stage instead
of under it (by the container's shape, not the device).

The stage is a `position: relative` box with `touch-action: none`, holding the canvas and, over it, one
`<button class="thing">` per thing in the level: `data-thing` (its id), `data-x`, `data-y` (its place, in tiles),
`aria-label` `thingLabel(id)`, `aria-pressed` when selected. The button is centred on the thing, as large as the
thing on screen but never smaller than 48 by 48 px, and see-through: the canvas draws the picture, the button takes
the finger. The stage carries `data-scale` (pixels per tile), so a test or an agent can work out where things are.
The canvas draws the sky, the solid tiles, each thing as its character's coloured box with the framework's dark edge
(`0x1b1b24`), the selected one with a thick white ring, and each start point as the hero's box at half strength, so
a person sees where the hero begins. Start points do not move in M1 and have no button.

How a finger works: `pointerdown` on a thing selects it and captures the pointer. Moving more than 6 px starts a
drag; from then on every `pointermove` calls `moveThing` with the finger's place in tiles, and the picture follows.
`pointerup` ends it. `pointercancel`, or a second pointer going down, puts the thing back where the drag began and
drops that drag's undo steps. A whole drag is one undo step. If the drag ends with the finger over solid ground, the
thing stays at the last free spot and `solid` shows as an info Notice until the next action. A tap (no drag) only
selects. Tapping the stage where no thing is unselects. With a thing's button focused, the arrow keys nudge it and
Escape unselects. When the stage changes size (the iPad is turned), a drag in progress is cancelled the same way and
everything refits.

- [ ] **Step 1: Write the failing tests.** `level-canvas.browser.test.ts`: after `resize(480, 270)` and `show`, a
  pixel in an empty tile is the sky colour, one in the floor is the tile colour, the crate's centre is `#c9a227`
  (read with `drawImage` onto a 2D canvas, as the framework's render test does); `resize(0, 0)` then `show` throws
  nothing; `destroy()` twice throws nothing. `levels.browser.test.ts` mounts `Levels` in an 820 by 1180 box with the
  fixture level, and sends real `PointerEvent`s with `pointerType: 'touch'`:

```ts
test('the crate has a button a finger can hit', ...)          // at least 48 by 48, centred within 1 px of the crate's centre
test('a tap selects and shows the arrows; nothing moved', ...) // aria-pressed, hintSelected('crate-1'), onchange not called
test('dragging two tiles right moves it two tiles', ...)       // data-x '8.5', data-y '7.5'; onchange's edit is dirty
test('a whole drag is one undo step', ...)                     // Undo once: data-x '6.5'
test('a cancelled touch puts the crate back', ...)             // pointercancel mid-drag: data-x '6.5', edit not dirty
test('a second finger cancels the drag', ...)
test('dragging far off the stage keeps the crate inside the walls', ...)   // data-x '14.5'
test('dragging down into the floor leaves it on the floor and says why', ...) // data-y '7.5', WORDS.solid shown
test('each arrow button moves half a tile; so does each arrow key', ...)
test('Save is off until something changed, and off while saving', ...)
test('with canSave false, Save stays off after a move', ...)
test('turning the box sideways refits: the button is still on the crate', ...) // resize the box to 1180 by 820
test('turning mid-drag cancels the drag', ...)
test('at 390 by 844 every button is at least 44 px and nothing runs off the side', ...)
```

- [ ] **Step 2: Push; the engines fail** on the missing modules.
- [ ] **Step 3: Implement.** `level-canvas.ts` follows the framework's `src/features/render/stage.ts` at the pinned
  commit for starting Pixi (the no-eval entry first, the texture worker probe off, resolution from
  `devicePixelRatio`), and uses `fitWorld` for the fit so the level sits exactly as it does in the game.
  `Levels.svelte` keeps the `LevelEdit` in a `$state`, watches the stage with a `ResizeObserver`, and positions the
  buttons with `toScreen`.
- [ ] **Step 4: Push; all jobs pass in all three engines.** Write `dragByTouch` for `tests/fixtures/journey.ts` (Task 11 made the file): it
  reads the button's box and the stage's `data-scale`, then dispatches `pointerdown`, five `pointermove`s and
  `pointerup` with `pointerType: 'touch'` in the page.
- [ ] **Step 5: Commit** (`feat(levels): drag a thing by touch, by buttons and by keys`).

### Task 15: Save, on the screen

**Files:**
- Create: `src/features/game/save.ts`, `src/features/game/draft.ts`, `src/features/suite/LevelScreen.svelte`
- Test: `tests/features/game/save.test.ts`, `tests/features/game/draft.test.ts`,
  `tests/journeys/move-the-crate.journey.test.ts`, `tests/journeys/save-problems.journey.test.ts`

**Interfaces:**
- Consumes: `OpenGame`, `Opened`, `levelPath`, `openGame` (Task 12); `Api`, `SaveAnswer` (Task 11); `can` (Task 3);
  `LevelEdit`, `describeChange`, `isDirty` (Task 13); `Levels` (Task 14); the framework's `parseContent`.
- Produces:

```ts
// save.ts
export type SaveResult =
  | { readonly ok: true; readonly how: 'direct' | 'suggestion'; readonly game: OpenGame }  // game holds the new level, version and `mine`
  | { readonly ok: false; readonly problem: ProblemKind; readonly details?: readonly string[] }
export function saveLevel(api: Api, game: OpenGame, level: Level, message: string): Promise<SaveResult>

// draft.ts: the unsaved change, kept on the device so a reload or a new sign-in does not lose it
export function keepDraft(store: Storage, game: OpenGame, level: Level): void   // key 'af.draft:<owner>/<name>:<path>'
export function takeDraft(store: Storage, game: OpenGame, levelId: string): { level: Level } | 'changed' | undefined
export function dropDraft(store: Storage, game: OpenGame, levelId: string): void
```

  `saveLevel` sends `api.save` the level as data, its path, the version the file was opened at and the message; the
  API writes the bytes. A draft stores the level and the version it was made against; `takeDraft` returns it only if
  that version is still the file's version and the stored level passes `parseContent`; otherwise it drops it and
  returns `'changed'` (or `undefined` for none, or for one that will not parse). `sessionStorage` is the store.

More words, exactly:

| Key | Words |
|---|---|
| `statusClean` | Nothing to save. |
| `statusDirty` | You have changes that aren't saved. |
| `statusSaving` | Saving… |
| `savedDirect` | Saved. Your game has the change. |
| `savedSuggestion` | Saved. Your change is waiting for approval. |
| `lookOnly` | You can look and try things, but you can't save changes to this game. Ask its owner to let you. |
| `signInToSave` | Sign in to save this into the game. Your change will still be here when you come back. |
| `changedElsewhere` | Someone changed this level while you were working, so your change wasn't saved. |
| `takeTheirs` | Show their version (drop my change) |
| `keepMine` | Keep my change for now |
| `offline` | Can't reach the game right now. Your change is still here. Check the internet and press Save again. |
| `busy` | Things are busy. Your change is still here. Wait a minute and press Save again. |
| `saveFailed` | Something went wrong and your change wasn't saved. Press Save again. |
| `blockedOwner` | GitHub is set to stop the editor changing this game. The game's owner needs to let Automata Editors past that rule. |
| `leaveAsk` | You have changes that aren't saved. Leave anyway? |
| `leaveYes` / `leaveNo` | Leave without saving / Stay |
| `draftBack` | We brought back the change you hadn't saved. |
| `draftDropped` | This level changed while you were away, so your unsaved change was dropped. |

**The level screen** (`#/game/<owner>/<name>/level/<id>`) opens the game, takes a draft if there is one (`draftBack`
as a good Notice, or `draftDropped` as an info Notice), and shows `Levels` with `canSave` as `can(level, 'save')`,
or as true for a visitor (whose Save asks them to sign in).
Its rules:

| When | What the person sees | What happens |
|---|---|---|
| Opened at `look`, signed in | `lookOnly`; things can be moved to try, Save never lights | The draft is kept, so a reload does not undo their trying |
| Opened by a visitor | `visitorCan`; things can be moved, and Save lights like anyone's | The draft is kept |
| Save pressed by a visitor | `signInToSave` as an info Notice with a primary `signIn` Button; Save stays lit | Nothing is sent. `signIn` calls `begin` with this level. Back from GitHub, the level opens with `draftBack` and the person's real level; Save then does what that level allows (`lookOnly` if it allows nothing) |
| Opened with my change waiting | `mineWaiting` | The level shown is my own version |
| A move | `statusDirty`; Save lights up | The draft is kept |
| Save pressed | `statusSaving`; Save off | One `saveLevel`. A second press while saving does nothing |
| Saved, `direct` | `savedDirect` | The draft is dropped; the edit starts again from the saved level |
| Saved, `suggestion` | `savedSuggestion`, then `mineWaiting` | The same |
| `changed-elsewhere` | `changedElsewhere` as a problem Notice with two Buttons: `takeTheirs`, `keepMine` | Nothing was written. `takeTheirs` opens the game again and drops the draft. `keepMine` closes the Notice; Save stays lit and will say the same again |
| `not-allowed` (my level was lowered) | `lookOnly` | Save goes off; the change stays on screen |
| `broken` | `saveFailed`, and the API's sentences in a list | The change stays |
| `blocked` | `blockedOwner` | The change stays |
| `offline` / `busy` / anything else | `offline` / `busy` / `saveFailed` | The change stays; Save is lit again |
| `signed-out` | Welcome, with `signedOutAgain` | The draft is kept; after signing in the person is back on this level with `draftBack` |
| Back, with unsaved changes | `leaveAsk` with `leaveNo` (primary) and `leaveYes` | `leaveYes` drops the draft and leaves |
| Closing the tab with unsaved changes | The browser's own "leave?" prompt | `beforeunload` |
| An unknown level id | `cantFindGame`, and Back | |

- [ ] **Step 1: Write the failing tests.** `save.test.ts`, with a made-up `Api`: the ask is the path
  `content/levels/level-1.json`, the level as data, the opened version and the message; on success the returned
  game's `files`, `content.levels['level-1']` and `mine` are the new ones and every other file is untouched; each
  problem passes through with its details; a level whose id is not in the project is `unknown` and nothing is sent.
  `draft.test.ts`: kept then taken gives the level back; taken against a game whose file has a new version is
  `'changed'` and the key is gone; garbage in the store is `undefined` and the key is gone; a `Storage` that throws
  never throws out of these three functions.
  `move-the-crate.journey.test.ts`, **the milestone's journey**, at iPad upright, iPad sideways and phone:

```ts
test('the owner drags the crate and saves: it is in the game, written as the framework writes it', async () => {
  // as grandma
  await signIn(page)
  await page.getByRole('button', { name: 'crate-game' }).click()
  await page.getByRole('button', { name: 'level-1' }).click()
  await dragByTouch(page, 'crate-1', { dx: 2, dy: 0 })
  await expect(status).toHaveText(WORDS.statusDirty)
  await page.getByRole('button', { name: 'Save' }).tap()
  await expect(status).toHaveText(WORDS.savedDirect)

  const repo = fake.repos.get('grandma/crate-game')
  expect(repo.commits).toEqual([expect.objectContaining({
    branch: 'main', path: 'content/levels/level-1.json', message: 'Move crate-1 in level-1', author: 'grandma' })])
  const moved = { ...fixtureLevel, things: [{ id: 'crate-1', character: 'crate', x: 8.5, y: 7.5 }] }
  expect(repo.commits[0].text).toBe(writeContent('level', moved))            // byte for byte
  expect([...repo.branches.get('main').keys()].sort()).toEqual(fixturePaths) // no file added
  expect((await loadGame(readFrom(repo, 'main'))).ok).toBe(true)             // the game still loads
  expect(repo.pulls).toEqual([])

  await page.reload()
  await expect(crate).toHaveAttribute('data-x', '8.5')                       // what was saved is what opens
})
test('someone who may only suggest does the same: it waits for approval, and main is untouched', ...)
  // as kid, with everyone = "suggest": savedSuggestion; one commit on automata/kid; one open pull; main === fixtureFiles;
  // reload: data-x '8.5' and WORDS.mineWaiting
test('a second change by kid adds to the same waiting change', ...)          // 2 commits, 1 pull
test('the same, moving with the arrow buttons instead of a finger', ...)
test('the same, with the keyboard only, from the welcome screen to Saved', ...)
test('pressing Save twice quickly makes one commit', ...)
test('the whole journey made no request to any address but the page\'s own', ...)
```

  (The journeys use Vitest's `expect.poll` for the waits; the lines above are short for it.)
  `save-problems.journey.test.ts`, at iPad upright:

```ts
test('someone changed the level first: nothing of mine is written over theirs, and the screen says so', ...)
  // repo.put('main', level path, another level) after opening; Save shows changedElsewhere; main still holds theirs
test('"Show their version" shows their crate and clears the unsaved change', ...)
test('"Keep my change for now" keeps my crate where I put it, and Save says the same again', ...)
test('offline: the offline words; back online, Save works and makes one commit', ...)        // fake.down
test('the token ran out mid-edit: Save still works, and the person never sees a sign-in screen', ...)   // tokensRunOut()
test('signed out everywhere: sign in again and my unsaved crate is where I left it', ...)
test('a reload with an unsaved change brings it back, and says so', ...)
test('a reload after someone else changed the level drops my change, and says so', ...)
test('Back with an unsaved change asks first; Stay stays; Leave without saving leaves', ...)
test('someone who may only look can try a move, never sees Save light up, and nothing is written', ...)   // as kid, everyone = "look"
test('a visitor moves the crate and presses Save: asked to sign in, and the API was never asked to save', ...)
test('the visitor signs in as grandma: back on the level, the crate is where they put it, and Save puts it in the game', ...)   // one commit on main, by grandma
test('the visitor signs in as kid (everyone = "suggest"): the same, and it waits for approval', ...)
test('the visitor signs in as stranger (everyone = "look"): the crate is still where they put it, and Save says lookOnly', ...)
test('the visitor cancels on GitHub: back on the level, the crate still where they put it, signInCancelled', ...)
test('my level was lowered while I worked: Save says lookOnly and my crate stays on screen', ...)
test('a rule on GitHub blocks the editor: blockedOwner, and my crate stays on screen', ...)  // rule = 'blocks-app'
```

- [ ] **Step 2: Push; `check` and the journeys fail.**
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Push; all jobs pass in all three engines.**
- [ ] **Step 5: Commit** (`feat(game): Save on the screen, and never over someone else's change`).

### Task 16: Waiting changes: look, approve, turn down

**Files:**
- Create: `src/features/suite/Waiting.svelte`, `WaitingChange.svelte`, `src/features/levels/compare.ts`
- Modify: `GameHome.svelte`, `Levels.svelte` (a `readOnly` prop), `src/features/words/words.ts`
- Test: `tests/features/levels/compare.test.ts`, `tests/features/levels/levels.browser.test.ts` (the new cases),
  `tests/journeys/approve.journey.test.ts`

**Interfaces:**
- Consumes: `Api`, `Waiting`, `WaitingChange` (Task 11); `can` (Task 3); `Levels` (Task 14); the framework's
  `parseContent`.
- Produces:

```ts
// compare.ts
export interface ThingMove { readonly id: string; readonly from: Point; readonly to: Point }
/** What moved between two versions of a level. Things added or removed are not moves and are counted apart. */
export function compareLevels(before: Level, after: Level): { readonly moved: readonly ThingMove[]; readonly other: number }
```

  `Levels` gains `readOnly?: boolean`: nothing can be dragged, the arrows, Undo and Save are not shown, and
  `marked?: readonly string[]` rings those things. `describeChange` (Task 13) is rewritten on top of
  `compareLevels`, with its tests unchanged.

More words, exactly:

| Key | Words |
|---|---|
| `waitingRow(n)` | 1: "1 change is waiting" otherwise "*n* changes are waiting" |
| `waitingTitle` | Waiting changes |
| `waitingNone` | Nothing is waiting. |
| `waitingBy(name)` | From *name* |
| `waitingMine` | From you |
| `changeMoved(id)` | *id* was moved. The ring shows where it is now. |
| `changeOther` | This change does more than move things. |
| `approve` | Approve |
| `turnDown` | Turn it down |
| `takeBack` | Take my change back |
| `approved` | Approved. The change is in the game now. |
| `turnedDown` | Turned down. The game stays as it was. |
| `checksRunning` | This change is still being checked. Try again in a minute. |
| `checksFailed` | The checks found a problem with this change, so it can't be approved. |
| `ownChange` | Someone else has to approve your own change. |
| `clashes` | The game changed since this was made, so it doesn't fit any more. Turn it down and ask for it again. |
| `notHere` | This change touches more than the game's levels, so it can't be approved here. |
| `cantApprove` | You can look at this change, but you can't approve it. |

Screens. **The game's page** gains, above the levels, a row `waitingRow(n)` when `waiting` is above zero; it opens
the list. **Waiting changes** (`#/game/<o>/<n>/waiting`): title `waitingTitle`; one row per change, at least 56 px
tall: its title, and `waitingBy(by)` or `waitingMine`; `waitingNone` when empty. **One change**
(`#/game/<o>/<n>/waiting/<number>`): the title; who it is from; the level as it would be, in a read-only `Levels`
with the moved things ringed; one line per move (`changeMoved(id)`), and `changeOther` if `other` is above zero; then
the Buttons, by level and state:

| Who is looking | Buttons and words |
|---|---|
| May approve, not their own (or may edit) | `approve` (primary) and `turnDown` |
| The same, checks running or failing | `checksRunning` or `checksFailed` as a Notice; `approve` disabled; `turnDown` |
| The same, `here` false | `notHere`; no `approve`; `turnDown` |
| Approve level, their own | `ownChange`; `takeBack` |
| Suggest level, their own | `takeBack` |
| Anyone else | `cantApprove` |

After `approve`: `approved`, and back to the game's page, which now opens with the change in it. After `turnDown`
or `takeBack`: `turnedDown`. `clashes`, `not-ready`, `checks-failed`, `own-change` and `blocked` from the API show
their words (`blockedOwner` for the last) and change nothing on screen; any other problem follows Task 15's rules.

- [ ] **Step 1: Write the failing tests.** `compare.test.ts`: the crate moved gives one `ThingMove` with both
  points; nothing changed gives none; a thing added and one removed give `other` 2 and no moves; tiles changed
  gives `other` 1. The new `levels.browser.test.ts` cases: with `readOnly`, a drag moves nothing, no arrow, Undo or
  Save button exists, and the marked thing's button has `data-marked`. `approve.journey.test.ts`, at iPad upright
  and phone, each starting from "kid has saved a change" with checks passing and grandpa at `approve`:

```ts
test('grandpa opens the game, sees "1 change is waiting", opens it, and sees the crate ringed where kid put it', ...)
test('grandpa approves: Approved; the game now has kid\'s crate; nothing is waiting', async () => {
  ...
  expect(repo.branches.get('main').get(levelPath)).toBe(writeContent('level', moved))
  expect(repo.pulls[0].state).toBe('merged')
  expect(repo.branches.has('automata/kid')).toBe(false)
})
test('then kid opens the game and sees the crate there, with nothing "waiting"', ...)
test('grandpa turns it down instead: Turned down; the game is as it was; kid\'s next change starts fresh', ...)
test('while the checks run, Approve is off and the screen says why; when they pass, a reload lights it', ...)
test('failed checks: the words, Approve off, Turn it down still works', ...)
test('kid looks at their own change: no Approve, "Take my change back" works', ...)
test('grandpa cannot approve his own: the words say someone else must', ...)
test('grandma approves kid\'s change on a phone held upright: the Approve button is at least 48 px tall', ...)
test('a change that also edits the sharing file says it can\'t be approved here, and Approve is not there', ...)
test('the game changed underneath: Approve says it doesn\'t fit any more, and nothing changes', ...)
test('a person who may only look sees the list and the change, and no buttons that change anything', ...)
```

- [ ] **Step 2: Push; `check`, the engines and the journeys fail.**
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Push; all jobs pass in all three engines.**
- [ ] **Step 5: Commit** (`feat(suite): see waiting changes, approve them or turn them down`).

### Task 17: The Share screen

**Files:**
- Create: `src/features/suite/Share.svelte`, `src/features/ui/Choice.svelte`
- Modify: `GameHome.svelte`, `src/features/ui/ui.ts`, `src/features/words/words.ts`
- Test: `tests/features/ui/choice.browser.test.ts`, `tests/journeys/share.journey.test.ts`

**Interfaces:**
- Consumes: `Api`, `SharingAnswer`, `SharingAsk` (Task 11); `AccessFile`, `AccessSchema`, `LEVELS` (Task 3);
  `routeHash` (Task 11).
- Produces: `Choice`: props `label: string`, `options: readonly { value: string; label: string; hint?: string }[]`,
  `value: string`, `onchange: (value: string) => void`. A real radio group (`role="radiogroup"`, arrow keys move),
  each option a row at least 48 px tall showing its label and, under it, its hint.

More words, exactly:

| Key | Words |
|---|---|
| `share` | Share |
| `shareTitle(game)` | Share *game* |
| `shareLinkLabel` | Send this link to the people you want to help: |
| `copyLink` / `linkCopied` | Copy the link / Copied. |
| `everyoneLabel` | Anyone who opens the link and signs in: |
| `everyoneNothing` / `everyoneNothingHint` | Can't get in / Only the people below can open the game. |
| `levelLook` / `levelLookHint` | Look / Can see the game. |
| `levelSuggest` / `levelSuggestHint` | Suggest / Can change things. Someone has to approve the changes. |
| `levelApprove` / `levelApproveHint` | Approve / Can suggest changes and approve other people's. |
| `levelEdit` / `levelEditHint` | Edit / Changes go straight into the game. |
| `levelOwner` / `levelOwnerHint` | Owner / Can do everything, and choose who helps. |
| `peopleLabel` | People |
| `peopleOwner(name)` | *name* owns this game. |
| `peopleNone` | Nobody else has been added yet. |
| `addName` | Their GitHub name |
| `addNameHint` | It's the name they sign in to GitHub with. They don't need to do anything on GitHub. |
| `addPerson` | Add |
| `remove(name)` | Remove *name* |
| `nameUnknown(name)` | There's nobody on GitHub called *name*. Check the spelling. |
| `nameTwice(name)` | *name* is already on the list. |
| `nameBad` | That doesn't look like a GitHub name. |
| `saveSharing` | Save sharing |
| `sharingSaved` | Saved. The people on the list can use the link now. |
| `sharingChanged` | Someone else changed the sharing while you were here. Here is the newest list. |
| `sharingBroken` | The sharing list on this game was damaged. Check the list below and press Save to mend it. |
| `sharingDirty` | You have sharing changes that aren't saved. |

Screen. **The game's page** gains a plain `share` Button in its top bar, for an Owner only. **Share**
(`#/game/<o>/<n>/share`; anyone but an Owner who opens it lands on the game's page): title `shareTitle(name)`; the
link (the game's own address, `routeHash` on this origin) with `copyLink`, which copies it and shows `linkCopied`,
or selects the link's text where the clipboard is not allowed; a `Choice` labelled `everyoneLabel` with three
options (`everyoneNothing`, `levelLook`, `levelSuggest`, each with its hint); under `peopleLabel`,
`peopleOwner(owner)`, then one row per person: their name, a level picker (a native `<select>` with the five
levels, the chosen level's hint under it) and a `remove(name)` Button, or `peopleNone`; a row to add someone: a
text box `addName` with `addNameHint`, a level picker starting at `levelSuggest`, and `addPerson`; and at the bottom
`sharingDirty` when there is something to save, and the primary Button `saveSharing`. Adding checks the name's shape
(`nameBad`) and that it is not a double (`nameTwice`) at once; whether the person exists is checked on save
(`nameUnknown`, and nothing is saved). `changed-elsewhere` shows `sharingChanged` and loads the newest list.
`broken` from `api.sharing` shows `sharingBroken`. Leaving with unsaved changes asks `leaveAsk`.

- [ ] **Step 1: Write the failing tests.** `choice.browser.test.ts`: each option row is at least 48 px tall; tapping
  one calls `onchange` with its value; the arrow keys move the choice; exactly one is checked; the hints are shown.
  `share.journey.test.ts`, at iPad upright and phone:

```ts
test('the whole point: grandma shares, grandpa approves, kid suggests, and none of them opens GitHub', async () => {
  // grandma: Share, add grandpa as Approve, set "anyone" to Suggest, Save sharing, copy the link
  // kid (a new browser): opens the link, signs in, moves the crate, saves: "waiting for approval"
  // grandpa (a new browser): opens the link, signs in, sees 1 change waiting, approves it
  // grandma: reloads, and the crate is where kid put it
  expect(repo.branches.get('main').get('automata.access.toml')).toBe(writeAccess({
    format: 1, everyone: 'suggest', people: [{ github: 'grandpa', level: 'approve' }] }))
  expect(repo.branches.get('main').get(levelPath)).toBe(writeContent('level', moved))
  // and in all three browsers, every request went to the page's own origin or GitHub's sign-in page
})
test('only an Owner sees Share; anyone else who opens the Share address lands on the game\'s page', ...)
test('changing grandpa from Approve to Look, and saving: his next visit says he can look', ...)
test('removing grandpa, and saving: he gets what "anyone" gets', ...)
test('setting "anyone" to "Can\'t get in": a stranger with the link is told to ask the owner', ...)
test('a name with a typo: the screen names it, nothing is saved, and the rest of the list is still there', ...)
test('a name already on the list, and a name that cannot be a GitHub name, are caught before saving', ...)
test('two Owners at once: the second is shown the newest list and nothing is lost silently', ...)
test('a damaged sharing file: the screen says so, and saving mends it', ...)
test('leaving with unsaved sharing asks first', ...)
test('Copy the link puts the game\'s address on the clipboard', ...)       // Chromium only: the others cannot read the clipboard in a test
test('every level picker and every Remove is at least 44 px, on a phone too', ...)
```

- [ ] **Step 2: Push; the engines and the journeys fail.**
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Push; all jobs pass in all three engines.**
- [ ] **Step 5: Commit** (`feat(suite): share a game, and choose what each person may do`).

### Task 18: Try it without signing in, and keep a copy

A visitor has, so far, been able to open a game by its link and change it on the screen. This task gives them a
front door (a "try it" Button on Welcome, for a site that names a game to try) and something to walk away with (a
copy of the level, on their device), and proves the whole visit end to end.

**Files:**
- Create: `src/features/game/copy.ts`
- Modify: `src/features/words/words.ts`, `src/index.ts`, `src/main.ts`, `.env.journeys`, `Welcome.svelte`,
  `Levels.svelte`, `LevelScreen.svelte`
- Test: `tests/features/game/copy.test.ts`, `tests/features/levels/levels.browser.test.ts` (two more),
  `tests/journeys/visitor.journey.test.ts`

**Interfaces:**
- Consumes: `OpenGame`, `levelPath` (Task 12); `Levels` (Task 14); the level screen (Task 15); `Route`, `routeHash`
  (Task 11); the framework's `writeContent`.
- Produces:

```ts
// copy.ts: a level as a file a person can keep. The bytes are the framework's, so an agent can drop the file
// into the game and it is exactly what Save would have written.
export interface LevelCopy { readonly name: string; readonly text: string }   // name: the last part of the level's path, e.g. 'level-1.json'
export function levelCopy(game: OpenGame, level: Level): LevelCopy | undefined // text: writeContent('level', level); undefined for a level not in the project
/** Hands the copy to the browser as a download (a Blob, an <a download>, a click), and frees the Blob's address. */
export function keepCopy(doc: Document, copy: LevelCopy): void

// src/index.ts
export interface SuiteConfig extends SessionConfig { readonly sample: GameRef | undefined }   // the game "try it" opens

// Levels.svelte, one more prop
oncopy: () => void
```

  `main.ts` reads `VITE_SAMPLE_GAME` (`owner/name`; anything else, or nothing, is `undefined`). `.env.journeys` sets
  it to `grandma/crate-game`. The site that runs the editor chooses the game; nothing in `src/` names one.

More words, exactly:

| Key | Words |
|---|---|
| `tryIt` | Try it now |
| `tryItLine` | No account needed. Open the example game and change it. |
| `copyKeep` | Keep a copy |
| `copyKept` | A copy of this level is on your device. |

What changes on the screens:

- **Welcome, on a site with a sample game:** the primary Button is `tryIt`, with `tryItLine` under it; it goes to
  the sample game's page. Sign-in stays the `signIn` Button, now plain, with `signInWhy` under it
  (`sign-in.journey.test.ts`'s size line changes with it: `tryIt` at least 48 px, `signIn` at least 44). On a site with no
  sample game Welcome is as Task 11 left it. When Welcome is shown because a screen needs a person (Task 11), the
  primary Button is `signIn` and `tryIt` is plain: there is always exactly one primary.
- **The level screen:** a plain `copyKeep` Button in the bar under the stage, for everyone who can open the level,
  always on. Pressing it downloads the level as it is on the screen now, saved or not, and shows `copyKept` as a
  good Notice. It never asks for sign-in and never calls the API.

- [ ] **Step 1: Write the failing tests.** `copy.test.ts`: `levelCopy` for the fixture game with the crate moved is
  named `level-1.json` and its text equals `writeContent('level', moved)`, byte for byte; a level whose id is not in
  the project is `undefined`; `keepCopy`, given a made-up document, makes one link whose `download` is the name,
  clicks it once and removes it. `levels.browser.test.ts`: the `copyKeep` Button is at least 44 px, is on with
  `canSave` false and with `status` `clean`, and pressing it calls `oncopy` once. `visitor.journey.test.ts`, at iPad
  upright and phone, never signing in unless the line says so:

```ts
test('a visitor tries the example game: Welcome, Try it now, the level, a drag, and a copy on the device', async () => {
  await page.getByRole('button', { name: WORDS.tryIt }).tap()
  await expect(page.getByText(WORDS.visitorCan)).toBeVisible()
  await page.getByRole('button', { name: 'level-1' }).tap()
  await dragByTouch(page, 'crate-1', { dx: 2, dy: 0 })
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: WORDS.copyKeep }).tap()
  const file = await download
  expect(file.suggestedFilename()).toBe('level-1.json')
  expect(await readText(file)).toBe(writeContent('level', moved))            // byte for byte what Save would write
  await expect(page.getByText(WORDS.copyKept)).toBeVisible()
  expect(fake.log.filter((r) => r.method !== 'GET')).toEqual([])             // the visit wrote nothing, anywhere
  expect(fake.repos.get('grandma/crate-game').commits).toEqual([])
})
test('a "Change this game" link opens the game with no Welcome and no sign-in screen', ...)   // #/game/grandma/crate-game
test('the visitor reloads: the crate is still where they put it, and the screen says so', ...)       // draftBack
test('the visitor presses Save, signs in, and saves: the game holds exactly the copy they kept', ...)
  // as grandma: the commit's text equals the downloaded file's text
test('a visitor never sees the waiting changes, the Share button, or anyone\'s name', ...)
test('a visitor who opens the Share address is asked to sign in, and lands on Share after', ...)
test('on a site with no sample game, Welcome has one primary Button, Sign in, and no Try it', ...)   // the site started without VITE_SAMPLE_GAME
test('Welcome with a sample game: Try it now is the one primary, at least 48 px; Sign in is plain, at least 44 px', ...)
test('the whole visit made no request to any address but the page\'s own', ...)
```

  (The "no sample game" line needs a second build: `global-setup.ts` builds once more with `VITE_SAMPLE_GAME` empty
  into `dist-plain/` and serves it on port 4802.)
- [ ] **Step 2: Push; `check`, the engines and the journeys fail.**
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Push; all jobs pass in all three engines.** If WebKit does not raise a `download` event for a Blob
  link, stop and report with the log: the fix is chosen with the coordinator, not worked around.
- [ ] **Step 5: Commit** (`feat(game): try the editor without signing in, and keep a copy`).

### Task 19: The first run, for each kind of person

Nobody reads a manual. A visitor gets from the first screen to their first change without being asked for
anything, and learns that signing in is how it is saved; an Owner who has never used the editor gets from the first
screen to a saved change and a shared game; a person who was sent a link gets from the link to their first change
(or their first approval) knowing what they may do. At every step the screen says what is happening and what to press.

**Files:**
- Create: `src/features/suite/guide.ts`, `src/features/suite/Guide.svelte`
- Modify: `src/features/words/words.ts`, `Welcome.svelte`, `AddEditor.svelte`, `App.svelte`, `GameHome.svelte`,
  `LevelScreen.svelte`, `WaitingChange.svelte`, `Share.svelte`
- Test: `tests/features/suite/guide.test.ts`, `tests/journeys/first-run.journey.test.ts`

**Interfaces:**
- Consumes: every screen so far.
- Produces:

```ts
// guide.ts: which step of the first run a person is on, worked out from facts, so it cannot get out of step
export type GuideStep = 'start' | 'add-editor' | 'pick-game' | 'move' | 'save' | 'done'
export function guideStep(facts: {
  signedIn: boolean              // only decides between 'start' and what follows it, when no game is open
  games: number | undefined      // how many games are in the person's list; undefined while asking
  inGame: boolean                // a game is open (they picked one, or came by a link)
  inLevel: boolean
  dirty: boolean
  savedOnce: boolean
  keptCopy: boolean              // a visitor pressed "Keep a copy" after a change: also 'done'
}): GuideStep
/** The steps this person will count; `start` is never one of them. An Owner: add the editor, pick a game, move,
 *  save. In a game they did not pick from their own list (a link, or "try it"): pick a level, move, save. */
export function guideSteps(cameByLink: boolean): readonly GuideStep[]
export function guideWanted(store: Storage): boolean         // true until the guide is finished or hidden
export function finishGuide(store: Storage): void            // localStorage 'af.guide.done'
```

  `Guide.svelte` is a strip at the top of every screen while `guideWanted`: the count (`guideCount`), a row of dots
  with the done ones filled, the step's sentence, and a plain `guideHide` Button. It is a `role="status"` region,
  so each new step is read out.

More words, exactly:

| Key | Words |
|---|---|
| `signInWhy` | Signing in is how your changes get saved and shared. It's only so people know who you are. You won't need GitHub after that. |
| `noAccount` | No GitHub account? Make one, it's free. |
| `guideCount(n, of)` | Step *n* of *of* |
| `guideStart` | Try the example game, or sign in to open your own. |
| `guideStartPlain` | First, sign in. |
| `guideSaveVisitor` | Nice. To put it in the game, press Save and sign in. Or keep a copy. |
| `guideDoneCopy` | You did it. You have a copy. Sign in whenever you want to save into a game. |
| `guideAdd` | Next, let the editor open your game. Press the button, choose your game on GitHub, and you'll come back here. You only do this once. |
| `guidePick` | Now pick your game. |
| `guidePickLevel` | Pick a level to change. |
| `guideMove` | Touch a box and drag it somewhere new. |
| `guideSave` | Nice. Now press Save. |
| `guideDoneDirect` | You did it. The change is in your game. |
| `guideDoneSuggestion` | You did it. Your change is waiting for someone to approve it. |
| `guideLook` | You can look around this game. To change things, ask its owner. |
| `guideHide` | Hide these tips |
| `tipShare` | Want help with your game? Press Share to let someone in. |
| `tipApprove` | Someone made a change for you to look at. Open it to approve it or turn it down. |
| `tipGotIt` | Got it |

What changes on the screens:

- **Welcome** shows the strip with no count, only its sentence (`guideStart`, or `guideStartPlain` on a site with
  no sample game), so the count a person then sees never changes under them,
  `signInWhy` under the sign-in Button, and `noAccount` as a link to `{webUrl}/signup`.
- **A visitor** (by "try it" or by a link) is never asked to sign in by the strip before they have made a change:
  it counts three steps (pick a level, move, save). At the save step it says `guideSaveVisitor`. Keeping a copy
  finishes the guide with `guideDoneCopy`; signing in and saving finishes it like anyone's.
- **The no-games screen** is the Owner's first counted step: `guideAdd` and the primary `pickAdd` Button. Coming back from
  GitHub (the `setup_action` return, Task 11), the games are asked for again; with exactly one game it is opened
  for them, with more they pick.
- **A person who came by a link and is signed in** (the page was opened on a game's address) is in that game at
  once: their strip counts the same three steps (pick a level, move, save) and the game's page shows
  `youAre(level)`.
- **In a level** the strip says `guideMove` until the first move, `guideSave` until the first save, then
  `guideDoneDirect` or `guideDoneSuggestion` with one Button, `guideHide`, which finishes the guide. At `look` the
  strip says `guideLook` and finishes when hidden.
- **Two one-time tips**, each a Notice with a `tipGotIt` Button, each shown until dismissed
  (localStorage `af.tip.share`, `af.tip.approve`): `tipShare` on an Owner's game page once they have saved a change;
  `tipApprove` on the game's page the first time someone who may approve sees a change waiting.
- Hiding the tips at any step finishes the guide. A person who has finished it never sees the strip again.

- [ ] **Step 1: Write the failing tests.** `guide.test.ts`: `guideStep` for each row of facts (signed out with no game open is
  `start`; signed out with a game open is `pick-game`, in a level `move`, dirty `save`: a visitor is never sent back
  to `start`; signed in with `games` 0 and no game open is `add-editor`; `games` undefined is `pick-game`, so the
  strip does not flash "add the editor" while asking; a game open and no level is `pick-game`; in a level, clean,
  is `move`; dirty is `save`; `savedOnce` is `done` whatever else, and so is `keptCopy` when not signed in); `guideSteps(false)` is `add-editor`, `pick-game`, `move`, `save` and
  `guideSteps(true)` is `pick-game`, `move`, `save`; `guideWanted` is true on a fresh store, false after `finishGuide`, and true (never
  a throw) on a store that throws. `first-run.journey.test.ts`, at iPad upright and phone, each in a fresh browser:

```ts
test('an Owner, from nothing to a saved change, following only what the screen says', async () => {
  // as grandma, with no repo installed
  await expect(strip).toContainText(WORDS.guideStart)
  await page.getByRole('button', { name: WORDS.signIn }).tap()
  await expect(strip).toContainText('Step 1 of 4')
  await expect(strip).toContainText('You only do this once')
  await page.getByRole('button', { name: WORDS.pickAdd }).tap()        // to the pretend GitHub and back
  await expect(strip).toContainText('Step 2 of 4')
  await page.getByRole('button', { name: 'crate-game' }).tap()
  await page.getByRole('button', { name: 'level-1' }).tap()
  await expect(strip).toContainText(WORDS.guideMove)
  await dragByTouch(page, 'crate-1', { dx: 2, dy: 0 })
  await expect(strip).toContainText(WORDS.guideSave)
  await page.getByRole('button', { name: WORDS.save }).tap()
  await expect(strip).toContainText(WORDS.guideDoneDirect)
  expect(fake.repos.get('grandma/crate-game').commits).toHaveLength(1)  // the first run ends in a real change
  await page.getByRole('button', { name: WORDS.guideHide }).tap()
  await page.getByRole('button', { name: WORDS.back }).tap()
  await expect(page.getByText(WORDS.tipShare)).toBeVisible()            // and then points at Share
  await page.reload()
  await expect(strip).toBeHidden()                                      // the tips do not come back
})
test('a visitor, from nothing to a change and a copy, following only what the screen says', ...)
  // Welcome with guideStart and no count; Try it now; 'Step 1 of 3'; level-1; guideMove; drag; guideSaveVisitor;
  // Keep a copy; guideDoneCopy. Never a sign-in screen.
test('a visitor who presses Save instead: asked to sign in, comes back, saves, and the strip ends like anyone\'s', ...)
test('someone sent a link (suggest), not signed in: lands in the game, three steps, signs in at Save, ends "waiting for someone to approve it"', ...)
test('someone sent a link (edit): the same, ending "the change is in your game"', ...)
test('someone sent a link (look): told they can look around and who to ask; no step asks them to save', ...)
test('someone sent a link they may not open: told to ask the owner, with no strip and no dead end', ...)   // a way back to "Pick a game"
test('an approver\'s first visit with a change waiting: the tip points at it, once', ...)
test('at every step there is exactly one primary button, at least 48 px tall, and the strip is on screen without scrolling', ...)
test('with only one game, coming back from GitHub opens it without asking', ...)
test('"Hide these tips" on Welcome hides them for good; the screens still work', ...)
test('an Owner whose game already has the editor goes from signing in straight to "Step 2 of 4"', ...)
test('cancelling on GitHub comes back to Welcome with signInCancelled and the same sentence in the strip', ...)
test('coming back from GitHub without adding the editor stays on "Step 1 of 4"', ...)
test('the welcome screen says what signing in is for, and has a way to make an account', ...)
test('no screen a visitor can reach has a button that does nothing or a dead end: each has a way on and a way back', ...)
test('a returning person, signed in and with the guide finished, lands on "Pick a game" with no strip', ...)
```

- [ ] **Step 2: Push; `check` and the journeys fail.**
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Push; all jobs pass in all three engines.**
- [ ] **Step 5: Commit** (`feat(suite): a first run for owners and for the people they share with`).

### Task 20: Every screen at every size, pictured

**Files:**
- Create: `tests/journeys/screens.journey.test.ts`, `tests/features/suite/words-used.test.ts`
- Modify: whatever a failing check here points at

**Interfaces:**
- Consumes: `openPage`, `SIZES`, `picture` (Task 11) and every screen.

- [ ] **Step 1: Write the failing tests.** `screens.journey.test.ts`: for each of the three sizes, walk Welcome with
  "try it" and without, Welcome when a screen needs a person, the game's page and the level as a visitor, the
  "sign in to save" Notice, the "copy is on your device" Notice, a game a visitor can't open, Welcome after a
  cancelled sign-in, the "add the editor" step, Pick a game, the game's page at each of the five
  levels, the game's page with changes waiting, a game that can't be opened, a broken game, the level as opened,
  with the crate selected, with unsaved changes, saved straight in, saved as a suggestion, the "someone changed
  this level" Notice, the "Leave anyway?" question, the waiting list, one waiting change as an approver, as its
  author, and with failed checks, and the Share screen empty, with three people, and with a mistyped name; the
  first-run screens once with the strip and once without. On each, check and then take
  `picture(page, '<size>-<screen>')`:
  - no horizontal scroll (`scrollWidth <= clientWidth` on the document);
  - every visible `button`, `a`, `input` and `select` is at least 44 by 44 px, and the screen's primary Button at
    least 48 tall;
  - no two of them overlap;
  - there is exactly one `h1`, and at most one primary Button;
  - every visible text node is inside the viewport's width, and none is cut off with an ellipsis;
  - on the level screens, the stage is at least half the viewport's shorter side.
  `words-used.test.ts`: every key of `WORDS` is used somewhere under `src/` (no dead words); no `.svelte` file has a
  text node or an `aria-label`, `title` or `placeholder` written as a literal string (every word comes from
  `WORDS`); and no value of `WORDS`, lower-cased, contains a banned word (Task 2's list), now that every task has
  added its rows.
- [ ] **Step 2: Push; read the red run** and fix what it finds, one commit per kind of fix. If the run is green at
  once, say so in the report: the checks still stand guard.
- [ ] **Step 3: Push; all jobs pass,** and the `screens` job has copied the pictures to the `ci-screens` branch
  under `pr-<number>/<engine>/`.
- [ ] **Step 4: Read every Chromium picture** from the `ci-screens` branch (the artifact host is refused from a cloud
  session; the branch is not) against the drunk-grandma test: can she tell what is happening, and what to press?
  Write one line per screen in the pull request's description. A screen that fails is fixed in this task.
- [ ] **Step 5: Commit** (`test: every screen pictured and measured at iPad and phone sizes`).

### Task 21: Setting it up, the README and the close

**Files:**
- Create: `docs/deploy.md`, `docs/teams.md`, `tests/docs/docs.test.ts`
- Modify: `README.md`, `CLAUDE.md` (Structure, if it moved), `docs/superpowers/progress.md`

- [ ] **Step 1: Write the failing test.** `docs.test.ts` reads `docs/deploy.md` and expects it to name every
  setting the code reads: `VITE_GITHUB_CLIENT_ID`, `VITE_GITHUB_APP_SLUG` and `VITE_SAMPLE_GAME` (build), `GITHUB_CLIENT_ID`,
  `GITHUB_CLIENT_SECRET`, `GITHUB_APP_ID` and `GITHUB_APP_PRIVATE_KEY` (the Function), the build command
  `pnpm build`, the output folder `dist`, the callback and setup addresses, and the App's four permissions; that
  nothing in the repo but `.env.journeys` and tests sets a value for any of them; and that `docs/teams.md` names
  `automata.access.toml`, shows the example file from this plan, and that example passes `parseAccess`.
- [ ] **Step 2: Write `docs/deploy.md`,** for whoever runs the site, as numbered steps: (1) in Cloudflare, make a
  Pages project from this repo, build command `pnpm build`, output `dist`, Node 24; note the address it gives;
  (2) on GitHub, make a GitHub App: that address as the home page, the callback and the setup address ("redirect on
  update" on); repository permissions Contents read and write, Pull requests read and write, Checks read, Metadata
  read, and nothing else; no account permissions; no webhook; "any account" may install it; make a client secret
  and a private key; (3) back in Cloudflare, set the six values (the secret and the key as secrets, the key pasted
  whole as GitHub gave it) and, to give visitors a game to try, `VITE_SAMPLE_GAME` as `owner/name` of a public game
  the editor has been added to; redeploy; (4) the check below. It also says plainly that preview addresses cannot
  sign in, because the App has one callback address.
- [ ] **Step 3: Write `docs/teams.md`,** for a team's Owner, in plain words: add the editor to your game (one
  button, once); share it from the Share screen; what each level can do (the table from this plan); that the list
  is the file `automata.access.toml` in the game, which an agent or a person can also edit by hand, with the
  example; and, for teams that want GitHub itself to guard the game against their own GitHub collaborators, the
  optional branch rule, step by step: require a pull request with one approval on the default branch, and put
  Automata Editors on the rule's bypass list, or Save and Approve will say the editor is blocked.
- [ ] **Step 4: Rewrite `README.md`:** what the suite is (it changes a game's authorable content, the JSON files;
  the code is the agents'), that anyone can try it and keep a copy without signing in, how a team starts (two links: the site, `docs/teams.md`),
  the levels in one table, what Save does at each, the link form `#/game/<owner>/<name>`, the fact that an agent
  can make every change the editor makes by editing the same files, how the page and the API are split, and that
  tests run only in CI.
- [ ] **Step 5: Push; all jobs pass.** Update the tracker to stage 4 at 100%, tick every box here.
- [ ] **Step 6: Commit** (`docs: setting the site up, a team's guide and the README`), mark the pull request ready,
  and send the coordinator the summary, with this list for the Owner's review. It cannot run in CI, and M1's "done
  means" needs it:

  1. Do the steps in `docs/deploy.md`.
  2. On the iPad, in a browser that has never opened the editor, open the Pages address. Without signing in, press
     "Try it now", drag the crate and press "Keep a copy": the level's file is in Files. Then follow the tips: sign
     in, add the editor to AutomataFrameworkExamples, open `level-1`, drag the crate, press Save. It should say
     "Saved. Your game has the change." The commit is on the Examples repo's `main`, changes only
     `content/levels/level-1.json`, and its checks run green in all four engines. (If it says GitHub is set to stop
     the editor, the Examples repo's branch rule needs Automata Editors on its bypass list: `docs/teams.md`.)
  3. The Site's game shows the crate where it was dropped.
  4. Press Share, set "anyone" to Suggest, and open the link on a phone signed in as a second GitHub account that
     has no rights on the repo. Move the crate and save: it waits. Back on the iPad, approve it. The phone never
     opened GitHub after signing in.

## Self-review notes

- **Spec coverage, M1's Editors line.** The suite shell: Tasks 2, 11, 12, 18, 19. GitHub sign-in through a Pages
  Function: Tasks 4, 11. Save: Tasks 8, 15. The Levels editor moving the crate: Tasks 13, 14. In the browser at iPad
  size: Tasks 14 to 20, with phone size too (the spec's CI section). "Opening a game" reads the project file through
  `loadGame`. "Problems" in M1 are the framework's diagnostics shown when a game opens, and the API's when a save
  is refused; listing them as you edit is M3.
- **Where this plan departs from the spec, on the Owner's word (2026-11-13):** sign-in is a GitHub App, not an
  OAuth app; the page does not call GitHub's API, the editor's own API does, as the App; who may do what is a
  sharing file in the game's repo, with a Share screen; Save goes straight into the game only for Edit and Owner
  levels and is otherwise a suggestion that someone approves in the editor. The spec needs the same edits, and the
  sharing file's schema belongs in the framework from M2.
- **Added on the Owner's word, later the same day:** anyone can use the editor without signing in and keep a copy
  (the door in Task 7, the page in Tasks 11, 12 and 15, the front door and the copy in Task 18, the first run in
  Task 19); and the editors change authorable content only, which the plan already did and now says (Global
  Constraints).
- **A visitor reads through the App.** The API reads a public game for someone it cannot name. That is only ever
  a game the editor was added to, only its content files, and only what anyone can already read on GitHub; the
  plan audit should still weigh whether the route wants a limit on how often one address may ask.
- **Anti-goals.** "An editor action an agent can't do by editing files": every action ends as a change to a content
  file or to `automata.access.toml`, both documented, written by one writer each (a kept copy is that same content
  file, on the device); a waiting change is an ordinary
  branch and pull request. "An iPad editor that only works when a computer is on": static files and one Function.
  "Four repos that each work but don't meet": the journeys prove this repo's half of the join byte for byte, and
  Task 21's list is the other half.
- **For the Examples repo:** the editor commits to its `main` as the App (an Owner's save), and leaves
  `automata/<login>` branches while a suggestion waits. Its CI must run on those pull requests and pushes; if its
  `main` has a branch rule, the App must be on the bypass list.
- **Not provable in CI:** GitHub's real sign-in and "add to a game" screens, a real branch rule, real checks,
  Cloudflare's build of the Function, and the calls written from memory (see "Before starting"). Task 21 hands the
  first four to the Owner's check.
