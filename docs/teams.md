# A team's guide to the editors

For the person who owns a game and wants their team to change it by touch.

## Start

1. Open the editors' site and sign in with GitHub. That is only so people know who you are.
2. Press "Add the editor to a game of mine". GitHub asks which game; choose it. You only do this once per game, and
   you come back to the editors on your own.
3. Set up the game's main branch the way "Set up your game's main branch" below says. It is one setting, once.
4. Open the game, open a level, drag something and press "Put in game" (or "Send to check", if your level only
   suggests).

## What your team sees

Everything is on one screen, World, and works with a finger, a Pencil, a mouse or the keyboard:

- **A level.** Tap a thing to pick it, drag it to move it, and change its numbers on the settings that open beside it.
  The tools place new things, paint the ground, erase and join a plate to a gate. Undo and Redo are always at the top.
- **The map.** Press the map button to see every level of the game together, move levels, join them, or make a new one.
- **Play.** Press Play to try the level where it is drawn. It changes nothing, and Stop puts you back.
- **Changes.** Your changes stay on your device until you put them in the game, or send them to someone to check. The
  list shows what each one did.
- **Notes.** Leave a note on a level, a thing or a spot; anyone can answer it or mark it done.
- **Help.** The first time, a short tour. Help has the keys and the finger moves, and "For me" holds row size,
  see-through panels and tips, kept on that device only. The editors speak English, Spanish, Korean, Japanese,
  Chinese, Portuguese, French, Russian and German.

A game that belongs to an organisation works the same way: the people GitHub shows as admins of the game are Owners
here, with no need to add them to the sharing file.

## Share it

Press Share on the game's page (only an owner sees it). Send the link to the people you want to help, then choose what
each person may do.

| Level | What a person can do | What Save does |
|---|---|---|
| Look | See the game. | Nothing: they can try things, but cannot save. |
| Suggest | Change things. Someone has to approve the changes. | The change waits for approval. |
| Approve | Suggest changes, and approve other people's. | The change waits for someone else to approve it. Nobody at this level approves their own. |
| Edit | Changes go straight into the game. | The change goes straight in. They can approve waiting changes too, their own included. |
| Owner | Do everything, and choose who helps. | The change goes straight in. They can approve waiting changes too, their own included. |

"Anyone who opens the link and signs in" can be set to "Can't get in", "Look" or "Suggest". People you add by name get
the level you choose for them, or the higher of that and what anyone gets.

People need GitHub only to sign in. They never need to open it again.

## The file behind Share

Who may do what is one file in the game, `automata.access.toml`. The Share screen only edits it, and an agent or a
person can edit it by hand too. The game's owner (the account that owns the game) is always an Owner, whatever the
file says.

```toml
format = 1
everyone = "look"

[[people]]
github = "grandpa"
level = "approve"
```

`everyone` is `"nothing"`, `"look"` or `"suggest"`. `level` is `"look"`, `"suggest"`, `"approve"`, `"edit"` or
`"owner"`. If the file cannot be read, only the game's owner gets in, and the Share screen says the list was damaged and
that saving it again mends it.

## How strict the editors are

Besides who may do what, a game can say what the editors do when a change leaves a problem in it (a door that leads to a
level that is not there, say). That is one more file, `automata.editors.toml`, edited by hand or by an agent:

```toml
format = 1
problems = "warn"
```

`problems` is `"warn"` or `"stop"`. With `"warn"`, the editors save the change and show the problem, so a half-made game
can still be saved. With `"stop"`, they refuse a change that leaves a problem, and say what it is. With no file, it is
`"warn"`.

## Notes on a game

Anyone who may look at a game can leave a note on it: a few words about a level, a thing in it, or a spot on it. Anyone
can answer a note, and anyone can mark it done. The notes are one more file, `automata.notes.toml`, kept on their own
branch, `automata/notes`, so a note never changes the game and never waits for approval. An agent can read the file and
answer a note the same way a person does, by adding an answer under it:

```toml
format = 1

[[notes]]
id = "note-1"
level = "level-1"
thing = "crate-1"
at = { x = 3.5, y = 4 }
by = "kid"
when = "2026-11-16T10:00:00.000Z"
words = "The crate is too heavy."
done = false

[[notes.answers]]
by = "grandpa"
when = "2026-11-16T11:00:00.000Z"
words = "Made it lighter."
```

`thing` and `at` are optional. `automata/notes` is only for this file: do not open a pull request from it. A person
whose GitHub name is `notes` saves their changes to `automata/notes-` instead, so the two never meet.

## Set up your game's main branch

This is part of setting a game up, not an extra. It makes sure the only way a change reaches the game is through the
editor (or someone's own pull request), and that a Suggest-level person's change always waits for approval. In the
game's settings:

1. Open Branches and add a rule for the default branch.
2. Turn on "Require a pull request before merging" and set "Required approvals" to 1.
3. In the rule's bypass list, add **Automata Editors**.
4. In the game's settings, under General, leave "Allow merge commits" on. Approve merges with a merge commit, and a
   game that allows only squash or rebase merges makes Approve say that GitHub is stopping the editor.

Without step 3, Save and Approve say that GitHub is set to stop the editor, and nothing is changed. A rule that
requires checks to pass before merging also works: an approval waits until the checks have run.

## What Approve looks at

- **Checks.** The editor reads the change's own commit, and it reads GitHub's check runs, which GitHub Actions makes.
  A change whose checks are still running says so, and can be approved a minute later. A game whose checks report the
  older commit statuses counts as having no checks at all.
- **No checks at all.** A change is approvable two minutes after its newest save, so checks that have not been
  queued yet are not skipped. A second save on an old waiting change starts those two minutes again.
- **Your own change.** Edit and Owner may approve their own waiting change. Approve may not.
