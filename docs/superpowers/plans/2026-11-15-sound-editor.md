# The Sound Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.
> Steps use checkbox (`- [ ]`) syntax for tracking. No subagents (project rule). Tests run only in GitHub-hosted CI:
> "run" in a step means push and read the pull request's checks with `gh pr checks <number> --watch`.

**Goal:** A person chooses Sound on their game's level, taps the note on the hero and hears its jump, makes a new
sound in three presses (a kind, "Try another", what sets it off), records one of their own, builds a song by pressing
loops and chords, taps out a motif and reuses it, and saves all of it into the game as the framework's own files.

**Architecture:** Sound is a new page-side feature, `sound`, above `levels` (and above `feel` when it is there),
below `find`. Everything it knows about a sound comes from the framework (`makeSound`, `soundVoices`, `playSound`,
`scoreOf`, `notesOf`, `chordName`, `LIBRARY`, `libraryFiles`, `midiToMusic`, `musicToMidi`, `writeRecording`,
`readRecording`); it holds only the words, the edits and the screens. A change is a small set of whole files (a
sound and the cue list that names it; a song and the loops it uses) in an undo list. Everything is heard through one
`webSpeaker`, the game's own. Save sends the set as one saved change; the API writes the framework's bytes, lists a
game's folders, and adds the folder lines once ("Set up sounds").

**Tech stack:** as the redesign (Svelte 5, strict TypeScript, Vite 8, Vitest 5 in Node, three browser engines and
journeys on Playwright, `@automataframework/framework` pinned by commit, Cloudflare Pages Functions for `/api`).
**No new dependency:** recording is the browser's own `getUserMedia` and `MediaRecorder`, decoding is its own
`decodeAudioData`, drawing is page elements and SVG.

**Spec:** [`docs/superpowers/specs/2026-11-15-sound-editor-design.md`](../specs/2026-11-15-sound-editor-design.md).
The frame is the redesign's: its [spec](../specs/2026-11-14-editors-blueprint-redesign-design.md) and
[plan](2026-11-14-editors-blueprint-redesign.md), whose Global Constraints, rulings, test hooks and "Review pictures"
all hold here and are not repeated. The files are the framework's: AutomataFramework's
[sound formats spec](https://github.com/mcthaydt/AutomataFramework/blob/main/docs/superpowers/specs/2026-11-15-sound-formats-design.md)
and its [plan M](https://github.com/mcthaydt/AutomataFramework/blob/main/docs/superpowers/plans/2026-11-15-sound-formats.md).
Principles served: 2 (touch first: nothing here needs a mouse, a keyboard or a music lesson) and 1 (every press ends
as a documented file an agent can read).

## Global Constraints

The redesign plan's "Global Constraints" hold word for word (identity and the author hook, nothing runs locally, at
most five branches, the strict header, sizes and touch sizes, colors, type, panels, motion, words only in
`src/features/words/`, nine languages in one order with none a fallback, the canvas draws the game and nothing else,
end-to-end journeys at five sizes in three engines, the stop rules). Added by this plan:

- **Mockups first** (the Owner, 2026-11-15: "Do a mockup for all editors first before we do any code"). No task in
  this repo starts until the Owner has approved the editors' mockups (`docs/mockups/sound-sounds.html` and
  `sound-music.html` among them). If the approved Sound mockups differ from the spec's screens, this plan is amended
  and audited again before Task 1. AutomataFramework's plan M does not wait.
- **The framework and the demo game stay ahead of the editors** (the Owner, 2026-11-14). A session that could build
  either plan M or a task here builds plan M.
- **No new dependency.** If a task seems to need one, stop and report.
- **Sound writes only these kinds of file:** `sound`, `cues`, `music`, `loop`, `motif`, each as the framework's
  `writeContent` writes it; a recording, as the framework's `writeRecording` writes it; and, once a game, the
  framework's folder lines in `automata.toml` (`withFolders`). It reads levels and characters and never writes them.
- **Nothing about a sound is worked out here that the framework works out.** No file in this repo turns a chord
  into notes, a step into a pitch, a loop into a score or a kind into voices. `tests/architecture/rules.ts` gains
  the rule: under `src/features/sound/` no `Math.pow`, no note-name table and no hertz table (Task 4).
- **Every slider's place is worked out from the file** each time it is drawn. Nothing but the files (and the undo
  list of whole files) holds a sound's state.
- **Sound never plays on its own.** Nothing is heard before a person's press, one thing plays at a time, Stop is one
  press, and leaving Sound stops everything. A test in every task that plays holds this.
- **A recording never touches the device's storage.** Not `localStorage`, not IndexedDB, not a cache. A test reads
  every store after a recording is made and finds nothing.
- **No word on a screen says** "event", "cue", "hertz", "MIDI", "waveform", "sample rate", "repo", "commit",
  "branch", "pull request" or "token" (the spec). `tests/fixtures/banned.ts` gains the first six for Sound's words.
- **The device keeps** what the redesign allows, plus nothing new: Sound's draft is an `af.draft:…`, its tips are
  `af.tip.sound`, `af.tip.music`, `af.tip.motif`, and its first run is its own entry in `af.guide.done`.
- **Tracker.** `docs/superpowers/progress.md`, "The Sound editor cycle". Stage 4's 60 points: Tasks 1 to 20 are 3
  each.

## Before starting: what must be on `main`

Written in the tracker when each is true. Task 1 does not start before all of 1 to 5.

1. The Owner has approved the editors' mockups (above).
2. The redesign's Tasks 1 to 18 are merged here (the frame, the find bar, nine languages, the scenes), and its
   Task 19 (Play) with AutomataFramework's plan H.
3. AutomataFramework's plan M is merged (all of it; Part 1 here uses its Tasks 1, 2, 11 and 12, Part 2 its Tasks
   3, 9 and 10, Part 3 the rest).
4. This plan's audit is merged.
5. The Feel editor's plan is read as it is on `main` then: if its Task 2 (`EDITABLE`, `game/files.ts`) or its Task
   13 (a commit of several files) is built, Task 2 and Task 3 here **widen** those files and keep their names; if
   not, they are built as written here, and Feel's tasks widen these. One save path, whichever editor is first.

**What this plan takes from the redesign as built** (names from its plan; Task 1's first step checks each on `main`
and reports any that differs before building on it): `Frame`, `Pill`, `Cluster`, `Switcher`, `ComingSoon`, `Panel`,
`Sheet`, `Handle`, `Tool`, `Chip`, `Stamp`, `Notice`, `TitleBlock`, `Tip`; `Stage` with its `layer` snippet and
`Fit`; `shapeOf`, `roomFor`, `roomWith`; `panels.ts`; `commandsFor`, `COMMAND_KINDS`, `FindFacts`, `FindDoes`;
`guide.ts`; `scenes.ts` and `broken`; `levels/play.ts` (`canPlay`, `startPlay`). From the Feel plan, when built:
`Slider.svelte`.

**What this plan takes from the framework at plan M** (Task 1 checks each export exists at the pin):
`loadGame(read, list)`, `withFolders`, `FolderRef`, `parseProject` (with `folders`), `makeSound`, `SOUND_KINDS`,
`LIBRARY`, `LIBRARY_LANGUAGES`, `libraryName`, `libraryFiles`, `writeRecording`, `readRecording`,
`recordingProblems`, `RECORDING_MAX_SECONDS`, `RECORDING_MAX_BYTES`, `RECORDINGS_MAX_BYTES`, `soundVoices`,
`soundSeconds`, `playSound`, `createMusicPlayer`, `scoreOf`, `notesOf`, `loopNotes`, `motifNotes`, `motifBeats`,
`blockBars`, `chordOf`, `chordName`, `KEYS`, `INSTRUMENTS`, `DRUMS`, `midiToMusic`, `musicToMidi`, `webSpeaker`
(with `keep`), `testSpeaker`, and the types `Recordings`, `SongParts`, `PlainNote`, `MidiSource`, `MotifChanges`,
`SoundKind`; and plan H's `MOVE_EVENTS`.

## The Owner's answers this plan builds

Q1 A (opens on the level, a chip on each thing that makes a sound, "Whole game", music in the title block), Q2 A (a
kind, Try another, plain sliders, "Every detail"), Q3 (loops and whole chords at a press, motifs made easy), Q4 B
(recordings: microphone or file, 10 seconds and 1 MB each, 20 MB a game), Q5 A (the framework's formats first; MIDI
to JSON and back), Q6 A (a folder listed once; "Set up sounds"). The Owner settled the spec's flagged mismatch on
2026-11-15: Feel lists its folder once too, so both editors use the same folder lines and the same save.

## Rulings made by this plan

The spec leaves these to the builder, or is silent. The plan audit may challenge each.

1. **Sound has its own address:** `#/game/<owner>/<name>/sound/<level>`; a song's screen is
   `…/sound/<level>/music/<track>`, a motif's `…/sound/<level>/motif/<id>`. The switcher keeps the level.
2. **Switching editors never asks "Leave without saving?"**, as in Feel, with one exception: an unsaved recording
   is in memory only, so leaving Sound's address with one asks (the spec).
3. **A change is whole files.** Sound's undo list holds, for each step, the files it wrote and the files it took
   away. Undo puts the earlier files back. Nothing is ever a patch.
4. **Where a new cue goes:** into the game's first cue list by id; a game with none gets `cues.json` in the cues
   folder. A cue for music replaces the one that already changes the music for that happening (the framework allows
   one).
5. **Where a new file goes:** the first folder `automata.toml` lists for its kind. Its name is the kind (or
   "motif", "song", "loop") made free with `-2`, `-3`.
6. **"Try another" is offered for a sound made from a kind in this visit,** since the file does not remember its
   kind and nothing else may. Any other sound's card offers "Start again from a kind", which opens the tray and
   replaces the voices (Undo brings them back). "Try another" counts seeds up from the one that made the sound.
7. **The four sliders,** each a place from 0 to 1 worked out from the file, each press a step:
   - **Higher or lower:** the place is the loudness-weighted middle pitch of the tones and hisses, on a scale of
     octaves from 60 to 6000 hertz. A step multiplies every pitch by a semitone (1.0595 up, 0.9439 down), held to
     20–20000 and written to one decimal. A recording voice's `speed` takes the step instead (0.5 to 2); a motif
     voice's `shift` moves by one.
   - **Longer or shorter:** the place is the sound's end on a scale from 0.02 to 10 seconds, in doublings. A step
     multiplies every `at` and `length` by 1.1 or by 1/1.1, written to three decimals, never past 10 seconds; a
     recording never past its file; a motif voice's `tempo` moves by 10 the other way.
   - **Louder or softer:** the sound's own `volume`, a step of 0.05.
   - **Rougher or smoother:** each voice has a rank (sine 0, triangle 1, square 2, sawtooth 3, hiss 3); the place is
     the loudness-weighted mean rank over 3. Rougher moves the smoothest tone one wave rougher; when every tone is a
     sawtooth it raises each hiss by 0.1, adding one hiss (at the middle pitch, the sound's length, 0.2) when there
     is none and room for it. Smoother is the same backwards. A sound of recordings and motifs only has no such
     slider.
   A drag on a slider is as many steps as bring the place to the thumb, and is one undo step.
8. **The picture of a sound** is SVG: one bar a voice from `at` for `length`, drawn from its start pitch to its end
   pitch on the same octave scale; a hiss as a hatched bar; a recording as its wave (120 points, the loudest sample
   of each slice); a motif as its notes' steps. The moving line is CSS, timed from the press.
9. **Which thing a chip sits on** follows the spec's rule, with the places settled: a chip sits above its thing,
   with World's leader line; chips that would overlap stack upward; a thing off the screen has no chip until it is
   on it. `events.ts` (Task 4) is the one place that knows which happenings exist.
10. **The happenings offered** are, in this order: the built-in hero's (plan H's `MOVE_EVENTS`, only for a hero with
    `moves`, each move only if it is on); for every character with `touch`, `<kind>.touched`, `<kind>.left` and for
    `take` `<kind>.taken`; `level.started`; every name the game's cue and feel files already use; then "Name your
    own". A name with words is shown as the words; any other as the name itself.
11. **Erasing** a sound takes away the cues that name it, and a recording file no other sound names. Erasing a loop
    or a motif that a song or a sound still uses is not offered: its card says where it is used.
12. **A song written as rows of notes** (music format 1) opens with Play and one button, "Turn it into loops",
    which rewrites it as format 2 through the framework's own `musicToMidi` then `midiToMusic` (one undo step).
    Nothing else edits a format 1 song.
13. **The chord buttons** for a bar are the key's seven (`I ii iii IV V vi vii°`, or the minor key's), the six
    that fit first and the diminished one last and smaller, each showing `chordName`. "More" adds `7` and `sus4` of
    the picked one. "Try a progression" offers four: `I V vi IV`, `I vi IV V`, `vi IV I V`, `I IV V IV` (in a minor
    key `i VI III VII`, `i iv v i`, `i VII VI VII`, `i iv VII III`), filling from the picked bar, repeating to the
    song's end.
14. **A pressed loop** goes into the first lane whose instrument suits it (a drum loop: a `drums` lane; a bass
    loop: `bass`; chords: `keys`, `pad` or `organ`; melody: any other), at that lane's first free bar, for the loop's
    own bars; with no such lane and fewer than eight, a lane is added with the first suiting instrument; with a full
    song the tray says "This song is full. Make it longer, or take a block out." A song starts at 8 bars and "Make
    it longer" adds 4, up to 128.
15. **A library loop is copied into the game the first time it is used,** under its own id; if the game already has
    a loop of that id with other notes, the copy is `<id>-2`.
16. **The motif keyboard** shows steps 1 to 10 of the key (an octave and a bit) as ten keys at least 56 px wide,
    lowest left; on `narrow` upright it is two rows of five. A tap adds a note of one beat. "Even out" rounds every
    note to a half beat. The strip's dots can be held (longer by a quarter each 300 ms), dragged a step, or moved
    with − and +.
17. **"Play it when…" for a motif** makes a sound whose one voice is the motif (`pluck`, the song's key or `C`,
    tempo 120) and its cue. The one-press changes on that card rewrite the voice's `shift`, `speed`, `mode` and
    `backwards`; in a song they rewrite the block's.
18. **"MIDI" is never on a screen** (the spec's own words rule), so the spec's two buttons read "Bring in a music
    file" and "Save for other music apps", each with `.mid` in small type under it; the file picker takes `.mid`
    and `.midi`.
19. **A recording is taken with `MediaRecorder`** and turned into samples with `decodeAudioData`, then
    `writeRecording`. Silence (under 1% of full, for more than 20 ms) is cut from both ends when it is kept. A
    brought-in file is decoded the same way; over 10 seconds, its first 10 are opened.
20. **The page asks for the microphone with one header line** in `public/_headers`:
    `Permissions-Policy: microphone=(self)`. The content rule is unchanged.
21. **What is heard is logged in the journeys build:** `hear.ts` wraps its speaker so that, when the redesign's test
    hook is on, every voice played and every stop is appended to the hook's list. Journeys read that list and never
    listen.
22. **A waiting change that touches Sound's files** shows the level with its chips and a panel listing each file:
    "New sound: Jump", "Changed: Meadow", "Taken away: Thud", each with Play for Before and After where there is
    one.
23. **A change holds at most 20 files and 5 MB of recordings.** More, and Save says "That is a lot at once. Save
    what you have first." before anything is sent.
24. **The eight other languages are written by the building session** under the redesign's ruling 9 (tests, then
    the drunk-grandma audit's back-translation). This plan fixes the English (Appendix A).
25. **Loop and style names come from the framework** (`libraryName`, nine languages); a game's own loop, motif,
    sound or song is shown by its id with dashes as spaces and a capital ("hero-theme" reads "Hero theme"), the
    developer's own word otherwise untouched.
26. **Test games:** the fixture game gains the folder lines, three sounds (`jump`, `land`, `thud`), a cue list and
    the library's `calm` song as `meadow`; `plain-game` stays with no sound and no folder lines (the "no sounds
    yet" and "Set up sounds" game); a new `old-song-game` holds one format 1 track and lists its files by path.

## Review Focus

Inputs the spec implies and a person will meet. Each has its test in the task named.

1. **A game whose cue list an agent wrote by hand** (two lists, a happening answered in both, a cue for a sound
   that is not a thing's): every cue shows on a chip or under "Whole game", none twice, and a change to one rewrites
   only its own list. Task 4, `cues.test.ts`.
2. **A sound an agent wrote that no slider step can reach** (a pitch of 20 hertz, eight voices, a length of 10
   seconds): each slider shows its place, a step that cannot move says nothing and writes nothing, and no file is
   ever refused by the framework after a press. Task 5, `shape.test.ts`.
3. **The microphone refused, taken away mid-recording, or a device with none; a file that is not sound at all:** one
   plain line and the other button, never a blank tray or a spinner. Task 13, `record.browser.test.ts`.
4. **The files changed elsewhere while a person worked** (an agent renamed the loop a block uses, or saved the same
   sound): Save says so with World's notice; the draft is not laid over the new files; a block whose loop is gone
   shows "This loop is missing" and can be taken out. Tasks 11 and 16.
5. **A second Play while one plays, Play then leave, Play with the sound off on the device:** the first stops; leaving
   stops it; the button says "Tap to hear" until the speaker is on and never spins. Task 6, `hear.test.ts`.

---

## File structure

Layers, lowest first: `words`, `access`, `wire`, `exchange`, `github`, `service`, `ui`, `api`, `session`, `game`,
`levels`, (`feel`,) **`sound`**, `find`, `suite`. Task 4 adds `sound` to `LAYERS` and `PAGE_SIDE` in
`tests/architecture/rules.ts`.

```
src/features/wire/wire.ts            EDITABLE + sound, cues, music, loop, motif; FileWrite, FilesAsk, FilesAnswer;
                                     OpenAnswer.folders; RecordingAsk                               Task 2
src/features/github/repo.ts          commitFiles (several files, one commit), listFolder, readBytes  Task 2
src/features/service/files.ts        the save of a change of several files                           Task 2
src/features/service/open.ts         folder files, and the folders' names                            Task 2
src/features/service/recording.ts    one recording's bytes                                            Task 2
src/features/game/change.ts          Change, saveChange, drafts and copies of a change               Task 3
src/features/game/open.ts            loadGame with the folders the API listed                         Task 3
src/features/sound/
  sound.ts                           the feature's entry                                              Task 4
  events.ts                          the happenings a game has, and their words' keys                 Task 4
  cues.ts                            which thing a sound belongs to; add, change, remove a cue        Task 4
  edits.ts                           the undo list of changes; new, duplicate, erase, rename          Task 4
  shape.ts                           the four sliders (ruling 7)                                       Task 5
  picture.ts                         a sound as shapes to draw (ruling 8)                              Task 5
  hear.ts                            the one speaker: hearSound, hearTrack, hearNotes, stop           Task 6
  setup.ts                           is this game set up for sounds; the folder lines                 Task 11
  record.ts, trim.ts                 the microphone, a brought-in file, silence, the trim              Task 13
  arrange.ts                         every edit of a song (ruling 14)                                  Task 15
  chords.ts                          the chord buttons and progressions (ruling 13)                    Task 15
  motif.ts                           a motif's edits, its uses, where it is used                       Task 18
  midi.ts                            in and out, through the framework                                 Task 19
  Sound.svelte                       the editor: panel, chips, card, undo                              Task 7
  SoundsPanel.svelte, SoundChips.svelte, SoundCard.svelte, SoundPicture.svelte,
  KindTray.svelte, WhenPicker.svelte, EveryDetail.svelte                                              Tasks 7 to 10
  RecordPanel.svelte, TrimPanel.svelte                                                                Tasks 13, 14
  MusicScreen.svelte, ChordRow.svelte, Lane.svelte, LoopTray.svelte, LoopGrid.svelte                 Tasks 16, 17
  MotifKeys.svelte, MotifCard.svelte                                                                  Task 18
src/features/words/                  Appendix A, in nine languages                                    each task
src/features/suite/                  the route, the switcher's Sound, SoundScreen.svelte (save, export, guide)
public/_headers                      the microphone line                                               Task 13
docs/making-sounds.md                the page for agents: every file Sound writes, and the commands   Task 12
tests/                               mirrors the above; tests/fixtures/old-song-game/ NEW
```

---

# Part 1: sounds, and what plays when

## Pull request 1: the pin, the test games, the save

### Task 1: The framework at plan M, and games with sound

**Files:**
- Modify: `package.json`, `pnpm-lock.yaml` (the pin, as the redesign's Task 1 did it),
  `tests/fixtures/game/automata.toml`, `tests/fixtures/fake-github/repos.ts`
- Create: `tests/fixtures/game/content/sounds/{jump,land,thud}.json`, `content/cues/cues.json`,
  `content/music/meadow.json`, `content/loops/*.json`, `tests/fixtures/old-song-game/` (ruling 26)
- Test: `tests/fixtures/game.test.ts`, `tests/workflows/package.test.ts`

**Interfaces:**
- Produces: the framework at plan M's merge commit. The fixture game lists folders for `sound`, `music`, `loop`,
  `motif` and `cues`; `jump` is `makeSound('jump', 0)`, `land` is `makeSound('land', 0)`, `thud` is
  `makeSound('hit', 0, 'thud')`; its cues: `hero.jumped` plays `jump`, `hero.landed` plays `land`, `crate.landed`
  plays `thud`, `level.started` starts `meadow`; `meadow` and its loops are `libraryFiles('calm', 'meadow')`.

- [ ] **Step 1:** Check on `main` every name under the two "What this plan takes" lists (`git grep` here; the
      framework's API report at the pin). Write any that differs in the tracker and report it before Step 2.
- [ ] **Step 2:** Move the pin to plan M's merge commit, in the three places.
- [ ] **Step 3: Failing tests** in `game.test.ts`: the fixture game loads through `loadGame(read, list)` with its
      folders; it has three sounds, one cue list of four, one song and its loops; every file equals `writeContent`
      of itself byte for byte; the three sounds equal `makeSound`'s; `plain-game` has no sound, no cue and no
      folder line; `old-song-game` loads with one format 1 track and no folder line.
- [ ] **Step 4:** Write the files (in `writeContent`'s form; the byte test says if one differs). Push; green, every
      existing journey as before.
- [ ] **Step 5:** Commit `chore: pin the framework to <short sha>, and test games with sound`. Tracker line. Report
      `Task 1: <commit>, <test count>, surprises`. No screen changed: no review artifact.

### Task 2: The API saves a change of several files, and lists a game's folders

**Files:**
- Modify: `src/features/wire/wire.ts`, `src/features/github/repo.ts`, `src/features/service/open.ts`,
  `src/features/service/whole.ts`, `src/features/service/service.ts`, `src/features/api/api.ts`,
  `tests/fixtures/fake-github/server.ts` (trees, blobs, commits, refs, a folder's listing, a file's bytes)
- Create: `src/features/service/files.ts`, `src/features/service/recording.ts`
- Test: `tests/features/service/files.test.ts`, `open.test.ts`, `recording.test.ts`,
  `tests/features/github/repo.test.ts`

**Interfaces:**
- Produces (in `wire.ts`):

```ts
/** The kinds of content file an editor may write (the Feel plan's ruling 20; one list for every editor). */
export const EDITABLE = ['level', 'tuning', 'feel', 'sound', 'cues', 'music', 'loop', 'motif'] as const
export type Editable = (typeof EDITABLE)[number]
/** One file of a change. `version` is the file's as it was opened; left out for a file that is new. */
export type FileWrite =
  | { readonly path: string; readonly type: Editable; readonly value: unknown; readonly version?: string }
  | { readonly path: string; /** A recording file's bytes, base64. */ readonly recording: string; readonly version?: string }
  | { readonly path: string; readonly remove: true; readonly version: string }
export interface FilesAsk { readonly game: GameRef; readonly writes: readonly FileWrite[]
  /** Folder lines to add to automata.toml in the same saved change (the one set-up). */
  readonly setUp?: readonly { readonly type: Editable; readonly folder: string }[]
  readonly message: string }
export interface FilesAnswer { readonly how: 'direct' | 'suggestion'
  /** Each written file's new version, by path; a removed file is not in it. automata.toml too, when set up. */
  readonly versions: Readonly<Record<string, string>>; readonly mine: Waiting | undefined }
export interface OpenAnswer { /* as today, plus */
  /** The names directly in each folder automata.toml lists, as the branch has them. */
  readonly folders: Readonly<Record<string, readonly string[]>> }
export interface RecordingAsk { readonly game: GameRef; readonly branch: string; readonly path: string }
// api.ts
saveFiles(ask: FilesAsk): Promise<Answer<FilesAnswer>>
recording(ask: RecordingAsk): Promise<Answer<WirePicture>>     // the bytes of one .wav, base64
```

Only kinds this plan needs must be in `EDITABLE` when it is built; `level`, `tuning` and `feel` are there when their
own tasks put them there.

**The rules of `POST /api/files`,** checked in this order against the default branch (or the person's own waiting
branch when they have one), nothing written unless all pass:

1. Signed in, and the level may save (as today's save).
2. `setUp`: each must be `content/sounds` for `sound`, `content/music` for `music`, `content/loops` for `loop`,
   `content/motifs` for `motif`, `content/cues` for `cues`, `content/feel` for `feel`; anything else is
   `not-allowed`. The new `automata.toml` is the framework's `withFolders` of the file as it is.
3. Every JSON write's path is listed by path with that type, or is `<folder>/<id>.json` directly in a folder listed
   for that type (after step 2); its bytes are `writeContent(type, value)`; its id is its file's name. A write with
   no `version` must not exist; one with a `version` must, at that version (`changed-elsewhere` otherwise).
4. Every recording's path ends `.wav`, sits directly in a folder listed for `sound`, and passes `readRecording`.
5. A removal names a file that a rule above would let be written.
6. At most 20 writes and 5 MB of recordings (`bad-request`).
7. The whole game, with the change in place, loads (`wholeGameLoads`, now with the folders' listing) and has no
   `recordingProblems`; else `broken` with the framework's sentences.
8. One commit holds every write, removal and the set-up line, by the person's level like any save (a Suggest-level
   change is one waiting change). A branch that moved under it is tried again from its new head, twice; then
   `changed-elsewhere`.

- [ ] **Step 1: Failing tests.** `files.test.ts`, on the pretend GitHub: an Owner saves a new sound and the changed
      cue list: one commit, both files `writeContent`'s bytes, nothing else changed; a Suggest-level save of the
      same is one waiting change holding both; a new file over one that exists is `changed-elsewhere`; a path in a
      folder not listed, a character file, `automata.toml` itself and a `.wav` outside the sounds folder are each
      `not-allowed`; a cue naming a sound the change removes is `broken` with the framework's sentence; a recording
      of 12 seconds is `broken` with `door.wav is 12 seconds long…`; a removal and a write in one change is one
      commit; `plain-game` with `setUp` for the five folders: the commit holds the new sound and an `automata.toml`
      that is the old text plus exactly five blocks, and a second save does not touch it; a `setUp` of
      `content/secret` is `not-allowed`; 21 writes is `bad-request`; a branch that moves once under the save still
      saves; a stale `version` is `changed-elsewhere`. `open.test.ts`: the fixture game's answer has every folder
      file in `files` and each folder's names in `folders`; a `.wav` is named in `folders` and not in `files`.
      `recording.test.ts`: the bytes come back; a `.json` path is `bad-request`; a visitor may read the demo game's.
- [ ] **Steps 2 to 4:** push red; implement; push green.
- [ ] **Step 5:** Commit `feat: the editors save a change of several files, and read a game's folders`. Report
      `Task 2`.

### Task 3: A change, on the page

**Files:**
- Create: `src/features/game/change.ts`, `tests/features/game/change.test.ts`
- Modify: `src/features/game/open.ts` (`loadGame(read, list)` from `OpenAnswer.folders`; `Opened` gains `folders`),
  `src/features/game/game.ts`

**Interfaces:**
- Consumes: `FilesAsk`, `FileWrite`, `Editable`, `api.saveFiles`, `api.recording`.
- Produces:

```ts
/** One file as the page holds it: a content value, or a recording's bytes. */
export type Held =
  | { readonly type: Editable; readonly value: { readonly id: string } }
  | { readonly recording: Uint8Array }
/** What a person changed and has not saved: files to write, by path, and paths to take away. */
export interface Change { readonly writes: ReadonlyMap<string, Held>; readonly removes: ReadonlySet<string>
  readonly setUp: readonly { readonly type: Editable; readonly folder: string }[] }
export const NO_CHANGE: Change
/** `over` laid on `under`: a later write wins; a write then a remove of a new file is nothing. */
export function mergeChange(under: Change, over: Change): Change
/** The opened game as it would be with the change in place: content, files and folders. Throws nothing; a change
 *  the framework refuses gives the game as it was and the sentences. */
export function withChange(game: OpenGame, change: Change): { readonly game: OpenGame; readonly problems: readonly string[] }
/** The first folder the project lists for a kind, or undefined. */
export function folderFor(game: OpenGame, type: Editable): string | undefined
/** A free id in the game for a kind: `jump`, then `jump-2`. */
export function freeId(game: OpenGame, type: Editable, wanted: string): string
export function saveChange(api: Api, game: OpenGame, change: Change, message: string): Promise<SaveResult>
/** Every file of a change as a named download: JSON as text, a recording as its bytes. */
export function changeCopies(game: OpenGame, change: Change): { readonly name: string; readonly data: string | Uint8Array }[]
/** A change kept on the device, without its recordings, against the versions it was made from. */
export function keepChangeDraft(store: Storage, game: OpenGame, editor: 'sound', change: Change): void
export function takeChangeDraft(store: Storage, game: OpenGame, editor: 'sound'): { readonly change: Change } | 'changed' | undefined
export function dropChangeDraft(store: Storage, game: OpenGame, editor: 'sound'): void
/** A recording's bytes: from the change when it is there, else from the game through the API, read once. */
export function recordingOf(api: Api, game: OpenGame, change: Change, path: string): Promise<Uint8Array | undefined>
```

A kept draft holds no recording and no sound whose recording is unsaved (the spec: a recording is in memory only);
`takeChangeDraft` is `'changed'` when any file it was made against has another version now.

- [ ] **Step 1: Failing tests:** `mergeChange` (write over write, remove after write of a new file, set-up kept
      once); `withChange` gives a game whose `content.sounds` has the new sound and whose `loadGame` passes, and for
      a cue naming a missing sound gives the sentence; `folderFor` and `freeId`; `saveChange` sends one ask with
      every write as `writeContent` would read it and brings `game.files` and `game.content` up to date; a draft
      comes back, is `'changed'` after a version moved, never holds a recording (the store's text is searched for
      the path and for `RIFF`), and a store that throws gives no draft; `changeCopies` names each file by its name
      in the game.
- [ ] **Steps 2 to 4:** push red; implement; push green.
- [ ] **Step 5:** Commit `feat: a change of several files, held, drafted and saved`. Report `Task 3`.

## Pull request 2: sounds with no screen

### Task 4: What plays when, as edits

**Files:**
- Create: `src/features/sound/sound.ts`, `events.ts`, `cues.ts`, `edits.ts`; tests beside each under
  `tests/features/sound/`
- Modify: `tests/architecture/rules.ts` (the layer; the "no music maths here" rule), `tests/architecture/rules.test.ts`

**Interfaces:**
- Produces:

```ts
// events.ts
export interface Happening { readonly event: string
  /** The words key for it ('sound.when.hero-jumped'), or undefined for a name shown as itself. */ readonly words: string | undefined
  /** The character whose things wear its chip; undefined: "Whole game". */ readonly character: string | undefined }
/** Every happening this game can have (ruling 10), in the order offered. */
export function happenings(content: GameContent): Happening[]
/** One happening by name, known or not. */
export function happening(content: GameContent, event: string): Happening
// cues.ts
export interface Plays { readonly event: string; readonly kind: 'sound' | 'music' | 'stop-music'
  readonly id: string | undefined; /** Which cue list holds it. */ readonly list: string }
/** Every cue of the game, lists in id order, each in its own order. */
export function allPlays(content: GameContent): Plays[]
/** What each thing of a level wears: the things' ids by character, each with its sounds; and "Whole game"'s. */
export function chipsFor(content: GameContent, level: Level):
  { readonly things: ReadonlyMap<string, readonly Plays[]>; readonly whole: readonly Plays[] }
/** The change that makes `event` play this sound (or start this song): ruling 4. */
export function setPlays(game: OpenGame, event: string, what: { sound: string } | { music: string }): Change
export function removePlays(game: OpenGame, plays: Plays): Change
// edits.ts
export interface SoundEdits { readonly steps: readonly Change[]; readonly at: number
  /** For a sound made from a kind in this visit: its kind and seed (ruling 6). Never saved. */
  readonly made: ReadonlyMap<string, { readonly kind: SoundKind; readonly seed: number }> }
export function start(): SoundEdits
export function step(edits: SoundEdits, change: Change, name: string): SoundEdits
export function undo(edits: SoundEdits): SoundEdits
export function redo(edits: SoundEdits): SoundEdits
/** Everything not undone, as one change. */
export function pending(edits: SoundEdits): Change
/** A new sound of a kind, in the sounds folder, named free (ruling 5). */
export function newSound(game: OpenGame, edits: SoundEdits, kind: SoundKind): { readonly edits: SoundEdits; readonly id: string }
export function tryAnother(game: OpenGame, edits: SoundEdits, id: string): SoundEdits
export function duplicate(game: OpenGame, edits: SoundEdits, id: string): { readonly edits: SoundEdits; readonly id: string }
/** Erases a sound, its cues, and a recording nothing else names (ruling 11); the sentences to say first. */
export function erase(game: OpenGame, edits: SoundEdits, id: string): { readonly edits: SoundEdits; readonly says: readonly string[] }
/** The words for the saved change's one line: 'Add the sound Jump', 'Change Meadow and 2 more'. */
export function nameOf(change: Change, game: OpenGame): string
```

- [ ] **Step 1: Failing tests.** `events.test.ts`: the fixture game offers the hero's moves that are on, `crate`'s
      none (it is not touched), a `spark`'s `taken`, `level.started`, and a name used only in a feel file; a hero
      with no `moves` offers none of the built-in ones; an unknown name comes back with no words and the character
      of its first word when the level has one. `cues.test.ts`: `chipsFor` puts `jump` and `land` on the hero,
      `thud` on every crate, `meadow` under whole game; Review Focus 1's game; `setPlays` on a game with no cue list
      makes `cues.json` in the cues folder, on one with two lists changes only the first, and for music replaces the
      cue that was there; `removePlays` changes only its list. `edits.test.ts`: `newSound` twice gives `jump` and
      `jump-2`, each `makeSound`'s; `tryAnother` gives seed 1's and undo seed 0's; after a reload's worth (`made`
      empty) `tryAnother` changes nothing; `erase` of `thud` removes its cue and says `'Thud will stop playing when
      the crate lands.'`; `pending` after undo is the earlier change; `nameOf`.
- [ ] **Steps 2 to 4:** push red; implement; push green.
- [ ] **Step 5:** Commit `feat(sound): what plays when, and the undo list`. Report `Task 4`.

### Task 5: The sliders and the picture

**Files:**
- Create: `src/features/sound/shape.ts`, `src/features/sound/picture.ts`, tests beside each

**Interfaces:**
- Produces:

```ts
export type SliderName = 'pitch' | 'length' | 'loudness' | 'rough'
/** Where a slider sits, 0 to 1, from the file (ruling 7); undefined when this sound has no such slider. */
export function placeOf(sound: SoundFile, slider: SliderName, parts: SongParts, recordings: Recordings): number | undefined
/** The sound one step up or down; the very same object when the step cannot move. Always passes SoundSchema. */
export function stepOf(sound: SoundFile, slider: SliderName, direction: 1 | -1, parts: SongParts, recordings: Recordings): SoundFile
/** As many steps as bring the place nearest to `place`. */
export function moveTo(sound: SoundFile, slider: SliderName, place: number, parts: SongParts, recordings: Recordings): SoundFile
/** What the card says beside a slider: 'Higher', 'In the middle', '0.25 s', 'Loud'. A words key and its values. */
export function sayOf(sound: SoundFile, slider: SliderName, …): { readonly key: string; readonly values?: Record<string, string | number> }
// picture.ts
export type Shape =
  | { readonly kind: 'tone' | 'hiss'; readonly from: number; readonly to: number; readonly y0: number; readonly y1: number; readonly loud: number }
  | { readonly kind: 'wave'; readonly from: number; readonly to: number; readonly points: readonly number[] }
  | { readonly kind: 'dots'; readonly from: number; readonly to: number; readonly dots: readonly { readonly at: number; readonly y: number }[] }
/** A sound as shapes, every number 0 to 1 across its length and height (ruling 8). */
export function pictureOf(sound: SoundFile, parts: SongParts, recordings: Recordings): { readonly seconds: number; readonly shapes: readonly Shape[] }
```

- [ ] **Step 1: Failing tests.** `shape.test.ts`: for `makeSound` of every kind at seeds 0 to 9, each slider's
      twelve steps up then twelve down give a sound that passes `SoundSchema` every time, the place rises then
      falls, and a full circle ends within one step of where it began; Review Focus 2's sound (20 hertz, eight
      voices, 10 seconds); a sound of one recording has no `rough`, its `pitch` step moves `speed` and stops at 2,
      its `length` never reads past the file; a motif sound's `pitch` moves `shift`; `moveTo(0.8)` then `placeOf`
      is within one step of 0.8; no written number has more than three decimals (one for a pitch). `picture.test.ts`:
      a rising tone's `y1` is above its `y0`; a recording gives 120 points; a motif gives a dot a note; every
      number is from 0 to 1.
- [ ] **Steps 2 to 4:** push red; implement; push green.
- [ ] **Step 5:** Commit `feat(sound): four sliders worked out from the file, and a sound's picture`. Report
      `Task 5`.

### Task 6: Hearing it

**Files:**
- Create: `src/features/sound/hear.ts`, `tests/features/sound/hear.test.ts`,
  `tests/features/sound/hear.browser.test.ts`

**Interfaces:**
- Produces:

```ts
export type HearState = 'tap' | 'ready' | 'none'      // 'tap': nothing can be heard until a press; 'none': no sound on this device
export interface Hear {
  state(): HearState; onState(listener: (state: HearState) => void): () => void
  /** What is playing now: a sound's or a song's id, 'notes', or undefined. */ playing(): string | undefined
  onPlaying(listener: (id: string | undefined) => void): () => void
  /** Plays a sound once, stopping whatever played. `recordings` are given to the speaker first. */
  sound(sound: SoundFile, parts: SongParts, recordings: Recordings): void
  /** Plays a song from a bar (default 1) with the game's own music player. */
  track(music: MusicFile, parts: SongParts, fromBar?: number): void
  /** Plays plain notes once at a tempo: a loop over the song's chords, a chord, a tapped note. */
  notes(notes: readonly PlainNote[], tempo: number): void
  /** Seconds since what is playing began, for the moving line; undefined when nothing plays. */ at(): number | undefined
  stop(): void; close(): void }
/** `speaker` is for tests; left out, a `webSpeaker()` is made at the first call from a press. */
export function createHear(options?: { readonly speaker?: Speaker; readonly log?: (entry: unknown) => void }): Hear
```

- [ ] **Step 1: Failing tests.** `hear.test.ts` (a `testSpeaker`): `sound` hands over `soundVoices`'s voices on the
      `sound` bus; a second `sound` cuts the first (`cuts`); `track` then `sound` stops the music; `track(m, p, 3)`
      begins two bars in; `stop` then `playing()` is undefined; `playing` falls back to undefined by itself when
      the sound's seconds have gone by on the speaker's clock; while the speaker waits, `state()` is `'tap'`,
      `sound` plays nothing and plays nothing later; `close` cuts both buses; nothing is ever played without a
      call (Review Focus 5). `hear.browser.test.ts` (three engines): made inside a click it becomes `'ready'`;
      `log` receives one entry a voice and one a stop (ruling 21).
- [ ] **Steps 2 to 4:** push red; implement; push green.
- [ ] **Step 5:** Commit `feat(sound): one speaker for everything Sound plays`. Report `Task 6`.

## Pull request 3: the Sound screen

Each task here ends with the redesign's "Review pictures" step for the scenes it names (Appendix B), at the five
sizes, in the screenshot artifact.

### Task 7: Sound opens: the address, the panel, the chips

**Files:**
- Create: `src/features/sound/Sound.svelte`, `SoundsPanel.svelte`, `SoundChips.svelte`,
  `src/features/suite/SoundScreen.svelte`; tests `tests/features/sound/Sound.browser.test.ts`,
  `tests/journeys/sound-open.journey.test.ts`
- Modify: `src/features/suite/route.ts`, `App.svelte`, the switcher (Sound stops being `ComingSoon`),
  `src/features/ui/icons.ts` (`wave`, `microphone`, `note`, `notes`, `dice`, `speaker`), the words

**What it builds:** the spec's "The frame". `Sound.svelte` takes the opened game, the level, the `SoundEdits` and a
`Hear`, and reports edits upward (as `Levels` does). The level is the redesign's `Stage`, still, in its real art;
the chips are page elements in the stage's `layer` (never drawn on the canvas), placed by `chipsFor` and ruling 9.
The Sounds panel is the `tools` part (closable; a list from the pill on `mid` and `narrow`). The title block shows
the level's music line. Tapping a chip picks its sound and plays it once.

- [ ] **Step 1: Failing tests** (DOM and real-browser): the fixture level shows `JUMP` and `LAND` in one chip of
      "2 sounds" on the hero, `THUD` on each crate, and "Whole game" with one; a chip is at least 44 px tall, wholly
      inside the stage, and none overlaps another or the pill at any of the five sizes; picking a thing with no
      sound shows "+ Sound" on it; the panel lists three sounds and one song, each with its icon; closing the panel
      keeps the chips; the title block reads "Music: Meadow"; `plain-game` reads "No music" and "Add music"; a tap
      on `THUD` appends the thud's voices to the heard list and opens its card's place; choosing World in the
      switcher goes to the same level and stops what plays; the canvas's pixels are the same with the chips on and
      off (World's "art is untouched" test). The journey: open the demo game as a visitor, choose Sound, tap the
      hero's chip, read the heard list, at five sizes in three engines.
- [ ] **Steps 2 to 4:** push red; implement; push green. **Step 5:** review pictures (`sound-open`,
      `sound-panel-closed`, `sound-many`, `sound-none`); commit `feat(sound): Sound opens on the level, with a note
      on everything that makes a sound`. Report `Task 7`.

### Task 8: A sound's card

**Files:**
- Create: `src/features/sound/SoundCard.svelte`, `SoundPicture.svelte`, `EveryDetail.svelte`; `Slider.svelte` in
  `ui` if the Feel plan has not built it (its ruling 5: the browser's range input between − and +)
- Test: `tests/features/sound/SoundCard.browser.test.ts`, `EveryDetail.browser.test.ts`

**What it builds:** the spec's "A sound's card", top to bottom: the name, the id as a label, Play (48 px; Stop while
it plays; "Tap to hear" while `hear.state()` is `'tap'`); "When…" as words with Change and Add another (Task 10
fills the picker; here they are listed); the picture (at most 120 px) with its moving line; the four sliders
(`placeOf`, `stepOf`, `moveTo`, `sayOf`); "Every detail", closed, each voice a small panel of the file's own fields
with − and + (steps: a pitch by a semitone, seconds by 0.01, loudness by 0.05), wave as four choices (Smooth, Soft,
Buzzy, Bright), Add a voice, Remove; Duplicate and Erase at the foot. It is the `card` part: 296 px on `wide`, a
`Sheet` on `mid` and `narrow`.

- [ ] **Step 1: Failing tests:** each slider's + writes the file `stepOf` gives and plays it once; a drag is one
      undo step; a slider at its end has its button off, not hidden; "Every detail" shows `440 Hz` and `0.2 s` in
      JetBrains Mono and changing a number moves the slider above it (the file is the one truth); Add a voice stops
      at eight; a file edited by hand between two renders (the test swaps the value) shows the new places; Erase
      says the sentence of Task 4 first and Undo brings the sound and its cue back; Play twice restarts; the sheet
      scrolls inside itself only.
- [ ] **Steps 2 to 4,** then review pictures (`sound-card`, `sound-card-playing`, `sound-every-detail`,
      `sound-erase-ask`); commit `feat(sound): a sound's card`. Report `Task 8`.

### Task 9: A new sound in three presses

**Files:**
- Create: `src/features/sound/KindTray.svelte`; test `KindTray.browser.test.ts`,
  `tests/journeys/new-sound.journey.test.ts`

**What it builds:** "New sound" (the panel's foot, a "+ Sound" chip, the find bar) opens the tray: the ten kinds in
`SOUND_KINDS`' order, each a button of at least 64 px with its icon and word that plays `makeSound(kind, 0)` when
pressed and then makes the sound (`newSound`), opens its card and asks "When…" first (from a "+ Sound" chip the
thing's first free happening is already picked); then Record and Bring in a file, which read "Soon" until Part 2.
"Try another" on the card is ruling 6.

- [ ] **Step 1: Failing tests:** pressing Jump from the hero's "+ Sound" makes `jump` (or the free name), the cue
      `hero.jumped`, plays it, and the chip appears; Try another changes the voices, plays, and Undo returns the
      first take; a card of a sound from the file shows "Start again from a kind" and no Try another; the tray's
      buttons wrap and none is cut at 390 px. The journey (three engines, five sizes): three presses from the level
      to a sound that plays when the hero jumps, then Play the level and read the game's own cue log.
- [ ] **Steps 2 to 4,** review pictures (`sound-kinds`, `sound-new-when`); commit `feat(sound): a new sound from a
      kind, and Try another`. Report `Task 9`.

### Task 10: "When…"

**Files:**
- Create: `src/features/sound/WhenPicker.svelte`; test `WhenPicker.browser.test.ts`; the words `sound.when.*`

**What it builds:** the picker lists `happenings` as sentences ("When the hero jumps"), grouped by whose they are,
the one in use marked; "Name your own" takes a name, checked as the framework's event name is (the framework's own
sentence is shown under the box), and shows it as typed. Change swaps the cue; Add another adds one; a sound's last
"When…" can be taken away (the sound stays, in the panel, with "Nothing plays this yet").

- [ ] **Step 1: Failing tests:** every `MOVE_EVENTS` name and the three touch forms have words in all nine
      languages; Change rewrites one cue; Add another adds one and the chip count rises; a happening that already
      plays another sound says "The hero's jump already plays Jump. Swap it?" and swaps on yes; "Name your own" with
      `Boss Fight` shows the framework's sentence and saves nothing; `boss.roared` shows as itself under "Whole
      game".
- [ ] **Steps 2 to 4,** review pictures (`sound-when`, `sound-when-own`); commit `feat(sound): pick what sets a
      sound off`. Report `Task 10`.

## Pull request 4: keeping it

### Task 11: Save, "Set up sounds", Export, the draft, a waiting change

**Files:**
- Create: `src/features/sound/setup.ts`; modify `SoundScreen.svelte`, `WaitingChange.svelte`
- Test: `tests/features/sound/setup.test.ts`, `tests/journeys/sound-save.journey.test.ts`,
  `sound-setup.journey.test.ts`

**Interfaces:**
- Produces: `needsSetUp(game: OpenGame): boolean` (the project lists no folder for `sound` or for `cues`);
  `SOUND_FOLDERS` (the five lines of Task 2's rule 2); `withSetUp(change: Change): Change`.

**What it builds:** Save sends `pending(edits)` with `saveChange` and the line `nameOf` gives; the stamp, the title
block, the notices and the waiting-change path are World's. On a game that `needsSetUp`, Sound's first open shows
one notice over the level: "This game isn't set up for sounds yet." with **Set up sounds**; pressing it adds the
five folder lines to the pending change (nothing is sent until Save), the stamp's line then reads "… and set up
sounds", and until it is pressed New sound is off and says why. Export copies the picked file; a change of several
files offers "Save them as files" (`changeCopies`). The draft is `keepChangeDraft`. A waiting change is ruling 22.

- [ ] **Step 1: Failing tests.** `setup.test.ts`: `plain-game` needs it, the fixture does not, `old-song-game` (its
      files listed by path) does. Journeys, three engines: as an Owner, a new sound is saved, the page reloaded, the
      chip is there and the pretend GitHub has one commit of two files; as a Suggest-level person the same is a
      waiting change, and an Approve-level person opens it, plays Before and After, and approves; on `plain-game`,
      Set up sounds then a new sound then Save gives one commit holding `automata.toml` (five blocks more, the rest
      byte for byte), the sound and `cues.json`, and a second visit shows no notice; Save after an agent changed
      the same sound says World's "changed elsewhere" notice and nothing is written (Review Focus 4); a reload with
      an unsaved change brings it back; a visitor on the demo game changes a sound and Exports it, and the file is
      `writeContent`'s bytes; "Save them as files" downloads each by its name.
- [ ] **Steps 2 to 4,** review pictures (`sound-set-up`, `sound-saved`, `sound-exported`, `sound-changed-elsewhere`,
      `sound-change-waiting`); commit `feat(sound): save a sound into the game, and set a game up for sounds`.
      Report `Task 11`.

### Task 12: The first run, the find bar, nine languages, the page for agents

**Files:**
- Modify: `src/features/suite/guide.ts`, the find bar's kinds, every words table; create `docs/making-sounds.md`
- Test: `tests/journeys/sound-first-run.journey.test.ts`, `sound-words.journey.test.ts`,
  `tests/features/words/`, `tests/docs/making-sounds.test.ts`, `tests/journeys/screens.journey.test.ts` (Part 1's
  scenes of Appendix B)

**What it builds:** the spec's "Onboarding" four steps, with its exact words, for a game with sounds and for one
with none ("Give the hero a sound"); find-bar commands in the redesign's id pattern (`sound-new`,
`sound-new:<kind>`, `sound-open:<id>`, `sound-play:<id>`, `sound-erase:<id>`, `sound-set-up`); Appendix A in the
other eight languages (ruling 24); `docs/making-sounds.md`: for each thing a person does in Part 1, the file it
changes and the `automata` command that does the same (`automata sound new jump --seed 1`), and a test that edits
each kind of file by hand, as that page says, and checks Sound shows the change.

- [ ] **Step 1: Failing tests:** the first-run journey, both games, three engines, a person who taps elsewhere is
      never blocked; every Sound word exists in nine languages, none equal to its key, none holding a banned word,
      no slider word over 32 characters, and no word cut at 390 px in German and Russian; every find-bar command
      runs; the docs test; every Part 1 scene passes the redesign's layout rules at the five sizes.
- [ ] **Steps 2 to 4,** the full review artifact for Part 1; commit `feat(sound): Sound's first run, in nine
      languages`. Report `Task 12`. **Part 1 is whole here:** stages 5 and 6 for Part 1 may start (see "After the
      build").

---

# Part 2: recordings

## Pull request 5

### Task 13: Record, or bring in a file

**Files:**
- Create: `src/features/sound/record.ts`, `trim.ts`, `RecordPanel.svelte`; tests `record.browser.test.ts`,
  `trim.test.ts`
- Modify: `public/_headers` (ruling 20), `tests/workflows/` (the header test), `KindTray.svelte`

**Interfaces:**
- Produces:

```ts
export type RecordProblem = 'refused' | 'no-microphone' | 'not-sound' | 'stopped'
export interface Recorder { /** Seconds so far. */ seconds(): number; stop(): Promise<Taken | RecordProblem>; cancel(): void }
/** Decoded sound, before it is a file. */
export interface Taken { readonly channels: readonly Float32Array[]; readonly sampleRate: number }
/** Asks for the microphone and starts. Stops by itself at 10 seconds. */
export function startRecording(): Promise<Recorder | RecordProblem>
/** Any sound file the browser can play, decoded; over 10 seconds, its first 10. */
export function bringIn(file: Blob): Promise<Taken | 'not-sound'>
// trim.ts
/** Where sound starts and ends, in seconds, with silence cut (ruling 19). */
export function soundEnds(taken: Taken): { readonly from: number; readonly to: number }
/** The part between two times as a recording file's bytes (the framework's writeRecording). */
export function keep(taken: Taken, from: number, to: number): Uint8Array
/** 120 points for the wave's drawing. */
export function waveOf(taken: Taken): number[]
```

- [ ] **Step 1: Failing tests.** `trim.test.ts`: half a second of silence, a second of tone and silence again gives
      ends within 20 ms of the tone; `keep` is `writeRecording`'s bytes for that part and reads back with
      `readRecording`; all silence keeps a tenth of a second from the middle and never an empty file.
      `record.browser.test.ts`: in Chromium and Firefox with their pretend microphones, a recording of a second
      gives a `Taken` of about a second, and it stops by itself at 10 (a pretend clock); refused gives `'refused'`;
      no device gives `'no-microphone'`; the device taken away mid-way gives `'stopped'` and what was taken is
      offered; in all three engines `bringIn` of a WAV, an MP3 and an M4A fixture gives sound, of a `.txt` gives
      `'not-sound'`, of 15 seconds gives 10; after each, every store on the device is empty of it (the constraint).
- [ ] **Steps 2 to 4:** push red; implement; push green.
- [ ] **Step 5:** Commit `feat(sound): record a sound, or bring one in`. Report `Task 13`.

### Task 14: Trim it, keep it, save it

**Files:**
- Create: `src/features/sound/TrimPanel.svelte`; modify `SoundCard.svelte`, `EveryDetail.svelte`, `edits.ts`
  (`newRecording`), `SoundScreen.svelte` (the leave question)
- Test: `TrimPanel.browser.test.ts`, `tests/journeys/recording.journey.test.ts`, the scenes

**What it builds:** Record's first press shows the spec's one line and asks the browser; a round 72 px button
records with the seconds left counting down; the trim panel shows the wave, two handles (each with − and +, a step
of 0.05 s), Play and "Keep it", and "Only bring in sounds you made or may use."; keeping makes `<name>.wav` and a
sound whose one voice plays it, in one undo step, then asks "When…". A recording's card shows its wave and, under
"Every detail", the part of the file, its speed and loudness. Save sends the bytes in the same change. Leaving
Sound with an unsaved recording asks "Leave without saving?". The spec's refusal lines are shown for each
`RecordProblem`.

- [ ] **Step 1: Failing tests:** a handle never crosses the other and never leaves the wave; "Keep it" over 1 MB
      cannot happen (10 seconds is under it) and a test proves the bytes of 10 seconds are under
      `RECORDING_MAX_BYTES`; a game at 19.5 MB says "This game's recordings are nearly full." and at the limit says
      the framework's sentence before Save. The journey: Chromium and Firefox record with the pretend microphone,
      WebKit brings in a file; trim, keep, pick "When the hero takes a spark", Save as an Owner: one commit with
      the `.wav`, the sound and the cue list; reload: the card's wave is drawn from the game's file and Play logs
      one recording voice; the same as a Suggest-level person is one waiting change; leave with an unsaved
      recording asks, and after "Leave" nothing of it is in any store.
- [ ] **Steps 2 to 4,** review pictures (`sound-record-ask`, `sound-recording`, `sound-trim`, `sound-record-refused`,
      `sound-recording-card`); commit `feat(sound): a recorded sound, trimmed and kept`. Report `Task 14`.

---

# Part 3: music and motifs

## Pull request 6: a song, with no screen

### Task 15: Every edit of a song

**Files:**
- Create: `src/features/sound/arrange.ts`, `chords.ts`; tests beside each

**Interfaces:**
- Produces (each gives the new song, and the change that also copies a library loop in when one is used):

```ts
export function newSong(game: OpenGame, from: 'nothing' | 'calm' | 'bouncy' | 'spooky' | 'brave'): { readonly change: Change; readonly id: string }
export function addLane(music: ArrangedMusic, instrument: Instrument): ArrangedMusic
export function removeLane(music: ArrangedMusic, lane: string): ArrangedMusic
/** Ruling 14. `undefined` when the song is full. */
export function pressLoop(game: OpenGame, music: ArrangedMusic, loop: LoopFile): { readonly change: Change } | undefined
export function placeBlock(music: ArrangedMusic, lane: string, block: MusicBlock, parts: SongParts): ArrangedMusic | undefined   // undefined: it would overlap
export function moveBlock(music, lane, index, toBar, parts): ArrangedMusic | undefined
export function repeatBlock(music, lane, index, bars, parts): ArrangedMusic | undefined
export function copyBlock(music, lane, index, parts): ArrangedMusic | undefined       // into the next free bars
export function removeBlock(music, lane, index): ArrangedMusic
export function setChord(music: ArrangedMusic, bar: number, numeral: string): ArrangedMusic
export function setKey(music, key: Key, mode: Mode): ArrangedMusic
export function setTempo(music, tempo: number): ArrangedMusic            // 30 to 300
export function setBars(music, bars: number, parts): ArrangedMusic | undefined     // undefined: a block would be cut
// chords.ts
export interface ChordButton { readonly numeral: string; readonly name: string; readonly small: boolean }
export function chordButtons(key: Key, mode: Mode): ChordButton[]         // ruling 13
export function progressions(key: Key, mode: Mode): { readonly numerals: readonly string[]; readonly names: readonly string[] }[]
export function fillProgression(music: ArrangedMusic, fromBar: number, numerals: readonly string[]): ArrangedMusic
/** The loops the tray offers: the game's own, then the library's it does not have yet, by kind. */
export function trayLoops(game: OpenGame): Readonly<Record<LoopLane, readonly { readonly loop: LoopFile; readonly name: string | undefined; readonly inGame: boolean }[]>>
/** A block whose loop or motif the game does not have. */
export function missingBlocks(music: ArrangedMusic, parts: SongParts): { readonly lane: string; readonly index: number }[]
```

- [ ] **Step 1: Failing tests:** every function's result passes `MusicSchema` and, in a game in memory, `loadGame`;
      `pressLoop` of a library drum loop on an empty song adds a `drums` lane, the block at bar 1 and the loop's
      file to the change, and a second press lands after the first; with eight lanes and no room it is
      `undefined`; a library loop whose id the game uses for other notes is copied as `-2` (ruling 15); `moveBlock`
      onto another is `undefined`; `setKey` changes only `key` and `mode`; `chordButtons('C', 'major')` names `C Dm
      Em F G Am` and `Bdim` small; in A minor `Am Bdim C Dm Em F G`; `fillProgression` from bar 3 of 8 fills 3 to 8;
      `newSong` from `calm` is `libraryFiles('calm', <free id>)` and its cue for `level.started`; `missingBlocks`
      (Review Focus 4).
- [ ] **Steps 2 to 4:** push red; implement; push green.
- [ ] **Step 5:** Commit `feat(sound): every edit of a song, as whole files`. Report `Task 15`.

## Pull request 7: the music screen

### Task 16: Lanes, chords and the loop tray

**Files:**
- Create: `src/features/sound/MusicScreen.svelte`, `ChordRow.svelte`, `Lane.svelte`, `LoopTray.svelte`; tests
  `MusicScreen.browser.test.ts`, `tests/journeys/music.journey.test.ts`

**What it builds:** the spec's "Music" screen, opened from the title block or a song in the panel: the level faded
behind, a floating panel between the pill and the title block. Top: the name, Play, "Key: C major" (a list of the
seventeen keys and the two modes), Speed with − and + (steps of 5), "Loops forever". The chord row (each bar a
button of at least 44 px showing `chordName`; pressing opens `chordButtons`, each playing its chord through
`hear.notes`; "Try a progression"). Lanes (each 56 px tall; the instrument's word, its loudness, "+ Lane"); a block
is a button showing its loop's name, and picked shows Move (− and +), Repeat (− and +), Copy, Remove; a block can
also be dragged and its end dragged. The tray: Drums, Bass, Chords, Melody, Motifs; each loop with ▶ (heard over the
song's chords with `loopNotes`) and a press to add (`pressLoop`). Play starts at the bar last touched; pressing a
bar's number plays from there; the line is CSS timed from `hear.at()`. On `narrow` upright the lanes scroll
sideways inside their own region and the tray is a `Sheet`. A format 1 song shows ruling 12's view.

- [ ] **Step 1: Failing tests:** every control is reachable and worked by buttons alone (a test that never drags
      builds the spec's `meadow`); a drag does the same as the buttons; changing a chord changes what Play logs for
      the bass lane and nothing in the file but `chords`; changing the key writes two fields and every logged
      pitch moves; Stop is one press and leaving the screen stops; a block whose loop is missing reads "This loop
      is missing" with Remove; the format 1 view's "Turn it into loops" gives a song whose `notesOf` pitches are
      the old track's; nothing overlaps and no word is cut at the five sizes, and at 390 px only the lanes' region
      scrolls. The journey (three engines, five sizes): "Add music" on `plain-game` after set-up, start from Calm,
      press a drum loop and a bass loop, set bar 2's chord, Play, read the heard list, Save, reload, and Play the
      level: the game's cue log starts the song.
- [ ] **Steps 2 to 4,** review pictures (`music-open`, `music-chords`, `music-progression`, `music-block-picked`,
      `music-tray`, `music-full`, `music-old-rows`, `music-add`); commit `feat(sound): a song from loops and chords
      at a press`. Report `Task 16`.

### Task 17: Make your own loop

**Files:** `src/features/sound/LoopGrid.svelte`, `arrange.ts` (`newLoop`, `setStep`, `setLoopBars`); tests beside.

**What it builds:** from the tray, "Make your own loop": pick Drums, Bass, Chords or Melody; a grid of one loop's
steps (8 a bar, "Finer" for 16), rows the five drums, or steps 1 to 8 of the chord for bass and melody, or one row
for a chord rhythm; a tap sets or clears a step, a held tap on a note row holds it into the next step (`=`); Play
hears it over the song's chords; "Keep it" names it and puts it in the tray. This is the only place note names
appear (C, D, E), as small labels on the rows.

- [ ] **Step 1: Failing tests:** every grid the screen can make passes `LoopSchema`; a tap on a drum cell writes
      `x`; one note a step in a note row (a second tap in the column moves it); the file a hand-written loop makes
      shows its cells; cells are at least 44 px and the grid scrolls sideways inside itself on a phone.
- [ ] **Steps 2 to 4,** review pictures (`loop-grid-drums`, `loop-grid-notes`); commit `feat(sound): make your own
      loop`. Report `Task 17`.

## Pull request 8: motifs, MIDI, and the end

### Task 18: Motifs

**Files:** `src/features/sound/motif.ts`, `MotifKeys.svelte`, `MotifCard.svelte`; tests beside;
`tests/journeys/motif.journey.test.ts`.

**Interfaces:**
- Produces:

```ts
export function newMotif(game: OpenGame, notes: readonly MotifNote[]): { readonly change: Change; readonly id: string }
export function evenOut(notes: readonly MotifNote[]): MotifNote[]                 // ruling 16
export type OnePress = 'higher' | 'lower' | 'slower' | 'faster' | 'sadder' | 'brighter' | 'backwards'
/** A use's changes after one press; the same object when it cannot move (shift at ±14, speed at 0.25 or 4). */
export function press(changes: MotifChanges, what: OnePress): MotifChanges
/** The sound and the cue of "Play it when…" (ruling 17). */
export function motifSound(game: OpenGame, motif: string, event: string): Change
export interface UsedIn { readonly where: 'song' | 'sound'; readonly id: string; readonly bars?: readonly number[]
  readonly event?: string; readonly changes: MotifChanges }
export function usedIn(content: GameContent, motif: string): UsedIn[]
```

**What it builds:** "New motif" opens the keyboard (ruling 16) in the song's key (C major outside a song); each tap
plays (`hear.notes`) and lands as a dot; up to eight; "Even out"; "Keep it". A motif in the tray's Motifs drags or
presses into a lane like a loop; a picked motif block, and a motif sound's card, show the seven one-press buttons
(each plays the result) and the changes in words ("Lower, sadder"). A motif's card lists `usedIn` as links and
"Play it when…".

- [ ] **Step 1: Failing tests:** `press` for each of the seven and at each limit; a motif used in a song and as a
      door's sound, "Sadder" pressed on the door's: only the sound's file changes, and changing the motif's notes
      changes what both play (the heard list) with neither file rewritten; `usedIn` reads "In Meadow, bars 2 and
      6" and "When the hero touches the door, sadder"; a ninth tap does nothing and says "A motif has up to eight
      notes."; the keys are 56 px and none is cut at 390 px. The journey: tap four notes, keep, drop into Meadow,
      "Play it when the hero takes a spark", press Sadder there, Save: one saved change of the motif, the song, the
      sound and the cue list.
- [ ] **Steps 2 to 4,** review pictures (`motif-keys`, `motif-card`, `motif-in-lane`, `motif-changes`); commit
      `feat(sound): motifs, made by tapping and reused with one press`. Report `Task 18`.

### Task 19: Music files in and out

**Files:** `src/features/sound/midi.ts`, a small "what came in" panel in `LoopTray.svelte`; tests beside;
`tests/journeys/music-file.journey.test.ts`; `tests/fixtures/` gains `tune.mid` (made by the framework's
`musicToMidi` in the test's setup, never committed as bytes typed by hand).

**Interfaces:**
- Produces: `bringInMusic(game: OpenGame, bytes: Uint8Array, name: string): { readonly change: Change; readonly
  says: { lanes: number; bars: number; tempo: number; dropped: readonly string[] } } | { readonly problem: string }`
  (the framework's `midiToMusic`, ids made free); `musicFile(game: OpenGame, what: MidiSource): { readonly name:
  string; readonly bytes: Uint8Array }` (the framework's `musicToMidi`).

**What it builds:** ruling 18's two buttons. Bringing in shows "4 lanes, 32 bars, 110 beats a minute", the
framework's `dropped` sentences as they are (they are the framework's words; the nine languages get them from the
framework when it has them, else in the game makers' English, said once on the panel), Play and "Keep it". "Save
for other music apps" is on a song's, a loop's and a motif's card and downloads `<id>.mid`.

- [ ] **Step 1: Failing tests:** a brought-in file becomes one change of a song and its loops that loads; its
      refusal sentence is shown for a `.txt`; the downloaded file, read back with the framework's `midiToMusic`,
      gives the same `notesOf` as the song (the spec's journey); nothing of the `.mid` is in the saved change. The
      journey in three engines.
- [ ] **Steps 2 to 4,** review pictures (`music-came-in`); commit `feat(sound): bring a music file in, take a song
      out`. Report `Task 19`.

### Task 20: Music's first runs, the find bar, nine languages, every scene

**Files:** `guide.ts`, the find bar, the words tables, `docs/making-sounds.md` (music, motifs, recordings, the
`automata music` commands), `tests/journeys/music-first-run.journey.test.ts`, `screens.journey.test.ts`.

**What it builds:** the spec's music and motif first runs with their exact words; find-bar commands (`music-open:
<id>`, `music-new`, `music-play`, `music-loop:<id>`, `motif-new`, `motif-open:<id>`, `sound-record`); Parts 2 and
3's words in the other eight languages; the agents' page and its hand-edit test for `music`, `loop`, `motif` and a
recording voice; Appendix B's remaining scenes at the five sizes; the last journey: one person, from an empty
`plain-game` to a level with a jump sound, a recorded sound, a song and a motif, saved as a Suggest-level person and
approved by another, then played, the game's own cue log read at the end.

- [ ] **Step 1: Failing tests** as listed. **Steps 2 to 4,** the full review artifact for Sound; commit
      `feat(sound): music's first run, in nine languages, and the whole of Sound end to end`. Report `Task 20` and
      the end-of-stage summary.

---

## After the build (stages 5 and 6)

They start when Task 12 is merged for Part 1 and do not wait for Parts 2 and 3, as the redesign's did not wait for
Play; Parts 2 and 3 end with the same on their own scenes. Three audits, each to `docs/superpowers/audits/`: the
implementation audit of the code against this plan and the spec (Opus, medium, the audit prompt); the drunk-grandma
audit of every Sound scene at the five sizes, which also back-translates every Sound word in the nine tables (Opus);
and the visual audit against the approved mockups (Fable, the Owner's rule for design audits). Stage 6 fixes every
finding and republishes the review artifact before the Owner is asked to look. One thing no audit can do: the
Owner's review of Sound is also by ear.

## Appendix A: new words (English, `en.ts`)

Keys are `sound.*`. The spec's lines are used word for word; these are the rest. A `{name}` is filled in.

| Key | Text |
|---|---|
| `switcher.sound` | Sound |
| `panel.title` | Sounds |
| `panel.new` | New sound |
| `panel.new-motif` | New motif |
| `panel.no-plays` | Nothing plays this yet |
| `chip.many` | {n} sounds |
| `chip.add` | + Sound |
| `whole-game` | Whole game |
| `music.line` | Music: {name} |
| `music.none` | No music |
| `music.add` | Add music |
| `card.play` | Play |
| `card.stop` | Stop |
| `card.tap` | Tap to hear |
| `card.when` | When… |
| `card.change` | Change |
| `card.add-another` | Add another |
| `card.try-another` | Try another |
| `card.start-again` | Start again from a kind |
| `card.every-detail` | Every detail |
| `card.duplicate` | Duplicate |
| `card.erase` | Erase |
| `card.erase-says` | {name} will stop playing {when}. |
| `slider.pitch` | Higher or lower |
| `slider.length` | Longer or shorter |
| `slider.loudness` | Louder or softer |
| `slider.rough` | Rougher or smoother |
| `detail.shape` | Shape |
| `detail.smooth` / `soft` / `buzzy` / `bright` | Smooth / Soft / Buzzy / Bright |
| `detail.starts-at` / `ends-at` | Pitch at the start / Pitch at the end |
| `detail.when` / `detail.long` / `detail.loud` | Starts after / Lasts / How loud |
| `detail.hiss` | Hiss |
| `detail.part` / `detail.speed` | Which part of the recording / Speed |
| `detail.add` / `detail.remove` | Add a voice / Remove |
| `kind.jump` … `kind.blip` | Jump, Land, Coin, Hit, Explosion, Door, Click, Power up, Laser, Blip |
| `kind.record` / `kind.file` | Record / Bring in a file |
| `when.hero-jumped` | When the hero jumps |
| `when.hero-landed` | When the hero lands |
| `when.hero-walked` | When the hero starts walking |
| `when.hero-air-jumped` | When the hero jumps in the air |
| `when.hero-wall-slid` | When the hero slides down a wall |
| `when.hero-wall-jumped` | When the hero jumps off a wall |
| `when.hero-dashed` | When the hero dashes |
| `when.taken` | When the hero takes {a thing} |
| `when.touched` / `when.left` | When something touches {the thing} / leaves {the thing} |
| `when.level-started` | When the level starts |
| `when.own` | Name your own |
| `when.swap` | {the happening} already plays {name}. Swap it? |
| `setup.says` | This game isn't set up for sounds yet. |
| `setup.do` | Set up sounds |
| `setup.stamp` | and set up sounds |
| `save.lot` | That is a lot at once. Save what you have first. |
| `export.files` | Save them as files |
| `record.ask` | Sound needs your microphone to record. Nothing leaves this device until you press Save. |
| `record.refused` | Sound can't hear your microphone. You can bring in a sound file instead. |
| `record.left` | {n} seconds left |
| `record.keep` | Keep it |
| `record.yours` | Only bring in sounds you made or may use. |
| `record.not-sound` | That file isn't a sound this device can play. Try another file. |
| `record.nearly-full` | This game's recordings are nearly full. |
| `music.key` / `music.speed` / `music.forever` | Key: {name} / Speed: {n} / Loops forever |
| `music.lane-add` | + Lane |
| `music.progression` | Try a progression |
| `music.more-chords` | More |
| `music.longer` | Make it longer |
| `music.full` | This song is full. Make it longer, or take a block out. |
| `music.missing` | This loop is missing |
| `music.rows` | This song is written as rows of notes. |
| `music.to-loops` | Turn it into loops |
| `music.own-loop` | Make your own loop |
| `music.finer` | Finer |
| `music.bring-in` / `music.take-out` | Bring in a music file / Save for other music apps |
| `music.came-in` | {lanes} lanes, {bars} bars, {tempo} beats a minute |
| `music.plays-when` | Plays {when} |
| `music.start-from` | Start from a style / Start from nothing |
| `block.move` / `repeat` / `copy` / `remove` | Move / Repeat / Copy / Remove |
| `tray.drums` / `bass` / `chords` / `melody` / `motifs` | Drums / Bass / Chords / Melody / Motifs |
| `motif.even` | Even out |
| `motif.max` | A motif has up to eight notes. |
| `motif.higher` … `motif.backwards` | Higher, Lower, Slower, Faster, Sadder, Brighter, Backwards |
| `motif.play-when` | Play it when… |
| `motif.used` / `motif.used-song` / `motif.used-sound` | Where it plays / In {name}, bars {bars} / {when}, {changes} |
| `tip.tap` / `tip.another` / `tip.save` | Tap a sound to hear it / Press Try another for a new one / Nice. Now press Save. |
| `tip.give` | Give the hero a sound |
| `tip.loop` / `tip.play` | Press a loop to add it / Press Play to hear your song |
| `tip.notes` / `tip.keep` | Tap a few notes / Press Keep it |

The words for the instruments, the drums, the library's loops and its styles are the framework's (`libraryName`).

## Appendix B: every Sound screen state

Each at the five sizes, added to the redesign's scene list; `(stage)` scenes also run the level rules.

**Sounds (Part 1):** `sound-open` (stage), `sound-panel-closed` (stage), `sound-many` (stage; a thing with three),
`sound-none` (`plain-game`, after set-up), `sound-set-up` (`plain-game`), `sound-card`, `sound-card-playing`,
`sound-every-detail`, `sound-erase-ask`, `sound-kinds`, `sound-new-when`, `sound-when`, `sound-when-own`,
`sound-tip-tap`, `sound-tip-another`, `sound-tip-save`, `sound-saved`, `sound-exported`, `sound-changed-elsewhere`,
`sound-change-waiting`, `sound-de`, `sound-ru`, `sound-ja`.

**Recordings (Part 2):** `sound-record-ask`, `sound-recording`, `sound-trim`, `sound-record-refused`,
`sound-recording-card`.

**Music and motifs (Part 3):** `music-open`, `music-chords`, `music-progression`, `music-block-picked`,
`music-tray`, `music-full`, `music-old-rows`, `music-add`, `music-came-in`, `loop-grid-drums`, `loop-grid-notes`,
`motif-keys`, `motif-card`, `motif-in-lane`, `motif-changes`, `music-tip-loop`, `music-de`, `music-ja`.

## Self-review

- **Spec coverage.** Goal 1: Tasks 4, 7. Goal 2: Tasks 5, 8, 9, 10. Goal 3: Tasks 13, 14. Goal 4: Tasks 15, 16, 17.
  Goal 5: Task 18. Goal 6: Task 6 and every Play. Goal 7: Tasks 12 and 20, and each screen task. Goal 8: the
  journeys of Tasks 7, 9, 11, 12, 14, 16, 18, 19, 20 and Appendix B. "The frame", "Which thing a sound belongs to",
  "What can set a sound off": Tasks 4, 7, 10. "A sound's card", "Making a new sound": Tasks 8, 9. "Recording": 13,
  14. "Music": 15 to 17, 19. "Motifs": 18. "Saving and exporting": Tasks 2, 3, 11. "Onboarding": 12, 20. "Words and
  languages": Appendix A, Tasks 12, 20. "Hearing it": Task 6. "Testing": every list item is in a task above; "the
  art is untouched" is Task 7; "files byte for byte" is Tasks 1, 2 and 12. Anti-goals: no event names or hertz
  before hearing (Tasks 7 to 10; "Every detail" is closed); nothing kept but files (the constraint; Task 8's
  swapped-file test); no note-by-note music needed (Task 16's buttons-only test); a recording never leaves or stays
  (Tasks 3, 13, 14); never plays on its own, one press to stop (Task 6); the game plays it as Sound did (one
  speaker, the framework's player; Tasks 9 and 16 read the game's own cue log).
- **Where this plan differs from the spec, and why.** "MIDI" is not on the two buttons (ruling 18: the spec bans
  the word and names the buttons with it; the ban wins). "Try another" is for this visit only (ruling 6: nothing
  may remember a kind). A format 1 song is turned into loops, not edited (ruling 12; the spec is silent). The
  API's save is one for every editor (Task 2), shared with the Feel plan.
- **Open.** The Owner's approval of the mockups, which may amend the screens; and plan M's audit, which may rename
  an export this plan uses (Task 1's first step catches it).
- **Types.** `Change` (Task 3) is what `SoundEdits` holds (Task 4), `Sound` reports (Task 7) and `SoundScreen` saves
  (Task 11); `Plays` and `Happening` (Task 4) feed the chips and the picker; `Hear` (Task 6) is the only thing any
  screen plays through; `Taken` (Task 13) becomes a `Held` recording in a `Change` (Task 14); `ArrangedMusic` edits
  (Task 15) feed `MusicScreen`; `MotifChanges` is the framework's.
