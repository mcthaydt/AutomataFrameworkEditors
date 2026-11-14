# A team's guide to the editors

For the person who owns a game and wants their team to change it by touch.

## Start

1. Open the editors' site and sign in with GitHub. That is only so people know who you are.
2. Press "Add the editor to a game of mine". GitHub asks which game; choose it. You only do this once per game, and
   you come back to the editors on your own.
3. Open the game, open a level, drag something and press Save.

## Share it

Press Share on the game's page (only an owner sees it). Send the link to the people you want to help, then choose what
each person may do.

| Level | What a person can do | What Save does |
|---|---|---|
| Look | See the game. | Nothing: they can try things, but cannot save. |
| Suggest | Change things. Someone has to approve the changes. | The change waits for approval. |
| Approve | Suggest changes, and approve other people's. | The change waits for someone else to approve it. |
| Edit | Changes go straight into the game. | The change goes straight in. They can approve waiting changes too. |
| Owner | Do everything, and choose who helps. | The change goes straight in. |

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

## If your game guards its main branch

You can ask GitHub itself to stop your own collaborators changing the game directly. In the game's settings:

1. Open Branches and add a rule for the default branch.
2. Turn on "Require a pull request before merging" and set "Required approvals" to 1.
3. In the rule's bypass list, add **Automata Editors**.

Without step 3, Save and Approve say that GitHub is set to stop the editor, and nothing is changed. A rule that checks
must pass before merging also works: an approval waits until the checks have run.

Checks are read from the change's own commit. A change whose checks are still running says so, and can be approved a
minute later.
