This codebase is yours: what it's for and how it's built are your call, and you'll keep building on it.

# AutomataFrameworkEditors

A framework and set of editors for making games, where agents do the authoring and every piece of authorable content
can be edited on an iPad. This repo is the editors: one suite in which a team opens its game from its GitHub repo, changes its
content files by touch, and saves each change into the game or as a suggestion for someone to approve. The runtime is
[AutomataFramework](https://github.com/mcthaydt/AutomataFramework), and the first layer's design is its
[`docs/superpowers/specs/2026-11-13-2d-first-layer-design.md`](https://github.com/mcthaydt/AutomataFramework/blob/main/docs/superpowers/specs/2026-11-13-2d-first-layer-design.md);
where this page is short, the spec has the detail. This repo's plans, audits and tracker are in `docs/superpowers/`.

**The shared rules are in [AutomataFramework's `docs/rules.md`](https://github.com/mcthaydt/AutomataFramework/blob/main/docs/rules.md)** (principles, the Owner's decisions, the
workflow, the visual review, sessions, the rules and Fast CI). Read it first. This page holds only what is particular to
this repo; a shared rule is changed there, never here.

## Particular to this repo

- **The editors are for other teams**, working together on their own games in their own repos. Nothing here may
  assume this project's repos or its merge workflow. AutomataFrameworkExamples is only the test game.
- **An editor changes authorable content and nothing else.** It opens, writes and exports only the content files
  (JSON) a game's `automata.toml` lists. It never shows or touches a game's code.
- **Signing in is asked for only when it is needed:** to save, to see or approve waiting changes, to share, to list
  your own games. Someone who has not signed in can open only the demo game (the Owner, 2026-11-13; every other
  game is its team's), change it on the screen and keep a copy of a level as its JSON, to paste back into an agent
  or a game's files; the API reads for them and writes nothing.
- **People sign in with GitHub and then never need it.** The editor's own GitHub App does every piece of GitHub
  work. The page talks only to this site's `/api`; the API (Cloudflare Pages Functions) acts as the App.
- **Who may do what is a file in the game's repo**, `automata.access.toml`: Look, Suggest, Approve, Edit, Owner.
  The API works out the person and their level afresh on every call, from the default branch, and trusts nothing
  the page says. GitHub's own roles are not used. The App asks GitHub for contents, pull requests, checks (read)
  and metadata, and nothing more.
- **An editor knows only the framework's content formats.** It reads a game with the framework's `loadGame`, and
  every byte written is `writeContent`'s, so an agent editing the same file by hand makes the same bytes.
- **Nothing an editor does is hidden from an agent.** Every action ends as a change to a documented file; a waiting
  change is an ordinary branch and pull request. A screen that keeps state anywhere else is a defect. The
  device may keep only these, and none is something an agent needs: an unsaved draft (`af.draft:…`), the first-run tips
  and what they have counted (`af.guide.done`, `af.tip.*`, and `af.saved`, that the person has saved once and how), the
  sign-in (`af.tokens`, and the short-lived `af.signin.*`) and the games this device has opened (`af.recent`). A kept
  copy is the content file itself, byte for byte.
- **Touch first.** Every screen is designed and tested at iPad size, upright and sideways, then at phone size. Touch
  targets are at least 44 px, primary actions 48 px. Anything that can be dragged can also be moved with buttons and
  with the keyboard.
- **Onboarding is part of every feature.** A new kind of person or screen comes with its first run and its journey.
- **Every word a person reads lives in `src/features/words/`**, in plain language: no "repo", "commit", "branch",
  "pull request" or "token" on a screen.
- **The framework comes from a git dependency** pinned to a commit on its `main` until Release 1, listed in
  `pnpm.onlyBuiltDependencies`. Moving the pin is its own pull request.
- **Nothing here is published to npm.** The package is private; there is no release workflow until Release 2.
- **No secret is in the page, the repo or a log.** The App's client secret and private key live only in Cloudflare.
- **Journeys** (`tests/journeys/`) drive the built suite in real browsers, with the real API code running against a
  pretend GitHub in CI. They never touch the real GitHub.

## Fast CI here

- A draft runs the Node tests the change reaches; the browser tests whole, since they take seconds and Vitest's
  `--changed` fails in browser mode here; the journeys in Chromium only, and only when what the built suite is made of
  changed (`src/`, `functions/`, the page, `public/`, the journeys), stopping at the first failure; the screens journey
  and its pictures only when something seen changed (a `.svelte` or `.css` file, the words, the page, the mockups) or
  the pull request has the `screenshots` label (`pictures` still works).
- `.pnpmfile.cjs` also counts as build setup. The full run's six shards are `browsers (<engine> <n>/2)` (the screens
  journey and the short browser tests in the first, every other journey in the second), with `engines (<engine>)`
  checks; the `screens` job puts both shards' pictures on `ci-screens`.
- The docs-only path never covers the README, `docs/deploy.md`, `docs/teams.md` or `docs/mockups/`, which tests read.

## Structure

```
src/index.ts                  the public surface: mountSuite
src/main.ts                   the page's entry: mounts the suite
src/lib/                      shared helpers, no feature logic
src/features/<feature>/       <feature>.ts entry, <part>.ts or <Part>.svelte one job per file
functions/                    the one Cloudflare Pages Function: a thin wrapper over the service feature
scripts/                      thin CLI wrappers
tests/architecture.test.ts    imports go down, no cycles, no tests in src, the page and the API kept apart
tests/features/<feature>/     mirrors src/features
tests/lib/                    tests of src/lib
tests/fixtures/               the example game's files, the pretend GitHub, the journey server
tests/journeys/               end-to-end journeys in real browsers
tests/workflows/, tests/docs/ checks that read a workflow, package.json, the bundle or the docs
docs/superpowers/             plans/, audits/, progress.md (open work), history.md
```

Features, lowest first: `words`, `access`, `wire` (used by both sides); `exchange`, `github`, `service` (the API
side, which uses nothing a page has); `ui`, `api`, `session`, `game`, `levels`, `suite` (the page side, which never
imports the API side). Features import only from features below them. No top-level `components/`, `services/` or
`utils/`.
