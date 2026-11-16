This codebase is yours: what it's for and how it's built are your call, and you'll keep building on it.

# AutomataFrameworkEditors

The editors of a framework for making games, where agents do the authoring and every piece of authorable content can
be edited on an iPad: one suite in which a team opens its game from its GitHub repo, changes its content files by
touch, and saves each change into the game or as a suggestion for someone to approve. The runtime is
[AutomataFramework](https://github.com/mcthaydt/AutomataFramework); the design is its first layer's spec.

**Read the shared rules first:
[AutomataFramework's `docs/rules.md`](https://github.com/mcthaydt/AutomataFramework/blob/main/docs/rules.md)**, beside
this clone at `../automataframework/docs/rules.md`. Its workflow skills are in `../automataframework/.claude/skills/`.
This page holds only what is particular to this repo; a shared rule is changed there, never here.

## Particular to this repo

- **For other teams' games**, in their own repos. Nothing may assume this project's repos or merge workflow;
  AutomataFrameworkExamples is only the test game.
- **Content only.** An editor opens, writes and exports only the JSON content files a game's `automata.toml` lists,
  read with the framework's `loadGame` and written byte for byte by `writeContent`. It never shows or touches code.
- **Sign-in only when needed** (to save, see or approve waiting changes, share, list your games). Without it, only the
  demo game opens (the Owner, 2026-11-13): change it on screen and keep a level's JSON; the API reads and writes nothing.
- **GitHub only to sign in.** The editors' GitHub App does all GitHub work; the page talks only to this site's `/api`
  (Cloudflare Pages Functions), which acts as the App. The App asks for contents, pull requests, checks (read) and
  metadata, nothing more. No secret is in the page, the repo or a log; they live only in Cloudflare.
- **Who may do what** is `automata.access.toml` in the game's repo (Look, Suggest, Approve, Edit, Owner), worked out
  afresh on every call from the default branch. The API trusts nothing the page says; GitHub's roles are not used.
- **Nothing hidden from an agent.** Every action ends as a change to a documented file; a waiting change is an
  ordinary branch and pull request. The device may keep only: an unsaved draft (`af.draft:…`), first-run tips and their
  counts (`af.guide.done`, `af.tip.*`, `af.saved`), the sign-in (`af.tokens`, short-lived `af.signin.*`), games this
  device opened (`af.recent`) and the person's "For me" choices (`af.me.*`, with `af.me.glass` for "See-through
  panels": `auto`, `on` or `off`). A kept copy is the content file itself. Anything else is a defect.
- **Touch first.** Designed and tested at iPad size, upright and sideways, then phone. Targets at least 44 px, primary
  actions 48 px. Anything draggable also moves with buttons and the keyboard.
- **Onboarding is part of every feature:** a new kind of person or screen comes with its first run and its journey.
- **Every word a person reads lives in `src/features/words/`**, in plain language: no "repo", "commit", "branch",
  "pull request" or "token" on a screen.
- **The framework is a git dependency** pinned to a commit on its `main` until Release 1, listed in
  `pnpm.onlyBuiltDependencies`; moving the pin is its own pull request. Nothing here is published to npm.
- **Journeys** (`tests/journeys/`) drive the built suite in real browsers, with the real API code against a pretend
  GitHub. They never touch the real GitHub.

## Fast CI here

- A draft runs the Node tests the change reaches; the browser tests whole (Vitest's `--changed` fails in browser mode
  here); the journeys in Chromium only, when the built suite's files changed (`src/`, `functions/`, the page,
  `public/`, the journeys), stopping at the first failure; the screens journey and its pictures only when something
  seen changed (a `.svelte` or `.css` file, the words, the page, the mockups) or with the `screenshots` label.
- `.pnpmfile.cjs` counts as build setup. The full run's six shards are `browsers (<engine> <n>/2)` (the screens journey
  and short browser tests in the first), with `engines (<engine>)` checks; `screens` puts the pictures on `ci-screens`.
- The docs-only path never covers the README, `docs/deploy.md`, `docs/teams.md` or `docs/mockups/`, which tests read.

## Structure

`src/index.ts` (`mountSuite`), `src/main.ts` (mounts it), `src/lib/`, `src/features/<feature>/` (`<feature>.ts` entry,
one job per `<part>.ts` or `<Part>.svelte`), `functions/` (the one Pages Function, a thin wrapper over `service`),
`scripts/`, and `tests/` mirroring `src/` plus `fixtures/` (the example game, the pretend GitHub, the journey server),
`journeys/`, `workflows/` and `docs/`. Plans, audits and the tracker are in `docs/superpowers/`.

Features, lowest first: `words`, `access`, `files`, `wire` (both sides); `exchange`, `github`, `service` (the API side,
which uses nothing a page has); `device`, `ui`, `api`, `session`, `game`, `shell`, `levels`, `map`, `play`, `team`,
`world`, `suite` (the page side, which never imports the API side). Features import only from features below them;
`tests/architecture.test.ts` checks it. `smol-toml` is for `access` and `files` only; Pixi only for
`levels/level-canvas.ts` and `map/map-canvas.ts`.

`biome.json` turns the formatter off for `tests/fixtures/game/content/**` (JSON has no comments, so the reason is
here): those files are byte for byte what `writeContent` writes, and Biome would fold a short list onto one line.
