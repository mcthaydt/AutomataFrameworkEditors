# The Sound editor: plan audit

Stage 3 of the workflow, for [`plans/2026-11-15-sound-editor.md`](../plans/2026-11-15-sound-editor.md) as written in
`5a023b1` (PR 39), against its spec, [`specs/2026-11-15-sound-editor-design.md`](../specs/2026-11-15-sound-editor-design.md)
(PR 33), AutomataFramework's sound formats spec and plan M (PRs 106 and 112, audited beside this one in
`docs/superpowers/audits/2026-11-15-plan-m-plan-audit.md` there), the plans that overlap it (the Feel, Story and
Scenes editor plans, PRs 35, 38 and 37; AutomataFramework's plans G, F, R and the scenes slice 1, PRs 107, 111, 109
and 113, and the figure audit, PR 117), the redesign's spec and plan, plan H's build on its branch (AutomataFramework
PR 101), and the code on `main` at `8fdb2e4`. Written 2026-11-15.

**Verdict:** sound, and ready for stage 4 once the fixes below are in, which they are, and once its gates are true
(the Owner's yes to the mockups, the redesign built, plan M merged and pinned). It is a thorough plan: every
anti-goal has a test, the framework does all the music maths, and the screens are built on the redesign's parts by
their planned names. One critical fault was found (Task 1 would have broken every journey), seven important ones
and five minor ones; all are fixed in the plan, and two lines of the spec are amended.

How it was checked: the spec and the plan were read whole, plan M beside them. On `main`: `wire/wire.ts`
(`OpenAnswer`, `SaveAsk`, `WirePicture`), `github/repo.ts`'s exports, `game/open.ts` and `service/whole.ts` (both
call `loadGame(read)`), `suite/route.ts` (the address forms), `public/_headers`, `tests/fixtures/banned.ts`, the
fixture folders, `CLAUDE.md`, and how World shows the framework's problems (`GameHome.svelte`, `LevelScreen.svelte`).
In the redesign's plan: Task 19's `startPlay`. On AutomataFramework's `main`: `level/touch.ts` (how touch events are
named), `content/sound.ts`, `cues.ts`; on plan H's branch, `level/moves.ts`. Nothing was run (GitHub CI only).

## The planner's four flagged calls

1. **"MIDI" is never on a screen.** Holds: the spec bans the word and also named two buttons with it, so the ban
   wins and the spec's Music bullet is amended to the plan's words ("Bring in a music file", "Save for other music
   apps"). `.mid` under them is a file ending, not the word, and the banned-word test (whole words) passes it. It
   was not yet true, though: the framework's refusal and `dropped` sentences say "MIDI" and would have been shown
   as they are (I3).
2. **"Try another" only for a sound made in this visit.** Holds: a kept kind would be a setting kept outside the
   files, an anti-goal. One small fix: a second Jump started at seed 0 again, giving the first one's very voices
   (M1).
3. **A format 1 song is turned into loops, not edited.** Holds, as one undo step; it is lossy (waves become Keys or
   Bass, every drum hit a snare, steps off the sixteenths move), so its panel now says so before it is kept.
4. **One save for every editor.** Right, and wider than the plan knew: the Story plan (`/api/save-many`, its own
   folder-line writer) and the Scenes plan (`Repo.saveFiles`) plan the same pieces as Feel's Task 13 and this
   plan's Task 2. Settled in I4.

The Owner's decisions hold throughout: it opens on the level with sound chips (Tasks 4, 7); a kind, Try another and
plain sliders (Tasks 5, 8, 9); loops and whole chords at a press, motifs made easy (Tasks 15 to 18); MIDI both ways
(Task 19); recordings at 10 s / 1 MB each, 20 MB a game (Tasks 13, 14, the framework's limits); every kind's folder
listed once, with "Set up sounds" (Tasks 2, 11); and nothing is built before the mockups are approved (Global
Constraints, "Before starting" 1).

## Critical

**C1. Task 1 gave the fixture game folder lines before anything could list a folder.** At the pin of plan M,
`loadGame` refuses a game that lists a folder when it is not given a `list` ("This game lists folders, so whoever
loads it must be able to list them."), and the page's `game/open.ts` and the API's `service/whole.ts` only learn to
list in Tasks 2 and 3. Task 1's own step said "green, every existing journey as before", which could not be: every
journey opens the fixture game. **Fixed:** Task 1 lists the new files by path; Task 3's new Step 4b turns them into
the five folder lines once both sides list, and the full suite runs there.

## Important

**I1. Play made no sound.** The spec says Play "plays the level with its sounds and music", and Tasks 9, 16 and 20
read "the game's own cue log" after Play, but the redesign's `startPlay` makes no audio and no task gave it any.
**Fixed:** Task 9 gives `startPlay` the game's audio (`createAudio`) over the one `Hear`'s speaker (a new
`Hear.speaker()`), so there is never a second speaker; the chips hide while it plays; Play stops what Sound played;
Task 14 adds the recordings (`loadRecordings`). Tested.

**I2. The chip rule did not match how the framework names events.** A built-in hero's events are `hero.<name>`
whatever the hero character's id (plan H's `moveEvent`), and a touch event is named after the touched character's
`kind` (`level/touch.ts`), not its id. "The character whose id is the first word" would put no chip on a hero called
`fox` and none on a coin whose `kind` is `coin` but whose id is `gold-coin`. **Fixed:** ruling 9 (and the spec's
rule, amended): `hero` is the project's hero; else a character whose `kind` it is; else one whose id it is; else
"Whole game".

**I3. The framework's English reached a person's screen.** The MIDI panel showed `midiToMusic`'s refusal and
`dropped` sentences as they are ("This is not a MIDI file…"), "Name your own" showed the framework's sentence
("Write the event's name…"), and the recordings' limit showed the framework's sentence: English only, against the
nine-languages rule, and two of them hold banned words ("MIDI", "event"). **Fixed:** new ruling 27; plan M now gives
codes (`MidiDropped.what`, `why`), and Sound says each in its own words (new Appendix A rows). World's existing
"this game's files are broken" notice stays as it is.

**I4. Four plans planned the same save.** This plan's Task 2 (`POST /api/files`, `commitFiles`, `setUp` as
type and folder pairs), the Feel plan's Task 13 (adding a folder line by itself on the first save), the Story plan
(`/api/save-many`, `Repo.saveFiles`, and `withFolderLine`, an editors-side writer whose bytes differ from the
framework's) and the Scenes plan (`Repo.saveFiles`, and the framework's `listContent` for a path block). **Fixed
here:** this plan uses `Repo.saveFiles` (the name and shape Story and Scenes share, `base64` for bytes), keeps one
`POST /api/files`, takes `setUp` as kinds from one `SET_UP_FOLDER` table in `wire.ts` for every editor, and writes a
folder line only with the framework's `withFolders`. The coordinator is told, so the Story, Scenes and Feel plans
follow when they are next amended.

**I5. A brought-in song could never be saved.** Ruling 23 held a change to 20 files, but one MIDI file can make far
more loops than that and cannot be cut in two. **Fixed:** with plan M's fix (I7 there: about one loop each eight bars
of a lane), ruling 23 lets a brought-in song or a song turned into loops be one step of up to 200 files, refused at
its panel over that (`music.too-big`); the API's cap is 200 writes.

**I6. `CLAUDE.md` says an editor writes only JSON content files.** Sound writes `.wav` files and, once, folder lines
in `automata.toml`. **Fixed:** Task 11 widens the line in the same pull request (the Feel plan's Task 13 does the
same; one sentence survives). The Examples repo's matching line is in plan M's handoff.

**I7. The hero's eighth event had no words.** `MOVE_EVENTS` has eight names (`left-ground` too), and Task 10's test
wants words for every one, but ruling 10 and Appendix A had seven. **Fixed:** "When the hero leaves the ground".

## Minor

- **M1.** A new sound starts at the first seed whose voices no sound in the game has, so a second Jump is a new one.
- **M2.** `SOUND_FOLDERS` was "the five lines of rule 2", which lists six. Now the five kinds, named.
- **M3.** `api.recording` answered a `WirePicture` for a `.wav`. Now `WireBytes`, with `WirePicture` its alias.
- **M4.** The fixture's `crate.landed` is a name the framework never raises; ruling 26 now says so, so no journey
  waits to hear it.
- **M5.** The spec's "Sound's chips hide while it plays" had no test; it is in Task 9's now.

## For the coordinator

- The Story plan's `withFolderLine` and `/api/save-many`, and the Scenes plan's path block per scene (where the
  Owner's rule is one folder for every kind), should follow I4 and plan M's call 26.
- The Feel plan's Part 3 gap G2 (how a folder is read through `/api`) is answered by this plan's Tasks 2 and 3.
