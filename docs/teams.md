# A team's guide to the Automata Framework editors

For the person who owns a game and wants their team to change it by touch.

## Start

1. Open the editors' site and sign in with GitHub. That is only so people know who you are.
2. Press "Add the editor to a game of mine". GitHub asks which game; choose it. You only do this once per game, and
   you come back to the editors on your own.
3. Set up the game's main branch the way "Set up your game's main branch" below says. It is one setting, once.
4. Open the game, open a level, drag something and press Save.

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

## Set up your game's main branch

This is part of setting a game up, not an extra. It makes sure the only way a change reaches the game is through the
editor (or someone's own pull request), and that a Suggest-level person's change always waits for approval. In the
game's settings:

1. Open Branches and add a rule for the default branch.
2. Turn on "Require a pull request before merging" and set "Required approvals" to 1.
3. In the rule's bypass list, add **Automata Framework Editors**.
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
