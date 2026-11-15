# The Sound editor

Stage 1 (spec) of the Sound editor cycle in AutomataFrameworkEditors. Written 2026-11-15 with the Owner, one question
at a time. Sound is one of the five editors (World, Characters, Feel, Sound, Story); each gets its own full pipeline
(the Owner, 2026-11-15). The first layer's spec in AutomataFramework
([`2026-11-13-2d-first-layer-design.md`](https://github.com/mcthaydt/AutomataFramework/blob/main/docs/superpowers/specs/2026-11-13-2d-first-layer-design.md),
"The editors") and this repo's Blueprint redesign
([`2026-11-14-editors-blueprint-redesign-design.md`](2026-11-14-editors-blueprint-redesign-design.md)) still hold;
where this page is more exact about Sound, it wins.

The new file formats Sound needs (recorded sounds, loops, chords, motifs, music as an arrangement, folders in the
project file) are the framework's, in their own spec:
[AutomataFramework `docs/superpowers/specs/2026-11-15-sound-formats-design.md`](https://github.com/mcthaydt/AutomataFramework/blob/main/docs/superpowers/specs/2026-11-15-sound-formats-design.md).
This page says what a person does; that page says what the files hold.

## Principles served

- **2. iPad-first editors.** Sound is built to be used by touch on an iPad first: a sound is made by pressing a kind
  and moving a few sliders, music by pressing loops and chords, a motif by tapping a keyboard that only has the notes
  that fit. Nothing needs a mouse, a keyboard or a music lesson.
- **1. Agent-first.** Every sound, recording, loop, motif, track and "what plays when" is a documented file in the
  game's repo, written by the framework's `writeContent`. Every slider shows a number worked out from the file, never
  a setting kept elsewhere, so an agent that edits the file by hand sees the same screen afterwards.

It breaks none: 2D and 3D games hear the same files (Sound has no 3D version, per the first-layer spec), it lives in
this repo, and it adds no dependency (see "Constraints").

## Why

The first-layer spec gives Sound "sounds made of tones and noise, music, and what plays when". Today a person cannot
change any of it without an agent: the framework plays `sound`, `music` and `cues` files, and only an agent writes
them. The old attempt's Audio editor was voice-by-voice numbers (wave, start pitch, end pitch, start, length,
loudness), music beds as drones, and a page of event names: exact, but a non-technical teammate could not make a jump
sound with it, and its music part was never finished.

The Owner wants Sound to be where anyone on a team gives the game its sound, the way GarageBand lets anyone make a
song: whole sounds, whole loops and whole chords at the press of a button, recordings of their own, and auditory
motifs (a short tune the game comes back to) made and reused easily.

## Goals

1. **Sound opens on the level.** Each thing that makes a sound wears a note saying so, and the music is in the title
   block. A person thinks "what does the crate sound like?", not "what answers `crate.landed`?".
2. **A new sound in three presses:** pick a kind (Jump, Coin, Hit and the rest), press "Try another" until it is right,
   pick what sets it off. Plain sliders change it after; the voice-by-voice numbers are there for those who want them.
3. **Recorded sounds:** record with the microphone or bring in a sound file, trim it, keep it. It is saved as a sound
   file in the game's repo, under the framework's size limit.
4. **Music like GarageBand loops:** lanes across bars, whole loops pressed in as blocks, chords picked by press from
   those that fit the song's key, and no single notes to place unless a person wants to.
5. **Motifs made and reused easily:** tap a short tune on a keyboard that only offers the notes that fit; drop it into
   any track, set it to play when something happens, and change it with one press (Higher, Lower, Slower, Faster,
   Sadder, Brighter).
6. **Hear everything right where it is made**, through the framework's own speaker, the same way the game will play it.
7. **Nine languages, no default, drunk-grandma words,** in the Blueprint look, at the five sizes, with closable panels.
8. **Proven by journeys** in three browsers at five sizes, pictures for the Owner, and the two after-build audits.

## Non-goals

- **Sound effects that change with the game's state** (a sound that pitches up with speed, music that changes with
  danger). The cue format says "on this event, play this"; rules about state are a later framework cycle.
- **Mixing tools beyond two volumes:** no ducking, no reverb, no per-bus effects. The framework has music and sound
  volumes; Sound shows each file's own loudness and nothing more.
- **Recorded music.** Recordings are sounds (at most the framework's limit, 10 seconds). A track is made of loops,
  chords and motifs, which an agent can read and change; a recorded song is neither.
- **Voices, speech, captions.** Story's.
- **A 3D Sound.** The first-layer spec: Feel, Sound and Story are the same for 2D and 3D games.
- **Editing a game's code.** Events a game's code raises can be named and answered; the code is never shown.

## Anti-goals (a failure even if it works)

- A screen that makes a person read event names, hertz, or note names before they can hear anything.
- A slider, a "kind" or a key kept anywhere but the files, so the screen and an agent disagree about a sound.
- Music that can be made only by placing notes one at a time.
- A recording that leaves the device before the person presses Save or Export, or that is kept on the device after
  they leave.
- Sound that plays on its own when Sound opens, or that cannot be stopped with one press.
- Anything the game would play differently from how Sound played it.

## Decided with the Owner (2026-11-15)

| | Question | The Owner's answer |
|---|---|---|
| Q1 | What does Sound open on? | **The level**, in World's frame, with a note chip on each thing that makes a sound ("THUD" on the crate, "JUMP" on the hero), the music in the title block, and one "Whole game" chip for events with no place. A closable panel lists every sound and track. |
| Q2 | How does someone make a new sound? | **Start from a kind** (Jump, Land, Coin, Hit, Explosion, Door, Click, Power up); "Try another" gives a fresh take; plain sliders change it; the voice-by-voice numbers sit under "Every detail". |
| Q3 | How is music written? | In the Owner's words: "something like GarageBand loops where we can create/add midi like loops and just orchestrate, I'm leaning more towards full chords, full drum loops ECT; on a press of a button rather than individual notes; also auditory motifs are important, so make it easy to do that". |
| Q4 | Recorded sounds? | **Yes:** a microphone or a sound file, with a new framework format, files in the game's repo and a size limit. |
| Q5 | Where do loops, chords and motifs live, since today's music file cannot hold them? | **A: the framework gets new formats first**, in its own spec cycle (the formats spec above); Sound's music part waits for it. And, in the Owner's words: "It should be midi -> JSON and vice versa": a MIDI file can be brought in as the game's JSON, and any track, loop or motif can be taken out as a MIDI file. |
| Q6 | How does a new sound file get into the game, when the project file lists each file and the editors never touch it? | **A: the project file lists a folder once** ("every sound in `content/sounds`"); the template and the demo do that. For an older game Sound offers a one-time "Set up sounds", which adds that folder line. |

**A mismatch to settle in the plan stage:** the Feel editor's cycle chose to add one listing line to `automata.toml`
per new effect file, which is Q6's option C. Sound follows the Owner's Q6 answer (folders). Two editors listing new
files two ways would confuse agents and people alike; the coordinator should have Feel's plan follow the folder
listing, or ask the Owner which one holds for every editor. Until then this spec's rule is the Owner's answer.

## Approaches considered

1. **Build Sound on today's formats only** (tones and hiss, flat music rows, cues). No framework work, but it cannot
   do recordings (Q4) and it cannot keep loops, chords or motifs in the files (Q3), so an agent could never change a
   loop the editor placed. Rejected.
2. **A framework formats cycle first, then Sound in slices** (chosen). The framework adds the formats (its own spec),
   and Sound is built in slices that each stand on what is on `main`: sounds and "what plays when" on today's formats
   first, recordings once the framework reads them, music and motifs once the framework plays them. Each slice ships
   working screens; nothing waits on the whole.
3. **Port the old Audio editor and restyle it.** Its model is voice-by-voice numbers and music beds, which the Owner's
   answers (Q2, Q3) replace. Its sound picture (each voice as a bar across time, pitch rising or falling) and its
   "Nothing plays yet" list of unanswered events come over as ideas; its code does not.

## The frame

Sound is the level screen of the Blueprint redesign with Sound chosen in the switcher. Everything in that spec's
"The frame" holds: the level fills the window in its real art, the pill top left, the cluster top right, floating
panels, the title block and undo and redo bottom right, panels that close and open, pinch to zoom and two fingers to
move. What changes when Sound is chosen:

```
┌───────────────────────────────────────────────────────────────────────────────────────┐
│ ┌ Crate Game · Level 1 ┐ World Characters Feel ┌Sound┐ Story   ┌Find or do anything┐ ⚑ Share [Save] │
│ ┌────────┐                                                               ┌────────────────┐ │
│ │ SOUNDS │      ·  ·  ·  ·  the game's real art  ·  ·  ·  ·              │ JUMP            │ │
│ │ jump   │                ⌐JUMP¬                                         │ When the hero   │ │
│ │ land   │                 hero        ⌐THUD¬                            │ jumps           │ │
│ │ thud   │                             crate     ⌐+ SOUND¬ door          │ ▶ Play          │ │
│ │ meadow♪│                                                               │ Try another     │ │
│ │ + New  │                                                               │ Higher ───●──   │ │
│ └────────┘                                                               │ Longer ──●───   │ │
│ ┌ WHOLE GAME: level starts · MUSIC ┐                         ┌ title block: MUSIC MEADOW ┐ ↶ ↷ │
└───────────────────────────────────────────────────────────────────────────────────────┘
```

- **Left edge: the Sounds panel** (closable), in place of World's tools: every sound, recording and track, each with
  its icon (a wave, a microphone, a note) and its name, and "New sound" at the foot. Pressing one opens its card.
- **On the level: sound chips.** Each thing that sets off a sound wears a chip with the sound's name in capitals
  ("JUMP" on the hero, "THUD" on the crate), drawn as a drawing note with a leader line to the thing, like World's
  notes. A thing with more than one sound shows "3 SOUNDS", which opens a short list. A thing that could make a sound
  but has none wears a quiet "+ SOUND" chip when it is picked. Tapping a chip opens that sound's card and plays it
  once.
- **Bottom left: the "Whole game" chip,** for what has no place on the level: the level starting, a screen opening,
  events a game's code raises. It opens the same list as a thing with several sounds.
- **The title block** gains the level's music: "MUSIC: MEADOW", or "NO MUSIC" with "Add music". Pressing it opens the
  music screen.
- **Right side: the card** of the picked sound (below).
- **Play** (from the switcher's level, as in World) plays the level with its sounds and music; Sound's chips hide while
  it plays.
- **Upright and phone sizes** follow the redesign's rules: the Sounds panel becomes a list opened from the pill, the
  card is a bottom sheet, the chips and the title block stay. Nothing scrolls on a phone held upright except inside a
  declared region (the card's sheet, the music lanes).

### Which thing a sound belongs to

A cue answers an event by name, like `hero.jumped` or `crate.landed`. The chip goes on every thing in the level whose
character is the event's first word (the hero, every crate); an event whose first word is no character in the level
goes in "Whole game". (Amended by the plan audit, 2026-11-15: the framework names a built-in hero's events `hero.*`
whatever the hero's id, and a touch event after the touched character's `kind`, so "is the first word" means the
project's hero for `hero`, else a character whose `kind` it is, else one whose id it is.) This is worked out from the files each time, never kept. (My call: it is the rule the framework
already uses to name events after a character, `spark.taken`, `door.touched`.)

### What can set a sound off

When a person picks "When…" for a sound, Sound offers, in words, every event it can find in the framework and the
game's files: the built-in hero's events ("When the hero jumps", "lands", "starts walking", "jumps in the air", "slides
down a wall", "jumps off a wall", "dashes"), the touch events of each character that is touched ("When the hero takes
a spark", "touches the door"), "When the level starts", and every name already used in the game's cue and feel files.
"Name your own" takes a name for an event the game's own code raises; the screen shows it as the name, since that is
the developer's own word (the Owner, 2026-11-14: developer text stays untranslated). Every built-in event's words are
in the words tables in all nine languages. (My call: the list comes from files and the framework's documented events,
so it can never offer an event that cannot happen, and an agent sees the same list in the framework's docs.)

## A sound's card

What a sound file holds, in plain words:

- **Its name** as a title ("Jump"), its id under it as a label, and **▶ Play** (48 px), which plays it once through the
  framework's speaker. Play again while it plays starts it over. **Stop** is the same button while it plays.
- **"When…"**: what sets it off, as words ("When the hero jumps"), with "Change" and "Add another". One sound may answer
  several events; each is one cue.
- **A picture of the sound**: each voice as a bar across the sound's length, its pitch drawn rising or falling, a
  recording as its wave; a line moves across while it plays. At most 120 px tall.
- **Try another** (for a sound made from a kind): a fresh take of the same kind. Undo goes back to the last one.
- **The sliders:** Higher or lower, Longer or shorter, Louder or softer, Rougher or smoother. Each slider's place is
  worked out from the file (the sound's middle pitch, its length, its loudness, how much hiss and how buzzy its waves
  are), and moving it rewrites the voices. Each has − and + beside it, a press a step, so a slider never needs a drag.
- **Every detail** (closed at first): the voices one by one, as the file has them: for a tone, its shape (Smooth,
  Buzzy, Bright, Soft for sine, square, sawtooth, triangle), where its pitch starts and ends, when it starts, how long
  it lasts, how loud; for a hiss, its pitch, start, length and loudness; for a recording, the part of the file it
  plays, its speed and loudness. Numbers are the file's own (seconds, hertz), in JetBrains Mono, each with − and +.
  "Add a voice" and "Remove" here.
- **At the foot:** Duplicate, and Erase as in World (Undo brings it back). Erasing a sound that cues still name removes
  those cues too, and says so: "Jump will stop playing when the hero jumps."

### Making a new sound

"New sound" (in the panel, in a "+ SOUND" chip, and in the find bar) opens a tray of kinds, each a big button with its
icon and word that plays a sample when pressed: **Jump, Land, Coin, Hit, Explosion, Door, Click, Power up, Laser,
Blip**, then **Record** and **Bring in a file**. Pressing a kind makes a sound from it, plays it, names it after the
kind ("jump", then "jump-2" if that is taken) and opens its card with "When…" asked first. A kind is a recipe that
makes a sound's voices from a seed; the file holds only the voices it made. (My call: "Laser" and "Blip" join the
Owner's eight because they are the two most common sounds of small games after those; the plan may name others.)
Where the kinds live is the framework's (its formats spec), so an agent's `automata` command and the editor make the
same sounds.

### Recording

- **Record:** the first press asks the browser for the microphone, with one line first: "Sound needs your microphone
  to record. Nothing leaves this device until you press Save." A big round button records; a count shows the seconds
  left (up to 10); pressing it again stops. Denied or no microphone: "Sound can't hear your microphone. You can bring
  in a sound file instead." with that button.
- **Bring in a file:** picks a sound file from the device (any the browser can play: WAV, MP3, M4A, and others the
  browser knows). A file over 10 seconds opens trimmed to its first 10.
- **Trim:** the recording's wave, with two handles for where it starts and ends (each also with − and +), Play, and
  "Keep it". Silence at either end is trimmed when it is kept. (My call.)
- **What is kept** is the framework's recording format (its formats spec): one short mono sound file in the game's
  sounds folder, beside the sound file that plays it, never over the framework's size limit, written by the framework's
  writer so an agent makes the same bytes. The words say "Only bring in sounds you made or may use."
- **On the device:** an unsaved recording is held in memory only, never in the browser's storage; leaving with one
  unsaved asks "Leave without saving?" as for any change. (My call: a recording is a person's voice, so it is never
  kept where they did not put it.)

## Music

Pressing the title block's music, or a track in the Sounds panel, opens the music screen: the level fades behind, and
a floating panel fills the space between the pill and the title block.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ MEADOW   ▶ Play   Key: C major ▾   Speed: 110 ─●─   Loops forever ●                │
│        │ 1        │ 2        │ 3        │ 4        │ 5        │ 6        │         │
│ CHORDS │  C       │  Am      │  F       │  G       │  C       │  Am      │         │
│ DRUMS  │▓▓ Easy drums ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│▓▓ Fill ▓▓│▓ Easy drums ▓▓▓▓▓▓▓│         │
│ BASS   │░░ Bouncy bass ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│         │
│ KEYS   │▒▒ Soft chords ▒▒▒▒▒▒▒▒▒▒▒▒▒│          │▒▒ Soft chords ▒▒▒▒▒▒▒▒▒│         │
│ MOTIF  │          │▞ Hero's tune ▞│          │          │▞ Hero's tune ▞│          │
│ + Lane │                                                                          │
├──────────────────────────────────────────────────────────────────────────────────┤
│ LOOPS  [Drums] [Bass] [Chords] [Melody] [Motifs]   Easy drums ▶  Busy drums ▶  … │
└──────────────────────────────────────────────────────────────────────────────────┘
```

- **Lanes** run across bars: up to eight, each with its instrument's word (Drums, Bass, Keys, Pluck, Lead and the
  rest) and its loudness. "+ Lane" adds one.
- **The chord row** on top: one chord a bar, shown by its name in the song's key ("C", "Am"). Pressing a bar's chord
  offers, as big buttons, the chords that fit the key, each playing when pressed; "Try a progression" fills four bars
  with a well-known one that fits ("C, Am, F, G"). The chord row is what every Bass, Keys and Melody loop plays over,
  so changing a chord changes them all at once.
- **The loop tray** at the foot: loops by kind (Drums, Bass, Chords, Melody, Motifs), each with ▶ to hear it over the
  song's chords. Pressing a loop drops it as a block into the first free bar of the lane that suits it; dragging it
  places it anywhere. A block's end can be dragged to repeat the loop over more bars. A picked block has Move, Repeat,
  Copy, Remove, and − and + for where it starts and how many bars, so no drag is needed.
- **The loops are the framework's library** (its formats spec), original loops written as content, shipped with the
  framework. Using one copies it into the game's own files, so the game holds everything it plays and an agent can
  change the game's copy. (My call: no outside loop pack, so no licence or dependency.)
- **Key, speed and "Loops forever"** across the top. Changing the key moves everything with it, since loops and
  motifs are written in steps of the key, not in fixed notes.
- **Play** plays from the bar a person last touched, with a line moving across; pressing a bar's number plays from
  there. Stop is one press. Music never starts by itself.
- **Make your own loop** (in the tray, for those who want notes): a grid of one loop's steps, rows for drums or the
  notes of the key for the rest. It is the only place single notes are placed, and nobody has to go there.
- **MIDI in and out** (the Owner, Q5). On screen the two buttons read "Bring in a music file" and "Save for other
  music apps" (amended by the plan audit, 2026-11-15: this page's own words rule bans "MIDI" on a screen; the
  names below are what they do). "Bring in a MIDI file" (in the loop tray and in the Sounds panel's "New") reads
  a `.mid` file with the framework's converter and makes the game's own JSON: one track whose lanes are the file's
  instruments (its drum channel as Drums), its tempo, its key when the file names one, and the notes as loops, cut
  into bars. Notes that are not in the key are kept exactly, so nothing is lost. Before it is kept, a short panel
  says what came in ("4 lanes, 32 bars, 110 beats a minute") with Play and "Keep it". "Save as MIDI" on any track,
  loop or motif downloads it as a `.mid` file for any music program, made by the same converter, so an agent's
  `automata` command gives the same bytes. A MIDI file is never kept in the game: the JSON is the game's music, and
  MIDI is how it travels. (My calls: what the framework's converter keeps and drops is in its formats spec.)
- **Which music plays when** is cues, as for a sound: the track's card says "Plays when the level starts", with
  "Change". A level with no music shows "Add music", which offers to start from a style (Calm, Bouncy, Spooky, Brave,
  each a ready four-bar song from the library) or from nothing.

## Motifs

A motif is a short tune the game comes back to: the hero's few notes, the door's, the "you did it".

- **Make one:** "New motif" (in the loop tray's Motifs, the Sounds panel and the find bar) opens a keyboard of one
  octave and a bit, showing only the notes of the song's key (or C major outside a song), big enough for a thumb. Tap
  up to eight notes; each plays as it is tapped and lands as a dot in a strip above. "Even out" snaps them to the beat.
  Hold a dot to make it longer; drag it up or down a step, or use − and +. "Keep it" names it ("motif", "motif-2").
- **Use it everywhere:** drag it into any music lane (it plays in that lane's instrument and the song's key), or "Play
  it when…" (it becomes a sound that answers an event, played in an instrument picked by press).
- **Change it with one press:** Higher, Lower, Slower, Faster, Sadder (minor), Brighter (major), Backwards. Each use of
  a motif keeps which changes it has, so the door's motif can be the hero's, sadder, and changing the hero's motif
  changes both. The changes are in the file (the formats spec), never only on screen.
- **See where it is used:** a motif's card lists every place it plays ("In Meadow, bars 2 and 6", "When the door
  opens, sadder"), each a link there.

## Saving and exporting

As the Blueprint redesign says, with what Sound adds:

- **One change, several files.** A new sound is a sound file and a cue; a recording adds its recording file; using a
  library loop adds the loop's file. Save puts every file of one change into the game together, as one saved change
  (or one waiting change for Suggest and Approve); the stamp and the title block are as in World. Every file is
  checked by loading the whole game before anything is written, as Save does today.
- **New files go in the game's folders (Q6).** A new sound file goes in the folder the project file lists for sounds.
  A game whose project file lists no such folder shows, on Sound's first open: "This game isn't set up for sounds
  yet." with "Set up sounds", which adds the folder lines to `automata.toml` as part of the next Save, and says so on
  the stamp's line ("and set up sounds"). That is the only change to `automata.toml` the editors ever make, and only
  the framework's folder lines.
- **Export** copies the picked sound's file (or track's, or motif's) for an agent, as World copies a level. A change
  with a recording or several files offers "Save them as files", which downloads each file by its name in the game.
- **Undo and redo** cover every change in Sound: a new sound, Try another, a slider, a cue, a recording kept, a block
  moved, a chord, a motif change.

## Onboarding

Sound's first run, on a game that has sounds (the demo will, from the Examples repo's demo cycle; the test game does
from this cycle's build):

1. **They choose Sound in the switcher.** The level stays; the chips draw themselves in. One tip points at the hero's
   chip: **"Tap a sound to hear it"**.
2. **They tap it.** It plays, its card opens. The tip moves to Try another: **"Press Try another for a new one"**.
3. **They press it.** A new take plays. The tip moves to Save (or Export for a visitor), as in World: **"Nice. Now
   press Save."**
4. **They press it.** The stamp. Sound's first run is finished on this device (`af.guide.done`, Sound's own entry).

On a game with no sounds yet: the tip points at the hero: **"Give the hero a sound"**, which opens the tray of kinds;
pressing Jump makes the sound and its cue ("When the hero jumps") at once, and the run goes on from step 3.

Music and motifs each have their own first run the first time their screen opens: the tip points at the loop tray,
**"Press a loop to add it"**, then at Play, **"Press Play to hear your song"**. A motif's first run: **"Tap a few
notes"**, then **"Press Keep it"**. Recording's: the microphone line above is its first run. As in World, a person who
does something else is never blocked; the tip waits.

## Words and languages

- Every word is in `src/features/words/`, in all nine languages, no default, as the redesign says. New words: the kinds,
  the sliders, the instruments, the loop and style names, every built-in event's words, every line above.
- No word on screen says "event", "cue", "hertz", "MIDI", "waveform", "sample rate", "repo", "commit", "branch", "pull
  request" or "token". The file's own numbers show under "Every detail" as numbers with units ("440 Hz", "0.2 s"), the
  way World shows tiles.
- Chord names are written the same in every language ("C", "Am"), as musicians everywhere read them; note names are
  never shown outside "Make your own loop", where they are C, D, E (the plan may give the solfège names for the
  languages that use them, as a choice on that screen).
- Loop names in the framework's library come with words in the nine languages from the framework's own tables (its
  formats spec); a game's own loop or motif is named by its id, the developer's word.

## Hearing it

- **Everything plays through the framework's own speaker** (`webSpeaker`, `playVoice`), made on the first press of
  any Play in Sound, as browsers require. Until then Play says "Tap to hear". Sound never plays on its own.
- **One thing plays at a time** in Sound: a new Play stops the last. Stop is always one press, and leaving Sound stops
  everything.
- **The volume** is the device's; Sound plays every file at its own loudness, so what a person hears is what a player
  hears at full volume.

## Testing

- **Journeys** (the built suite in Chromium, WebKit and Firefox against the pretend GitHub, at the five sizes): Sound's
  first run on a game with sounds and on one with none; tapping a chip plays and opens the card (checked by the cue
  and speaker log, never by listening); a new sound from a kind, Try another, each slider by drag and by − and +, the
  "Every detail" fields; picking and adding "When…", including "Name your own"; Erase and its cue removed, then Undo;
  bringing in a file and trimming it (all three browsers); recording (Chromium and Firefox, with their fake
  microphones; WebKit is checked with a brought-in file); the music screen: adding a loop, repeating it, a chord, a
  progression, the key, Play and Stop; bringing in a MIDI file and saving a track as MIDI (the downloaded file read
  back by the framework's converter gives the same JSON); making a motif, using it in a lane and as a sound, each one-press change, and
  the "used in" list; Save of a change with several files and a recording, as Edit and as Suggest; Export; "Set up
  sounds" (Q6); leaving with an unsaved recording; every word in all nine languages.
- **Sound is tested by what plays**, through the framework's `testSpeaker` and the cue log in unit tests, and a
  recording speaker in the browser, as the framework's audio is.
- **The art is untouched:** as World's test, with the chips on and off.
- **Layout rules:** as the redesign's (no overlap, 44, 48 and 56 px, no cut word), on every Sound screen.
- **Files:** every file Sound writes is byte for byte what the framework's `writeContent` writes; a test edits each
  kind of file by hand as an agent would and checks Sound shows the change.
- **Tests run only in GitHub-hosted CI.**

## Review

As the redesign: the Owner sees every Sound screen in a screenshot artifact at phone landscape, phone portrait, tablet
portrait, tablet landscape and desktop landscape, said plainly whether it is the final look; then the two audits
(the drunk-grandma audit on Opus, the visual audit on Fable) and their fixes before the Owner's review.

## Constraints

- **No new dependency.** Sound plays through the framework's speaker, draws its pictures as page elements and SVG,
  reads a brought-in file with the browser's own decoding, records with the browser's own microphone recording, and
  writes recordings with the framework's writer. If the plan finds it needs anything else, it stops and asks the
  Owner.
- **The strict page header stays.** The microphone needs the page's permission rules to allow it for this site only;
  the plan names the one header line.
- **An editor changes only content files,** written by the framework's `writeContent`; the one exception (Q6) is the framework's
  sound folder lines in `automata.toml`, added only on "Set up sounds".
- **The device keeps only what `CLAUDE.md` allows.** Sound adds nothing to that list: an unsaved change is in the
  draft as today, except a recording, which is held in memory only.
- **The editors never run a game's code.** Play is the framework's built-in play.
- **Depends on, in order:** the Blueprint redesign's level screen (for the frame), the built-in hero (for its events
  and Play), the framework's formats cycle (for recordings, music and motifs), and the framework pin moved to it, in
  its own pull request.

## Left to the builder (the plan)

- How the work is cut into slices; the order this spec suggests: (1) the frame, chips, the card, kinds, sliders, "When…"
  and Save of several files, on today's formats; (2) recordings, after the framework reads them; (3) music and motifs,
  after the framework plays them.
- The exact maths of each slider (which fields each moves, by how much a step) and of "Try another", so long as each
  slider's place is worked out from the file.
- The list of instruments and the order of kinds in the tray.
- The exact chord buttons offered for each key (at least the six that fit: I, ii, iii, IV, V, vi).
- How the music screen lays out at phone upright (lanes scroll sideways in their own region).
- How the save of several files and a binary file is sent to the API.
- The list of every Sound screen state for the pictures and journeys.

## Calls I made (for the Owner to check)

- The chip rule (an event belongs to the character named by its first word, else "Whole game").
- The event list comes from the framework's documented events and the game's files, plus "Name your own".
- Laser and Blip join the eight kinds.
- Silence trimmed from a recording's ends when it is kept; recordings held in memory only until saved.
- Library loops are copied into the game when used.
- Chord names are the same in every language.
- A music style to start from (Calm, Bouncy, Spooky, Brave).
- A brought-in MIDI file becomes JSON and is not kept; "Save as MIDI" is on every track, loop and motif.
