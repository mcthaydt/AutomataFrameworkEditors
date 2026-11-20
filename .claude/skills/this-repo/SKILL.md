---
name: this-repo
description: "Use when working in this repo: its layout, its CI and its own rules"
---

# This repo

What is particular to this repo, kept from its earlier notes and the 2026-11-16 handoff.

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
  ordinary branch and pull request. The device may keep only: an unsaved draft (`af.draft:…`), the changes last sent to be checked, kept until they are answered so a "no" can bring them back (`af.sent:…`), first-run tips and their
  counts (`af.guide.done`, `af.tip.*`, `af.saved`), the sign-in (`af.tokens`, short-lived `af.signin.*`), games this
  device opened (`af.recent`) and the person's "For me" choices (`af.me.*`, with `af.me.glass` for "See-through
  panels": `auto`, `on` or `off`). A kept copy is the content file itself. Anything else is a defect. A new `af.me.*`
  key is added to this list in the change that adds it.
- **Touch first.** Designed and tested at iPad size (iPad Pro 11 first), upright and sideways, then phone. Targets at
  least 44 px, primary actions 48 px. Anything draggable also moves with buttons and the keyboard.
- **Onboarding is part of every feature:** a new kind of person or screen comes with its first run and its journey.
- **Every word a person reads lives in `src/features/words/`**, in plain language, in nine languages (en, es, ko, ja,
  zh, pt, fr, ru, de; English the source): no "repo", "commit", "branch", "pull request", "merge" or "token" on a screen.
- **The look** is `docs/design-language.md`: Fraunces and Onest, Phosphor icons, peach the only accent, the helper's
  colour (`--agent`, Wada No. 177 `#b5b1d8`) only for what a helper did. Colours and sizes come only from
  `src/features/ui/ui.css` tokens. The approved mockups are in `docs/mockups/`.
- **Sketch first.** No editor code until that editor's spec has a layout sketch of each of its screens (`visual-check`).
  No new mockups are drawn; the approved ones in `docs/mockups/` stay the reference for the shell and World screens they
  cover.
- **The framework is a git dependency** pinned to a commit on its `main` until Release 1, listed in
  `pnpm.onlyBuiltDependencies`; moving the pin is its own pull request. Nothing here is published to npm.
- **Journeys** (`tests/journeys/`) drive the built suite in real browsers, with the real API code against a pretend
  GitHub. They never touch the real GitHub.

## Fast CI here

- A draft runs Chromium only; WebKit and Firefox run in the full run that gates merge (the Owner, 2026-11-16). A draft
  runs the Node tests the change reaches; the browser tests whole (Vitest's `--changed` fails in browser mode here); the
  journeys when the built suite's files changed (`src/`, `functions/`, the page, `public/`, the journeys), stopping at
  the first failure; the screens journey only when something seen changed (a `.svelte` or `.css` file, the words, the
  page, the mockups) or with the `screenshots` label, and then only the scenes of the screens the change reaches
  (`scripts/screens-touched.ts`; a change to the kit, the words, a style sheet or the page takes every scene).
- `.pnpmfile.cjs` counts as build setup. The full run's 18 shards are `browsers (<engine> <n>/6)`: the screens journey's
  three sizes are shards 1 to 3 (the short browser tests ride in the first), the other journeys are shards 4 to 6;
  with `engines (<engine>)` checks (`scripts/engines-gate.ts` counts six); `screens` puts the pictures on `ci-screens`.
- The docs-only path never covers the README, `docs/deploy.md`, `docs/teams.md` or `docs/mockups/`, which tests read.

## Structure

`src/index.ts` (`mountSuite`), `src/main.ts` (mounts it), `src/lib/`, `src/features/<feature>/` (`<feature>.ts` entry,
one job per `<part>.ts` or `<Part>.svelte`), `functions/` (the one Pages Function, a thin wrapper over `service`),
`scripts/`, and `tests/` mirroring `src/` plus `fixtures/` (the example game, the pretend GitHub, the journey server),
`journeys/`, `workflows/` and `docs/`. Specs, audits and the tracker are in `docs/superpowers/`.

Features, lowest first: `words`, `access`, `files`, `wire` (both sides); `exchange`, `github`, `service` (the API side,
which uses nothing a page has); `device`, `ui`, `api`, `session`, `game`, `shell`, `levels`, `map`, `play`, `team`,
`world`, `suite` (the page side, which never imports the API side). Features import only from features below them;
the list is `LAYERS` in `tests/architecture/rules.ts`, which `tests/architecture.test.ts` reads. `smol-toml` is for
`access` and `files` only; Pixi only for `levels/level-canvas.ts` and `map/map-canvas.ts`. No file over 600 lines.

`biome.json` turns the formatter off for `tests/fixtures/game/content/**` (JSON has no comments, so the reason is
here): those files are byte for byte what `writeContent` writes, and Biome would fold a short list onto one line.
