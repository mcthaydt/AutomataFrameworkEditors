# Setting the editors up

This is for whoever runs the site. It takes four steps and nothing here needs a computer of your own: Cloudflare builds
and hosts the page and its one Function, and GitHub keeps the games.

The site runs on Node 24 and pnpm 10.34.6 (the versions this repository is tested with).

## 1. Make the site on Cloudflare

1. In Cloudflare, make a Pages project from this repository.
2. Build command: `pnpm build`. Output folder: `dist`. Node version: 24.
3. Note the address it gives you, for example `https://automata-editors.pages.dev`. The next step needs it.

Cloudflare builds the Function in `functions/` by itself. There is nothing else to build.

## 2. Make the GitHub App

On GitHub, in the settings of the account that will own the editor, make a new GitHub App.

- **Home page:** the address from step 1.
- **Callback address:** the same address, with a `/` at the end. Sign-in comes back here.
- **Setup address:** the same address again. Turn on "Redirect on update". This is where a game's owner lands after
  adding the editor to a game.
- **Repository permissions:** Contents (read and write), Pull requests (read and write), Checks (read) and Metadata
  (read). Nothing else.
- **Account permissions:** none.
- **Webhook:** off.
- **Who can install it:** any account.

Then make a client secret and a private key. Keep both for step 3.

The App has one callback address, so a preview address cannot sign in. Only the address you gave works.

## 3. Give Cloudflare the settings

In the project's settings, set these. The first group is read when the page is built; the second is read by the
Function when it runs. The secret and the key go in as encrypted secrets, and the key is pasted whole, exactly as GitHub
gave it.

Build (the page):

- `VITE_GITHUB_CLIENT_ID`: the App's client id.
- `VITE_GITHUB_APP_SLUG`: the App's name as it appears in its address, `github.com/apps/<slug>`.
- `VITE_DEMO_GAME`: `owner/name` of a public game the editor has been added to. It is the game "Try it now" opens.
  Leave it out and the site has no "Try it now". It must be the same value as `DEMO_GAME` below.

Run time (the Function):

- `GITHUB_CLIENT_ID`: the same client id.
- `GITHUB_CLIENT_SECRET`: the client secret.
- `GITHUB_APP_ID`: the App's id.
- `GITHUB_APP_PRIVATE_KEY`: the private key.
- `DEMO_GAME`: the same `owner/name` as `VITE_DEMO_GAME`. It is the only game a visitor who has not signed in can open.

Then deploy again so the page is built with them.

## 4. Check it

1. Open the site in a browser that has never seen it. You should see "Try it now" and "Sign in with GitHub".
2. Press "Try it now", drag the crate, and press "Save it as a file". The level's file should arrive.
3. Go back, sign in, add the editor to a game of yours, open a level, move something and press Save. The screen should
   say "Saved. Your game has the change." and the change should be a new commit on the game's main branch that touches
   only that level's file.
4. If it says GitHub is set to stop the editor, the game has a branch rule that does not let the App past it. See
   [`teams.md`](teams.md).
