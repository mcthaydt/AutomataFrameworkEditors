# Plan audit: the Editors' M1 thin-thread plan

Written 2026-11-13. Stage 3 (Plan audit) of cycle 1, for
[`plans/2026-11-13-m1-thin-thread-editors.md`](../plans/2026-11-13-m1-thin-thread-editors.md) as merged in PR 1 and
PR 2, read against the [spec](https://github.com/mcthaydt/AutomataFramework/blob/main/docs/superpowers/specs/2026-11-13-2d-first-layer-design.md)
(with its update in AutomataFramework PR 16), `CLAUDE.md`, [`progress.md`](../progress.md), the framework at the
pinned commit `ec4fddd`, the Examples repo's game (on its execution branch), and GitHub's own REST API description.

## The answer first

The plan is thorough and true to most of the spec. Its shape is right: a page that talks only to its own API, an
API that acts as the GitHub App, the sharing file as the one gate, and journeys that run the real API code against
a pretend GitHub. It covers every item on the spec's widened M1 Editors line, and its "done means" check for the
Owner is the spec's.

It is **not ready to execute as written**. Two of the Owner's answers today (22:45Z) change what a visitor may open
and what "Keep a copy" gives. Five more blocking findings would either stop a task on its first green push or
pass CI and then fail on the real GitHub. Then there are fourteen should-fix findings, twelve notes and two
questions only the Owner can answer.

**How the findings are applied** (the workflow as written): stage 4 (Execution) reads this audit with the plan and
applies B1 to B7 and S1 to S14 in the tasks they name; where the two differ, this audit wins. Q1 and Q2 are not
defaulted: the steps they touch wait for the Owner's answer.

## Method

- **GitHub's calls were checked against GitHub's own description of its API.** `docs.github.com` is still refused
  from a cloud session, but `raw.githubusercontent.com` is not, so every row of Task 5's table and Task 6's
  pretend-GitHub table was looked up in `github/rest-api-description`
  (`descriptions/api.github.com/api.github.com.json`, version 1.1.4, read 2026-11-13): path, method, body fields,
  response codes, and whether a GitHub App may call it. Results are in B5, B7, S5, S13, S14 and N2.
- **The bundle-size risk was measured.** The framework at `ec4fddd` was built (`vite build`) in a scratch folder,
  and a stand-in for `functions/api/[[path]].ts` importing `parseContent`, `writeContent`, `parseProject` and
  `loadGame` from the headless entry was bundled two ways (N1). This is a build, not a test.
- Every framework name the plan relies on was looked up in the framework's `docs/api/framework.api.md` at `ec4fddd`.
  All exist, with the shapes the plan uses. `fitWorld` and `Fit` are in the browser entry only, which is where the
  plan uses them (the page side).
- The plan's rule tests were read against the framework's `tests/architecture/rules.ts` and `rules.test.ts`.
- The approved dev dependencies' peer ranges were read from npm: `@sveltejs/vite-plugin-svelte` 7.3.1 takes Vite 8
  and Svelte 5.46.4 or later; `svelte-check` 4.7.6 takes TypeScript 5 or 6 (so TypeScript 6.0.3 is needed, as the
  plan says, and the spec allows).
- No tests were run (project rule).

## Blocking (fix before execution)

**B1. Visitors may open only the demo game** (the Owner, 2026-11-13 22:45: "vistors can open only our demo project,
everything else is tied to the team"). The plan lets a visitor open *any* public game the editor was added to whose
`everyone` is not `nothing`. That is wrong. *Fix:*
- The API takes the demo game from its own setting, `DEMO_GAME` (`owner/name`), in the Function's environment, and
  `visitorLevel` is `look` for that one game and `nothing` for every other, whatever its sharing file or GitHub
  says. A demo game that is private, or that the editor has not been added to, is `nothing` too. With no
  `DEMO_GAME`, no visitor opens anything.
- The page's `VITE_SAMPLE_GAME` (Task 18) is renamed `VITE_DEMO_GAME` and must be the same value; `docs/deploy.md`
  says so, and `docs.test.ts` names both.
- The rule in "Access levels" ("A person who has not signed in can open a game only if its repo is public and
  `everyone` is not `nothing`") becomes "only the site's demo game". Everything else is open only to its team,
  through sign-in and the sharing file. `everyone` keeps its meaning: anyone who *signs in*.
- Tests change with it. Task 7: "a visitor opens the demo game"; "a visitor is not-found for a second public game
  whose `everyone` is `look`", and for a private game, a game with no editor, and every game when `DEMO_GAME` is
  unset. The pretend GitHub gets a second public, installed game (`grandma/other-game`) for these. Task 12's and
  Task 18's "a `Change this game` link" journeys use the demo game; a link to `other-game` while signed out shows
  `cantFindVisitor` with the `signIn` Button, and signing in as `grandma` opens it.
- The visitor surface is now one repo, the demo game's, which settles most of the coordinator's rate-limit worry;
  S3 keeps a reserve for it.
- The spec's "Without signing in" paragraph (AutomataFramework PR 16) says a visitor opens "a public game whose
  sharing file lets everyone look". It needs the same change; that edit is the coordinator's to arrange.

**B2. "Keep a copy" must give the JSON to paste back** (the Owner, 2026-11-13 22:45: "Export just exports the JSON
so you can paste it back into your agent / file tree"). Task 18 only downloads a file. On an iPad, a download lands
in Files, which is a poor way to get text into an agent's chat. *Fix:* the level screen's export puts the level's
text, exactly `writeContent('level', level)`, on the clipboard, and still offers the file for a file tree:
- Two plain Buttons under the stage, `copyLevel` ("Copy this level") and `copyKeep` ("Save it as a file"). The
  first writes the text with `navigator.clipboard.writeText` and shows `copyCopied`; where the clipboard is
  refused, it shows the text in a read-only box, selected, with `copySelect`. Proposed words (no banned word):
  `copyLevel` "Copy this level", `copyCopied` "Copied. Paste it to your agent, or into your game's files.",
  `copySelect` "Copy the text below, then paste it to your agent or into your game's files.", `copyKeep` "Save it
  as a file", `copyKept` "A copy of this level is on your device."
- `copy.ts` gains nothing new: `levelCopy` already gives the bytes; the clipboard and the file both use them.
- Tests: `levels.browser.test.ts`, both Buttons at least 44 px, on with `canSave` false; `visitor.journey.test.ts`,
  in Chromium, the clipboard holds `writeContent('level', moved)` byte for byte (the others cannot read the
  clipboard in a test, so they check the read-only box's text instead); the download check stays.
- Task 19's `keptCopy` fact counts either Button; `guideSaveVisitor` and `guideDoneCopy` stay true as written.

**B3. Seven of Task 1's rule tests would report two violations, not one.** This is the framework audit's B5 again.
`feature-has-entry` flags a feature folder with no entry file, and the made-up maps put files in
`src/features/access/a.ts`, `game/a.ts`, `ui/A.svelte`, `levels/edit.ts`, `service/a.ts` and `api/a.ts` with no
`access.ts`, `game.ts` and so on beside them. So `imports-go-down`, `through-the-entry`, the Svelte case,
`package-confined`, `api-side-has-no-page`, `page-never-imports-api-side` and `page-calls-only-its-api` cannot
equal `[rule]`. *Fix:* name each offending file after its feature's entry (`src/features/access/access.ts`,
`src/features/game/game.ts`, `src/features/ui/ui.ts` for the Svelte case's partner, and so on), as the framework's
`rules.test.ts` now does, or add the entry file to each map. Keep the framework's "a clean map has no violations"
case too.

**B4. The door would refuse every real page's GET.** Task 7's door starts "not `sameOrigin`, `not-allowed`" on
every route, and `sameOrigin` is "its Origin header is the request URL's origin". Browsers do not send `Origin` on
a same-origin `GET` (the Fetch standard sends it on cross-origin requests and on methods other than GET and HEAD).
So `GET /api/game`, `/api/games`, `/api/waiting`, `/api/change` and `/api/sharing` from the real page would all be
`not-allowed`. The unit tests would not see it, because `tests/fixtures/api.ts` always sends an `Origin`; the
journeys would, at Task 11's first green push. *Fix:* a `POST` must carry `Origin` equal to its own origin (as
Task 4 has it); a `GET` is refused only when it carries a *different* `Origin`. That is enough: the API's sign-in
is a Bearer header the page keeps, not a cookie, so another site cannot borrow it. Add a test: a `GET` with no
`Origin` and a good token opens the game; a `GET` with a foreign `Origin` is `not-allowed`.

**B5. `userExists` calls GitHub with the App's JWT, which GitHub only accepts on the App's own calls.** A JWT works
on `/app/...` and `GET /repos/{o}/{r}/installation`, and GitHub marks `GET /users/{username}` as a call for an
installation's token. With a JWT the real GitHub refuses it, Task 5's `request.ts` turns the 401 into `not-set-up`,
and every "Add" on the Share screen fails on the real site, while the pretend GitHub (Task 6, which answers
`/users/{login}` to the App's JWT) lets CI go green. *Fix:* `userExists` becomes a `Repo` method using the
installation's token (Share always has the repo open). And the pretend GitHub answers a JWT only on
`/app/installations/{id}/access_tokens` and `/repos/{o}/{n}/installation`, and 401 everywhere else, so the two
halves cannot drift apart again. Task 6's `server.test.ts` gets that line.

**B6. The journeys cannot reach the pretend GitHub started in `global-setup.ts`.** Task 11 starts the site and the
pretend GitHub in Vitest's `globalSetup` and hands each journey a live `fake` to change (`fake.person`, `fake.down`,
`fake.repos.get(...)`, `fake.tokensRunOut()`). Vitest runs `globalSetup` in the main process and the test files in
workers: a test can receive only serialisable values (`provide` and `inject`), never a live object. *Fix:* start
both servers in the test worker, once per file, in `openPage`'s first call or a `beforeAll` in
`tests/fixtures/journey.ts` (journeys already run one file at a time, `fileParallelism: false`, on fixed ports), and
stop them in `afterAll`. `global-setup.ts` keeps only what needs no shared state: Task 18's second build into
`dist-plain/`.

**B7. Merging: GitHub's 405 and 409 mean other things than the plan says, and the pretend GitHub copies the
mistake.** GitHub's description of `PUT /pulls/{n}/merge`: 405 "merge cannot be performed" (a clash, *or* a branch
rule the App is not past: required reviews, required checks), 409 "`sha` was provided and pull request head did
not match". The plan makes both `clashes` ("The game changed since this was made... Turn it down and ask for it
again"), which tells a grandpa to throw away a good change when the real cause is a branch rule or a newer save.
And the pretend GitHub answers `rule = blocks-app` with 409 where GitHub answers 405. *Fix:* settle 405 by looking,
like `saveFile`: read the pull again (`GET /pulls/{n}`); `mergeable === false` is `clashes`, otherwise `blocked`.
409 is `changed-elsewhere`, with new words on the change screen: `changeMoved` is taken, so `changeNewer`, "This
change was updated while you were looking. Here is the newest version." and the screen reloads it. The pretend
GitHub answers 405 for `blocks-app` and for a clash (with `mergeable: false` on the pull for a clash), 409 only for
a stale `sha`. Task 9's "the head moved between looking and merging" test expects `changed-elsewhere`.

## Should fix

**S1. A game owned by an organisation has no Owner.** See Q1. The rule "the account that owns the repo is always an
Owner" names an organisation for an organisation's repo, and nobody signs in as an organisation. With no sharing
file, nobody can open Share, so the editor can never be set up for that team without an agent or someone on
GitHub writing the first file. The Owner said a personal account or an organisation "makes no difference", so this
needs his answer before Task 3's `levelOf` and Task 10 are built for organisations. Until then those tasks build
the personal-account case and the organisation case waits.

**S2. "Nobody approves their own".** See Q2. The spec says it plainly; the plan lets Edit and Owner approve their
own waiting change (Task 9, step 3, and its test "grandma and an edit-level person can approve their own"). The
plan's reason is sound (they could have saved straight in), but it departs from the spec without the Owner's word.

**S3. Keep a reserve of GitHub's allowance for the team, even on the demo game.** Every open costs about eight
GitHub calls (the installation, a token, the repo, the sharing file, `automata.toml`, and each content file), and
an App's installation gets about 5,000 calls an hour. After B1 only the demo game takes visitors, but a busy day on
the site's "Try it now" could still use up that installation's hour and stop its own team saving. *Fix:* `request.ts`
reads `x-ratelimit-remaining` and `x-ratelimit-limit` on every installation call; a visitor's open answers `busy`
when less than a quarter is left, while signed-in calls go on. Tests in Task 7 with the pretend GitHub sending the
two headers. A limit per address needs Cloudflare's own rate-limiting rules, which want the site on a domain of
its own: that is M4's.

**S4. A PKCS#1 key cannot be wrapped with a fixed header.** Task 5 Step 4 says the PKCS#1 key is "wrapped into
PKCS#8 by putting the fixed RSA header in front of it". The PKCS#8 wrapper holds two DER lengths that depend on
the key's own length, and GitHub's keys differ by a byte or two. *Fix:* build the wrapper with the lengths worked
out (`SEQUENCE { INTEGER 0, AlgorithmIdentifier rsaEncryption NULL, OCTET STRING <pkcs1> }`). The test makes keys of
2048 and 4096 bits and imports both.

**S5. Scope each installation token to the one repo.** `POST /app/installations/{id}/access_tokens` takes
`repositories` and `permissions`. Without them the token reaches every repo in that installation. *Fix:* send
`{ repositories: [name], permissions: { contents: 'write', pull_requests: 'write', checks: 'read', metadata: 'read' } }`,
and the pretend GitHub refuses a token used on another repo.

**S6. Let the App be the committer.** `saveFile` sends the person as both author and committer. GitHub signs a
commit an App makes through the contents API only when no committer is given, and a team with a "signed commits"
rule would be blocked. *Fix:* send the person as `author` only. The history still says who made the change.

**S7. Save and Approve check the whole game, not one file.** `writeContent` checks the level on its own; whether
each thing's `character` exists in the game is `loadGame`'s check. Since the API trusts nothing the page sends, a
crafted Save could put a level on `main` that makes the game fail to load, which the Examples repo's CI then
fails. *Fix:* Save (Task 8, step 2) and Approve (Task 9, step 4) run `loadGame` over the default branch's files with
the new level in place, and refuse with `broken` and its sentences. One test each, a thing whose character is
`dragon`.

**S8. Two primary Buttons on one screen.** Task 15 shows `signInToSave` "with a primary `signIn` Button" while
Save stays lit as the primary, and Task 20 fails any screen with more than one primary. The `changedElsewhere`
Buttons have no kind. *Fix:* while `signInToSave` shows, Save turns plain; `takeTheirs` and `keepMine` are plain;
`leaveAsk` is a dialog where `leaveNo` is the only primary.

**S9. `signInWhy` is used in Task 11 and defined in Task 19.** Task 11's Welcome puts `signInWhy` under the sign-in
Button, but its words first appear in Task 19's table, and Task 11 has no table. *Fix:* move the `signInWhy` row to
Task 11, with a words table of its own.

**S10. `snap(-0.2)` is `-0`, and the test expects `0` with `toBe`.** `Math.round(-0.4) * 0.5` is `-0`, and `toBe`
tells `-0` from `0`. *Fix:* `snap` adds `0` to its answer (or `keepInside` does it), and the test keeps `toBe`.

**S11. The journeys run without the page's security headers.** `serve.ts` serves `dist/` and does not apply
`public/_headers`, so the CSP (`default-src 'self'`, with no `style-src`) is never in force in CI, and a Svelte or
Pixi need for an inline style or a `blob:` address shows up first on the Owner's iPad. Also, Cloudflare applies
`_headers` to static files only, not to a Function's answers (from memory; Cloudflare's docs are refused here too).
*Fix:* `serve.ts` reads `public/_headers` and sends those headers on every file; each journey fails on any
`securitypolicyviolation` event; and `answer()` sets `X-Content-Type-Options: nosniff` itself.

**S12. The branch rule is the Owner's setup, not an extra.** The Owner's decision: on a team's game repo, `main`
requires one approval and the App is on the bypass list. The plan and `docs/teams.md` call the rule optional ("for
teams that want..."). *Fix:* `docs/teams.md` gives it as a setup step, with what happens without it, and Task 21's
list for the Owner gets it as step 1b for the Examples repo, whose `main` is protected (pull requests only), so an
Owner's Save there is blocked until the App is on the bypass list. That is not an "if".

**S13. `/user/installations` lists more than the games a person owns.** GitHub lists every installation the person
can reach as an owner, a collaborator or an organisation member. The plan says "the games they own" and the
pretend GitHub models only owners. *Fix:* say "the games of theirs on GitHub that have the editor", let the
pretend GitHub give `grandpa` collaborator access to a repo of `grandma`'s, and test that it shows in his list and
opens at the level his sharing row gives.

**S14. A pull's `head.repo` can be `null`** (its fork was deleted). `headIsHere` reads `head.repo.full_name`.
*Fix:* `null` is "not here". One test in `repo.test.ts`.

## Notes

**N1. The Function bundle is small, measured.** At `ec4fddd` the framework's `dist/headless.js` loads Rapier only
through a dynamic import inside physics, and nothing the API uses reaches physics. A stand-in Function importing
`parseContent`, `writeContent`, `parseProject` and `loadGame` came to 181 KB bundled by Vite (Rolldown, minified,
one module, with or without code splitting) and 495 KB bundled by esbuild the way Wrangler does (it keeps more of
Zod), 112 KB gzipped, with no `rapier` and no `pixi` in either. Cloudflare's limit is in megabytes. Task 7's
`bundle.test.ts` is the right guard; it bundles with Vite while Cloudflare bundles with esbuild, so its 1,000,000
byte line has room for the difference. The report for Task 7 should quote both numbers.

**N2. The rest of the GitHub tables are right.** Every other row of Task 5's table and Task 6's matches GitHub's
description: paths, methods, body fields (`ref` and `sha`; `message`, `content`, `sha`, `branch`, `author`;
`title`, `body`, `head`, `base`; `merge_method`, `commit_title`, `commit_message`, `sha`; `state`), the token check
(`POST /applications/{client_id}/token`, Basic auth, 404 or 422 for a bad token), `per_page` and `base` on the pull
list, `?ref=` on the contents read, and the 409 and 422 the contents write gives. GitHub now recommends its
asynchronous merge call over `PUT /merge`; the plan's is still supported and fits M1.

**N3. "Checks (read)" sees check runs only.** A game whose CI reports commit statuses (an older style) would show
`none` and be approvable after two minutes. M1's game uses GitHub Actions, which makes check runs. Say so in
`docs/teams.md`.

**N4. Cloudflare's per-request limits** (from memory: about 10 ms of CPU on the free plan, 50 calls out per request).
An open costs one call per content file, which is fine for M1's three files and not for M3's full game. M3's plan
should read the game's files in one call (GitHub's tree and blob calls).

**N5. The fixture's crate is not where the Examples game's is.** Task 6 says the fixture level is "as the Examples
repo's game has it", with `crate-1` at 6.5. The Examples game (on its execution branch) has it at 9.5 and a second
start point. The fixture is this repo's own and its numbers are consistent through Tasks 13 to 18; drop the
sentence rather than the numbers.

**N6. Add `repository` to `BANNED`.** The whole-word match on `repo` does not catch it, and Global Constraints bans
both.

**N7. Two tabs share one refresh token.** GitHub replaces the refresh token on every refresh, so a second tab
renewing with the old one is signed out. `renew()` should read the kept tokens again first and use them if another
tab has already renewed.

**N8. The first run's `games` should count the games this device remembers.** Otherwise a person who was sent a
link, and later comes back through Welcome, is told to "let the editor open your game" on GitHub.

**N9. For the merge session:** the Owner's check (Task 21, step 4) makes an `automata/<login>` branch and a pull
request on the Examples repo. That is the editor working, not an unrequested branch.

**N10. GitHub supports PKCE for an App's sign-in.** The client secret already stays in the Function, so it is not
needed in M1; worth a line in M4's device-flow plan.

**N11. `docs/deploy.md` should name the build's tool versions** for Cloudflare's build (Node 24 and pnpm 10.34.6, as
the settings Cloudflare reads for them), since the pinned git dependency builds the framework there.

**N12. A visitor's draft is dropped if their own waiting change opens instead.** A visitor who signs in as someone
with a change waiting is shown their own branch, whose version differs, so `takeDraft` says `changed`. Rare in M1;
the words (`draftDropped`) are honest.

## Questions for the Owner

**Q1. Who is the Owner of a game an organisation owns?** (S1)
- (a) The people GitHub lists as the repo's admins count as Owners. The API learns it from the person's own view of
  the repo (`permissions.admin`), with no new permission. Recommended: it is the smallest change, and it is the
  first and only use of a GitHub role.
- (b) Whoever adds the editor to the game first writes the sharing file, so the first Owner is named in it. GitHub
  does not tell an App who installed it without a webhook, so this needs one.
- (c) An organisation's team writes the first `automata.access.toml` by hand or with an agent; `docs/teams.md` says
  how. No code change.

**Q2. May an Edit or Owner level approve their own waiting change?** (S2)
- (a) Yes, as the plan has it: they could have saved straight in anyway. The spec's "nobody approves their own"
  becomes "nobody below Edit". Recommended.
- (b) No, as the spec says: someone else always approves a waiting change.

## Against the spec

| Spec, M1 Editors line (with PR 16) | Plan | Verdict |
|---|---|---|
| The suite shell | Tasks 2, 11, 12 | Covered |
| Using it without signing in, keeping a copy | Tasks 7, 11, 12, 15, 18 | Covered after B1 and B2 |
| GitHub sign-in and save | Tasks 4, 5, 8, 11, 15 | Covered after B4, S4, S6, S7 |
| The five access levels, the Share screen | Tasks 3, 10, 17 | Covered after B5; organisations wait on Q1 |
| Approving in the editor | Tasks 9, 16 | Covered after B7; own changes wait on Q2 |
| The first run | Task 19 | Covered |
| The Levels editor moving the crate, at iPad size | Tasks 13, 14, 20 | Covered after S10 |
| End-to-end tests | Journeys from Task 11 on, in three engines | Covered after B6 |
| Done means (a second person, Suggest level, from a link) | Task 21's list for the Owner | Covered; S12 adds the bypass step |

Constraints: the page talks only to `/api` (a rule and a journey check); the editors change content only (Save
refuses every path but a listed level, Approve every change touching anything else); one writer per file
(`writeContent`, `writeAccess`); Zod only; TOML for the sharing file; 600 lines a file; 44 and 48 px; every word in
`words.ts`, pinned per task; no npm publishing; no secret in the page, the repo or a log. All hold. Languages wait
for M3 with every word in one file, a written reason under principle 6.

## The Owner's three answers (2026-11-13 22:45)

1. Visitors who have not signed in open only the demo game; every other game is its team's. Applied as B1.
2. Export gives the level's JSON, to paste back into an agent or a file tree. Applied as B2.
3. "Try it now" opens the demo game in the editor. The plan already does this (Task 18); B1 renames its setting.
