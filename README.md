# AutomataFrameworkEditors

The Automata Framework editors, for games made with [AutomataFramework](https://github.com/mcthaydt/AutomataFramework). A team opens its
game from its GitHub repository and changes its authorable content, the JSON files, by touch on an iPad. The code is
the agents' work; the editors never show it or touch it.

Anyone can try the example game and keep a copy of a level without signing in. Saving into a game needs a sign-in, and
the game's owner chooses what each person may do. People need GitHub only to sign in.

## Start

- **A team:** read [`docs/teams.md`](docs/teams.md). Add the editor to your game once, then share it.
- **Whoever runs the site:** read [`docs/deploy.md`](docs/deploy.md).
- **Trying it:** open the site and press "Try it now".

## What each level can do

| Level | Can | Save does |
|---|---|---|
| Look | See the game, and try things on the screen | Nothing |
| Suggest | Change things | The change waits for someone to approve it |
| Approve | Suggest, and approve other people's changes | The change waits for someone else to approve it |
| Edit | Change things, and approve | The change goes straight into the game |
| Owner | Everything, and choose who helps | The change goes straight into the game |

Who has which level is the file `automata.access.toml` in the game. The Share screen edits it; an agent can too.

## Links

A game opens at `#/game/<owner>/<name>`, a level at `#/game/<owner>/<name>/level/<id>`, the waiting changes at
`.../waiting`, one of them at `.../waiting/<number>`, and the Share screen at `.../share`.

## For agents

Every change the editor makes, an agent can make by editing the same files: a level is a JSON file written exactly as
the framework's `writeContent` writes it, and who may do what is `automata.access.toml`. A change that waits for
approval is an ordinary branch and pull request. A level's text can also be copied from the editor ("Copy this level")
and pasted straight to an agent.

## How it is built

The page is Svelte 5, built by Vite into static files. The page talks only to this site's own `/api`, which is one
Cloudflare Pages Function wrapping the `service` feature; the Function acts as the editors' GitHub App, so the page
never speaks to GitHub except to send a person to its sign-in page and back. Features import only from features
below them; `tests/architecture.test.ts` checks it.

Tests run only in GitHub's CI: unit tests in Node, component tests in Chromium, WebKit and Firefox, and journeys that
drive the built page in each of them against a pretend GitHub.

## License

MIT
