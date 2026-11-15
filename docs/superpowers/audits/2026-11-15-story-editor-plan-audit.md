# The Story editor plan: audit (stage 3)

Stage 3 of the Story editor's cycle. Written 2026-11-15 on Opus, medium effort, with the project's audit prompt:
"Audit all of your work for completeness, consistency, cohesion, and harmony, both within itself and relative to the
spec and relative to the codebase. Assume nothing. Verify everything. Investigate any incomplete implementations or
incomplete integrations. Do your best work."

What was read: the plan ([`plans/2026-11-15-story-editor.md`](../plans/2026-11-15-story-editor.md), pull request 38),
the spec ([`specs/2026-11-15-story-editor-design.md`](../specs/2026-11-15-story-editor-design.md), pull request 32),
the redesign's spec, plan and zoom amendment, this repo's tracker, framework plan T
(`docs/superpowers/plans/2026-11-14-m2-story.md`) and its pull request 64, framework plan W, the framework's `main`
(`29dd191`), the sound formats spec (AutomataFramework pull request 106, open), and this repo's `main` (`d853073`):
the service, GitHub, access, wire and game features and the test fixtures. Nothing was run: this stage reads
documents and code, and nothing runs locally.

## Verdict

The plan is careful and mostly right. Its numbers agree with its fixture (ten words, `{ ko: 1, ja: 2 }`, the map's
columns, the timeline's reach and lengths all check out against the framework's real schemas), its file layout fits
the architecture rules, and every spec goal and journey has a task. But **two findings are critical and must be
amended into the plan before any task starts**: a Suggest-level person can get words into the game without approval
(C1), and ruling 6 contradicts the Owner's content-folders decision (C2). Twelve important findings need an amendment
before the task they name. One question was the Owner's (I5); the Owner answered A, the App finishes the change itself, and I5 now says how.

The build is gated anyway (G1, the Owner's approval of the mockups of all editors, and G3, plan T on the framework's
`main`), so these amendments cost no time if they land while the gates are closed.

## The plan's two questions

- **Q-A (ruling 7, new lines start in the game's own words): accepted.** It is forced, not chosen. The framework
  refuses a conversation whose line the game's own language lacks (`checkNames` in the framework's
  `src/features/content/conversation.ts:126`, `sourceLacks`), so a new line written only in Korean in an English game
  would not load, and a waiting change that will not load cannot be opened to finish it. Filling English with the
  Korean words is an anti-goal. The notice `storyOwnFirst` with one button is the plainest way through.
- **Q-B (ruling 5, an Owner only through GitHub needs approval once the words are there): accepted.** `enter` makes an
  organization's admin an Owner only by asking GitHub with that person's own token (`src/features/service/enter.ts:167`),
  which `finish` does not have when someone else opens the game. Once the words are there, that person may still
  approve their own change (Approve allows your own change when you may save straight in), so the stamp for them
  should say so (M11).

## Critical

**C1. Adding words lets a Suggest-level person past approval.** Ruling 5 and Task 5 step 2 let anyone who may `save`
add to someone else's waiting change with `into`, limited to messages files and the read marks; Suggest may `save`
(`src/features/access/levels.ts:16`). Task 6's `goesIn` asks only whether the change's *starter* may save straight in,
and `finish` then merges it with no approval. So a Suggest-level person can add words to an Owner's waiting change, and
the same messages files hold every existing word in every language, the game's own included: they can rewrite any
line in the game and it goes in unapproved. That breaks the levels the spec keeps ("The same levels as every other
change").

*Amend Task 5 and Task 6:* `goesIn` is true only when the starter may save straight in **and** every commit on the
branch after its first was made by someone who may (read each commit's author from the branch, against the sharing
file on the default branch, afresh at `finish`). A commit by anyone else turns the change into one that needs
approval, and the page says so (`storyNowApprove`). Add the tests: a Suggest person adds Korean to an Owner's change,
the checks pass, `finish` is 'not-allowed' and Approve by an Approver puts it in; an Edit person's words keep
`goesIn`. Narrowing `into` to "only adds missing keys" is not enough: a waiting words change also carries the
starter's own edits of existing words, which a later commit could change.

**C2. Ruling 6 contradicts the Owner's content-folders decision.** The plan appends one `[[content]]` entry per new
conversation or cutscene, citing Feel's Q4, and asks the Owner before Task 8. The Owner has since decided that each
content kind's folder is listed once in `automata.toml` (the sound formats spec, AutomataFramework pull request 106,
Q6 A: "the project file lists a folder once, so a new sound file needs no new line", with a one-time "Set up sounds"
for an older game), and the coordinator relays that Feel and Sound follow it and Story should too. That spec also
names Feel's per-file listing as the mismatch to settle. Folders are only a spec today: pull request 106 is open, and
no framework plan builds them yet.

*Amend:* ruling 6 becomes "a new conversation or cutscene goes in the game's listed folder for its kind (`folder =
"content/conversations"`, `"content/cutscenes"`), and the save changes no other file; a game that lists no folder for
that kind gets the one-time **Set up stories** card on Story's page, which adds exactly those two folder lines in a
save of its own, as Sound's "Set up sounds" does". Then:

- A new gate, **G6: the framework's content folders on its `main`, and the pin moved to it**, holding Tasks 5, 6, 8,
  12 and 17 (the "Add" cards and the paths they write). Everything else can be built without it.
- `project-line.ts` becomes the folder line: `withFolderLines(text, kinds)` and `onlyAddsFolders(before, after)`,
  and `newFilePath` gives `<folder>/<id>.json` for the listed folder. Task 5 step 3 accepts a new file only directly
  in a listed folder of its kind, named for its id. `readyToGoIn` and Approve (Task 6) read what is listed by
  expanding folders the framework's way (whatever its loader does: one level, file-name order), not by the `path`
  set `listedContent` returns today (`src/features/service/waiting.ts:11`).
- `onlyLists` and the `storyAskAgent` fallback are dropped; ruling 6's "reported to the coordinator for the Owner"
  is answered.
- The CLAUDE.md exception (Task 8) reads "the one-time Set up stories line in `automata.toml`", not one line per file.
- If the framework's folders arrive with messages listed by folder too, `translationProblems` finds a language's file
  by its listed `path` today (`pathsOf`, the framework's `src/features/content/translations.ts:26`); the pin's task
  checks what the framework did and the Words column paths follow it.

## Important

**I1. Three framework names the plan needs are not on plan T's public surface.** `talk-play.ts` (Task 13) consumes
`openAt`, `nextPlace` and `choosePlace`, and G3 lists them as "on `main`". Plan T makes them in `level/talk.ts`, but its
Task 13 list of headless exports names `cameraAt`, `actorsAt` and `linesAt` and not these three, nor `TalkPlace`. If
they stay private, the editor must re-implement how a conversation walks, which the plan forbids. *Amend Task 1:* it
also exports `TalkPlace`, `openAt`, `nextPlace` and `choosePlace` from the headless entry, with the public-surface test
naming them. G3's list then says "on `main`, and on the public surface after Task 1".

**I2. The camera's frame is worked out in the editor, from rules the framework has not set.** `frameAt` (Task 15)
takes the level's `view` divided by the zoom about the camera's middle. How a cutscene's `zoom` turns into what the
screen shows is plan T's Task 11 (`Renderer.look`), which waits for plan A, and the framework's camera shows more of
the level wherever the window is wider or taller than the shot (`placeCamera`, the framework's
`src/features/render/camera.ts:1-3`). So the dashed frame could disagree with the game on every phone. *Amend:* Tasks
15 to 17 wait for plan T's Task 11 on `main` (a new line in G3, or its own gate), and Task 1 asks the framework for the
pure function that gives the shot for a camera key (`shotOf(level, camera)` or whatever plan T's Task 11 names), so
`frameAt` calls it and draws the frame at the window's shape the way the game would. The framework's
`ActorKey.clip` and `face` are already in the format on `main`, so the fields-only clip and facing (ruling 2) can stay.

**I3. The key rule is not in the framework's content skill.** The spec's call says Story's keys follow "the same rule
an agent is told in the framework's content skill". The skill on the framework's `main`
(`skills/automata-content/SKILL.md`, the "conversation" section) shows `keeper.hello`, `hero.ask` and `hero.bye` and
states no rule, so an agent and the editor would make different keys for the same line. *Amend Task 1:* the
framework's pull request adds the rule to the skill (`<file>.<step>.<n>`, `<file>.<step>.choice-<n>`,
`<cutscene>.line-<n>`, step ids from the first words, the next free number), with its docs test, so principle 1 holds.

**I4. A refused branch move is not a changed file.** Task 4 maps a 422 on `PATCH git/refs/heads/<branch>` to
'changed-elsewhere'. GitHub also answers 422 when a branch rule refuses the move, which today's `saveFile` tells apart
by looking (`src/features/github/repo.ts:257-262`). With the plan's mapping, a blocked save says "changed elsewhere",
and "Show the newest" loops. *Amend Task 4:* on a 422, read the branch's head again; moved is 'changed-elsewhere',
not moved is 'blocked'; add that test. In the same task: `POST git/commits` sends the author and no committer, as
`saveFile` does (`repo.ts:246`, so a "signed commits" rule still passes), with a test that the pretend GitHub got no
committer; and a `GET git/trees/…?recursive=1` answer with `truncated: true` falls back to reading each path's version
with `readFile`.

**I5. "It goes into the game when its checks pass" is not true as planned. (Asked of the Owner; answered A,
2026-11-15.)** The spec says "the App puts it in once the game's checks pass". The plan has the page call `finish`
after the last word and retry at 5, 10, 20 and 40 seconds, then wait for someone who may save to open the game's page
or the waiting list. A game's checks take minutes, not 75 seconds (the plan's own stop rule allows an `engines` job 25), so in practice the
change goes in only when someone next opens the editor, maybe days later, while the stamp said `storyGoesInSoon`. The
options:

- **A. The App hears GitHub** (recommended). The Pages Function gains one route for GitHub's `check_suite` event
  (the App already reads checks); when a waiting words change's checks pass, it runs `finish` itself. A settings
  step when the editors are deployed: the App's webhook address and a secret, kept in Cloudflare.
- **B. On sight, with true words.** Keep the plan's mechanism and say what happens: "It goes in the next time someone
  on your team opens the game after its checks pass."
- **C. GitHub's own auto-merge.** The App turns it on for the change; GitHub merges when the required checks pass. Each
  team's repo must allow auto-merge, a setting the App cannot change.

**The Owner's answer (2026-11-15, through the coordinator): A, "App finishes it itself".** *Amend Tasks 6 and 21:*
the Pages Function gains one route, `POST /api/github-hook`, for the App's `check_suite` event (`completed`). It
checks GitHub's signature (`X-Hub-Signature-256`, HMAC-SHA256 of the body with the App's webhook secret, compared in
constant time) before reading anything, and answers 401 otherwise; it trusts nothing in the body but the repo and the
head commit, and for each waiting change whose head is that commit runs the same `finish` rules as `POST
/api/finish` (`goesIn` after C1, `readyToGoIn`, `missingWords` empty, the checks passing, the merge with that commit
only), as the App, with "Finished by the editor" as the merge's message. The page's `finishWhenReady` retries and the
on-sight `finish` stay as the fallback when a delivery is lost. A deploy step joins `docs/deploy.md`: the App's
webhook address (`/api/github-hook`), its `check_suite` subscription, and the secret `GITHUB_WEBHOOK_SECRET` kept in
Cloudflare only; no new App permission (checks read already covers the event). Tests: a signed event finishes a
ready change; a bad or missing signature is 401 and changes nothing; an event for a commit no waiting change has does
nothing; a change still missing words or needing approval is left alone; the journey's "It is in the game now" comes
from the pretend GitHub sending the event when the test sets the checks to passing. `storyGoesInSoon` stays true as
written. Task 21 is no longer held.

**I6. Words changes will often clash with `main`, and the plan says nothing about it.** Every Story save writes the
same few messages files, whose keys `writeContent` keeps in order, so a waiting words change and any later save
straight in will often touch neighbouring lines of the same file. Then `mergePull` answers 'clashes'
(`repo.ts:324`), and the plan's `finish`, its stamps and its waiting list have no state for it. *Amend Tasks 6 and 21:*
say what `finish` and Approve do on 'clashes' and what a person reads. The plainest fix stays inside the plan: since a
messages file is key to text, `finish` lays the change's keys over `main`'s file (each key the change made or
changed, from the change's first commit to its last), writes the merged files to the change's branch with
`saveFiles`, and waits for the checks again; a key both sides changed is the one case shown to a person
(`changed elsewhere`, with both texts). Add a journey: a waiting words change, then an Owner's save straight in that
adds a line next to it; the waiting change still goes in, with both lines.

**I7. An approver cannot see a Story change.** A Suggest person's complete Story change waits for approval, and the
spec's journey has an Approver put it in. Today's waiting change screen draws each changed level before and after
(`showChange`, `src/features/service/waiting.ts:48`); Task 21 changes only its words line and its main button. A
conversation or messages change would show nothing an approver can judge, which fails the drunk-grandma test.
*Amend Task 21:* a waiting change that touches Story's files shows, for each, a plain list ("Keeper: 'Hello there!'
becomes 'Hello, friend!'", "Korean: 3 words written") and a button that opens it in Story at Look on that change
(`?change=<number>`, which Task 8's route already has), and Approve stays where it is. Add it to the Suggest journey
and to Appendix B.

**I8. An Owner's words change catches their World saves too.** `saveLevel` puts every save of someone who has a
waiting change on that change's branch (`src/features/service/save.ts:77-80`), and Task 5 step 2 does the same for
Story. Before Story, an Owner never had a waiting change; now an Owner who adds one line waits for five languages, and
every level they move in World meanwhile joins it and shows World's "waiting" stamp with no reason given. *Amend:*
either say it on World's stamp when `mine.words` is not empty ("Saved into your change that is waiting for words",
one word key and a test in Task 21, named as the one change to World), or explain in the plan why it is acceptable.
The first is recommended; the spec's "does not change World" was about World's screens, not a stamp's sentence.

**I9. The preview's speech box may hear keys typed into the panel.** Task 13's `SpeechPreview` is the framework's live
`createBox` (not `watching`, since it shows the choices) inside an `inert` box, next to the text boxes where a person
types. Plan T says the box "hears its keys in its own `keydown` listener" and uses Enter and the digits 1 to 4, but does
not say where the listener sits. If it is on the window, typing "1" or Enter in a line's text box presses the preview.
*Amend Task 1:* a browser test that keys pressed outside the mount (in a text box beside it) reach no `on` call, and
that an `inert` mount hears nothing; if the framework's box listens on the window, Task 1 scopes it to the mount, which
is a behaviour change to say in its commit.

**I10. Some made ids and keys break the framework's rules.** An id must start with a letter (`ID_PATTERN` in the
framework's `src/features/content/ids.ts`), but `slugOf('3 apples, please')` is `3-apples-please`, so `stepId` and
`fileId` would make an id the framework refuses. And `choiceKey` can pass 96 characters (a 64-letter file id, a
32-letter step, `.choice-4` is 107) while only `lineKey` is said to cut. *Amend Task 7:* a slug that does not start
with a letter drops its leading digits and dashes (else the `step-<n>` or `story-<n>` fallback); `choiceKey` and
`cutsceneLineKey` cut the same way `lineKey` does; tests for both, each result checked against the framework's `Id`
and `MessageKey`.

**I11. A language the game has no file for blocks every save.** Ruling 9 says such a language never makes a save
wait. But Task 5 step 6 refuses a save when `otherWordProblems` (translation problems with missing words filled in)
has any problem, and `translationProblems` gives "This game has no words in Korean" for a missing file
(`translations.ts:51-60`). So the `no-korean` game refuses every Story save, and so does any game whose `main` already
has a translation problem (a button's words of 13 characters an agent wrote). *Amend Task 5:* `otherWordProblems`
leaves out the missing-file sentences, and the save refuses only problems the change adds (those not in the same
check of the target branch before the change, compared by file, path and sentence). Tests: a save in `no-korean`
goes in; a save in a game whose `main` already has a long button word goes in, and one that makes a second one is
refused.

**I12. Story builds its own several-file save; the other editors share one.** Added 2026-11-15 at the coordinator's
word: Feel and Scenes now save through the figure builder's (plan G's Task 2, Editors pull request 43) one route for a
change of several files, `ChangeAsk` and `ChangeFile` in `wire.ts`, `saveChange(api, game, ask)` on the page, and
`saveFiles` on the git data routes in `repo.ts`; and Approve and a waiting change's `here` judge every touched path
with one shared helper, `allowedPaths` in `service/changed.ts` (the Scenes plan audit's E1). Story's plan makes its own
`/api/save-many`, `SaveManyAsk`, `FileSave`, a second `saveFiles` and its own path rules in `readyToGoIn`. Two save
shapes for one job is the incohesion the audit prompt asks about, and two `saveFiles` would drift. *Amend Tasks 4 to
7:* Story saves through `saveChange` and `ChangeAsk`, and widens them only where Story needs more, each named once:

- `ChangeAsk` gains `into?: number` (add to a waiting change), and the answer gains `how: 'words'`, `missing` and
  `goesIn`; a `ChangeFile` of kind `content` covers conversations, cutscenes, messages and characters, and one new
  kind, `read-marks`, holds the marks file (checked through `parseReadMarks` and `writeReadMarks`).
- Task 4 builds nothing new in `repo.ts` if plan G's `saveFiles` is on `main` first; it only adds `lineHistory`.
  Whichever lands first carries I4's fixes (a refused move told by looking, no committer, a truncated tree) and
  Story's versions-on-the-target-branch rule (with `into`, a file's version is checked on that change's branch, not
  the default branch as plan G says).
- `allowedPaths` gains `READ_MARKS_FILE` and, after C2, a new file directly in a listed folder of its kind and the
  one-time folder lines; `readyToGoIn` (Task 6) calls it instead of its own rules. `onlyLists` goes (C2).
- `missingWords`, `otherWordProblems` and the words routing (Task 5 steps 6 and 7) stay Story's, called from the
  shared route when the change touches a messages file. Story's character rule (only `name` and `conversation` may
  differ) and its marks rule stay too, as checks inside that route for those kinds.
- Gate: Story's Tasks 4 to 6 come after plan G's Task 2 is on `main`, or Story's Task 4 builds that shared route as
  plan G describes it, so it is built once (the Scenes audit's rule: whichever cycle builds it first).

## Minor

- **M1.** Task 2 keeps "`pnpm install --lockfile-only`, the one allowed local command". The Owner widened "nothing runs
  locally" on 2026-11-14, and the last pin (Task 7b) worked the checksum out from the downloaded tarball. Do that.
- **M2.** Task 1: the framework repo has `.changeset/` and its export changes carry one (pull request 102's
  `level-picture-view.md`), so a changeset is required, not "if that repo still asks". The API report comes from the
  `package` job's log, as plan T's Task 13 says, not by hand.
- **M3.** Task 1 says "exactly as plan T's Task 9 made them" but writes `on: BoxPress` and an optional `words`; plan T
  has an inline `on` type and a required `words`. Either keep plan T's shape or name the change.
- **M4.** Plan T's `wordsOf` falls back to English; plan W (merged) says no language is a fallback. G3 should check that
  plan T's build falls back to the game's own language, so `boxAt`'s "as the game does" holds.
- **M5.** `blobSha` hashes `blob <length>\0` then the bytes; the length is the UTF-8 byte count, not the string's. Add
  a Korean test beside `hello\n`.
- **M6.** Ruling 17 remembers the last thing opened for this visit only; the spec said "on this device". Name it as a
  deviation (the spec's own reason, no new setting, holds).
- **M7.** A choice's words may be 2,000 characters. Say the chip's widest size and that it wraps (still "no cut, no
  ellipsis"), and add a long choice to Task 10's property maps and Task 11's browser test.
- **M8.** Ruling 3 routes lines with square corners; the spec says a line going back "curves round". Either is fine
  if no line crosses a card; the approved mockup settles it (G1's amendment).
- **M9.** Task 6: say which branch `/api/words-history` reads with `?change=` (the change's branch, so the starter's
  new words show as theirs), and that GraphQL has its own allowance, which `repo.allowance()` does not see; a visitor
  at the demo game gets history only when the REST allowance is above the reserve.
- **M10.** In a game whose `main` already lacks words, every Story save waits, even one that changes no word in those
  languages. That follows the spec; the stamp should then say "Waiting for words the game was already missing", so a
  person is not puzzled.
- **M11.** For Q-B's person, the stamp after the last word says "Now you can approve it" rather than "Now someone
  approves it".

## Checked and found right

- The format's limits the plan uses are the framework's: 1 to 8 lines a step, 2 to 4 choices, 128 steps, 2,000
  characters a text, 3,600 ticks, zoom 0.25 to 4, ids at most 64, message keys at most 96
  (`conversation.ts`, `cutscene.ts`, `messages.ts`, `shared.ts`).
- "Nothing leads to this step" and the loop sentence are the framework's own checks, so `checkStory` shows them on
  the card as the spec asks; Review Focus 3's "two steps that point at each other" is the loop sentence.
- `markRead` refuses the game's own language, so Task 20's "tick on the game's own language changes nothing" must
  guard before calling it, as the test says.
- `writeContent('messages', …)` checks that a messages file's `id` is its language, which Task 5's "a file's `id` must
  match its file name" covers.
- Approve and `saveLevel` (`approve.ts`, `save.ts`) are as Tasks 5 and 6 describe them; `mergePull` merges with a merge
  commit, so blame keeps each line's real author for ruling 13.
- The App's permissions (contents write, pull requests, checks read, `docs/deploy.md`) cover the git data calls and
  the GraphQL blame. Option A of I5 needs no new permission, only a webhook.
- The fixture's numbers agree across Tasks 3, 5, 8, 9, 10, 13, 14, 15 and 18.
- Every spec journey has a task; every Appendix A word belongs to a task; the gates cover every name taken from the
  redesign and from plan T, except those in I1 and I2.

## What the plan must change before which task

| Finding | Amend before |
|---|---|
| C1, C2 | any task (C2 adds G6) |
| I1, I2 (Task 1's part), I3, I9, M2, M3 | Task 1 |
| M1 | Task 2 |
| I4, I12, M5 | Task 4 |
| I11, I12, C2's paths | Task 5 |
| C1, I6, I12, M9 | Task 6 |
| I10 | Task 7 |
| M6 | Task 8 |
| M7, M8 | Tasks 10 and 11 |
| I2 (the gate) | Task 15 |
| I5 (the Owner's answer A), I6, I7, I8, M10, M11 | Tasks 6 and 21 |

The plan stage (or a short amendment session) writes these into the plan; this audit is then its record.
