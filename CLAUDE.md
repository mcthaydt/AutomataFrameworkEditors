This codebase is yours: what it's for and how it's built are your call, and you'll keep building on it.

# AutomataFrameworkEditors

A framework and set of editors for making games, where agents do the authoring and every piece of authorable content
can be edited on an iPad. This repo is the editors: one suite in which a team opens its game from its GitHub repo, changes its
content files by touch, and saves each change into the game or as a suggestion for someone to approve. The runtime is
[AutomataFramework](https://github.com/mcthaydt/AutomataFramework), and the first layer's design is its
[`docs/superpowers/specs/2026-11-13-2d-first-layer-design.md`](https://github.com/mcthaydt/AutomataFramework/blob/main/docs/superpowers/specs/2026-11-13-2d-first-layer-design.md);
where this page is short, the spec has the detail.

## Principles

1. **Agent-first.** Anything a person can author, an agent can create, read and change through the same documented
   formats and commands. No hidden state, nothing mouse-only.
2. **iPad-first editors.** Touch first; desktop is a bonus.
3. **Layers in order.** 2D built in full (runtime, editors, publishing) before any 3D. 3D is a layer on top, never
   mixed in.
4. **Separate repos per layer or tool**, each with its own release. No monorepo.
5. **Characters and scenes come from the environment builder and figure builder**, carried over from the first attempt.
6. **The stack carries over whole** (PixiJS, Pixi3D, Colyseus, Effect, strict TypeScript, a deterministic sim with
   cross-browser parity tests, API reports, GitHub-hosted CI). Anything left out has a written reason. New dependencies
   need the Owner's yes.
7. **Port in layer order** from AutomataFrameworkFailed, reviewed as it lands, never ahead of the layer using it. That
   repo is a reference, not a template.

Every spec names the principle it serves; a spec serving none, or breaking one, doesn't start.

**Left out:** Ruken as a target (web, itch and desktop stay); a monorepo layout; anything mixing 2D and 3D in one
package.

## The Owner's decisions (2026-11-13)

- **Strategy and research stay private.** Positioning, competitors, pricing and market research never go in these
  public repos; the Owner keeps them in the project's private files.
- **The first layer** is a thin slice through the whole offering: the framework, a demo game, the editors, the site and
  deployment, built as a thin thread through all four repos first and then widened (milestones M1 to M4).
- **Repos:** AutomataFramework, AutomataFrameworkExamples (the demo game, later the 3D game, the site's
  examples), AutomataFrameworkEditors, AutomataFrameworkSite. PixiJS is the biggest inspiration.
- **Determinism means physics.** Rapier's deterministic 2D build. Physics and networking (Colyseus) are in the core,
  like the ECS (Koota).
- **Multiplayer:** every game is built as if it were multiplayer; turning it on is a per-game choice. Networking is
  built and proven in CI, not deployed. Fly.io hosts the room server once the 3D game uses it.
- **The demo game** is a small original physics platformer, single-player, with every built-in: saves; title, pause and
  settings screens; keyboard, touch and gamepad with remapping; music and sound with volume; phone, tablet and desktop
  layouts; languages.
- **Editors:** all nine old 2D editors plus the figure and environment builders, which make 2D art only, combined
  into five: World (Levels, Tiles, the environment builder), Characters (the figure builder, clips and entity kinds,
  Schematic), Feel (Feel, Tuner), Sound (Audio) and Story (Writer, Sequence). World and Characters have a 2D and a 3D
  version; the 2D ones work the way the old 3D builders did. In the browser, and as a Tauri app for iPad, Android
  and desktop.
- **Agents working on the code are the primary way a game is made.** The editors are for the authorable content
  only: the JSON files the coding agents produce.
- **Edits live in the game's GitHub repo.** Save makes a commit; edits that collide merge the way GitHub does.
  Sign-in runs through a Cloudflare Pages Function; the site is on Cloudflare Pages.
- **Anyone can use the editors freely without signing in,** and keep a copy of what they made. Saving into a game
  and working with others need a sign-in.
- **Collaboration between technical and non-technical people is non-negotiable.** The editors are for teams: people
  get levels of what they may do, like Google Docs, set on a Share screen, and need GitHub only to sign in.
- **Onboarding is one of the most important parts of the product.**
- **Formats:** game content is JSON; everything else is TOML.
- **Order inside the editors:** World's Levels part (M1), then Feel with Tuner inside it (the first editor slice),
  then the rest of the five.
- **Releases are big and few** (the Owner, 2026-11-13). Release 1 is when 2D is finished (the framework in full and
  the demo game), Release 2 the 2D editors, Release 3 the website, Release 4 distribution (shipping games and the
  editor app), Release 5 3D, and the loop repeats for 3D. Milestones are not releases: nothing is published per
  milestone, and `release.yml` runs only when the Owner starts it by hand. Small releases come back only once the
  product is officially feature complete.
- **Publish targets:** web, itch.io, Wavedash (if its rules fit the host port) and desktop.
- **Languages:** games ship English, Spanish, Korean, Japanese, Chinese and Portuguese. Editors add French, Russian and
  German. The list follows the most popular languages for Godot.
- **`main` is protected** in every repo: pull requests only, no force pushes or deletion, checks required once CI exists,
  no required approving review. Every new repo gets the same protection, and its own copy of this page, when it is
  created.

## Workflow

Each stage is a fresh session on its own branch; the handoff is committed docs.

1. **Spec**: coordinator and Owner, superpowers brainstorming, written to `docs/superpowers/specs/<date>-<topic>-design.md`.
2. **Plan**: Fable 5.2, medium effort, writing-plans, written to `docs/superpowers/plans/<date>-<topic>.md`.
3. **Plan audit**: Opus, medium effort, the audit prompt, written to `docs/superpowers/audits/<date>-<cycle>-plan-audit.md`.
4. **Execution**: Sonnet, high effort, executing-plans, the implementation prompt.
5. **Implementation audit**: Opus, medium effort, written to `docs/superpowers/audits/<date>-<cycle>-implementation-audit.md`.
6. **Fixes**: Sonnet, high effort.
7. **Owner review.**

Every stage reads the spec, the plan, the audits and [`docs/superpowers/progress.md`](docs/superpowers/progress.md) (the spec is in the AutomataFramework repo; plans, audits and the tracker for this repo are here),
updates the tracker with a progress percentage, and ends by committing and pushing.

**Implementation prompt:** "Now implement precisely as planned, in full. Implementation Requirements: - Write elegant,
minimal, modular code. - Adhere strictly to existing code patterns, conventions, and best practices. - Include
thorough, clear comments/documentation within the code. - As you implement each step: - Update the markdown tracking
document and overall progress percentage dynamically."

**Audit prompt:** "Audit all of your work for completeness, consistency, cohesion, and harmony, both within itself and
relative to the spec and relative to the codebase. Assume nothing. Verify everything. Investigate any incomplete
implementations or incomplete integrations. Do your best work."

## Sessions and reporting

- One long-lived coordinator. One long-lived merge session merges each finished stage branch to `main` by pull request
  once checks pass, then deletes the branch; it never leaves a passing pull request open. Stage sessions are archived
  when done.
- **Stage sessions report to the coordinator:**
  - one line per task: the commit, the test count, any surprises;
  - immediately at any stop (a stop rule, a cap, a failing test, an access refusal, a missing tool), and that task
    stops;
  - each deviation from the plan, with the reason;
  - Owner-only questions, with options, before defaulting;
  - a handoff at 90 minutes;
  - a summary at the end.
- **The merge session reports:**
  - each merge;
  - immediately, then waits for an answer, on any of these: a failing check, a conflict, a golden moved without a
    commit naming it, more than five branches, an unrequested branch, or any judgement call.

## Rules

- **The drunk-grandma test.** All copy and UX (every editor, the site, the game's screens) must let a drunk grandma
  tell what is happening and what to press. A screen that fails it is a defect.
- No subagents unless the Owner says so.
- **CLI first.** If something can be done with a CLI (gh, npm, wrangler and the like), do it with the CLI, and give
  the Owner CLI commands rather than click-through steps.
- **No AI attribution anywhere.** No `Co-Authored-By: Claude`, no session-link trailer and no "Generated with Claude Code" in
  commits, pull request bodies or docs (the Owner, 2026-11-13). Before any commit, set the author with
  `git config --global user.name "McThayDT" && git config --global user.email "107786093+mcthaydt@users.noreply.github.com"`.
  The `commit-authors` check (`.github/workflows/commit-authors.yml`) fails a pull request when one of the Owner's
  commits is not exactly that author and committer, when any commit is by Claude, or when a commit message or the
  pull request's words have a Claude credit. Its failure message gives the fix.
- Refresh sessions after 90 minutes.
- Branches: `main` plus branches with CI running, five at most.
- **Tests run only in GitHub-hosted CI, never locally.** Verify through the pull request's CI runs.

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
docs/superpowers/             plans/, audits/, progress.md
```

Features, lowest first: `words`, `access`, `wire` (used by both sides); `exchange`, `github`, `service` (the API
side, which uses nothing a page has); `ui`, `api`, `session`, `game`, `levels`, `suite` (the page side, which never
imports the API side). Features import only from features below them. No top-level `components/`, `services/` or
`utils/`.
