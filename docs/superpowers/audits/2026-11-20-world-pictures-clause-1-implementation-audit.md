# Implementation audit: the pictures clause in CLAUDE.md (Editors #133), cycle 1

- **Examined:** pull request #133, head `ee8c88e3ca5ee7cda4f3fdca23d36bd239c81b73` (branch
  `claude/project-thread-c709zh-rules`), against main `016ab6f5b81d5fe1f6ded7389d5e481918657dc5`.
- **Lane:** 3 (`CLAUDE.md`). Lane 3 implementation audit; it does not merge, it waits for the owner.
- **Against:** the World plan at `8109888` (`docs/superpowers/plans/2026-11-16-world-editor.md`), "My calls" 17 and
  Task 44; the builder's brief `handoff/world/pr19.md`, "Then: Task 44's documents".
- **Verdict:** two reds. The clause's own half ("reads, and never writes, the pictures") is true of main, but the
  sentence it hangs on is not, and the rule it should amend still says the opposite.

## Criteria

| Criterion | Result | Evidence |
| --- | --- | --- |
| The diff is the clause and nothing else | Pass | `git diff 016ab6f...ee8c88e`: `CLAUDE.md` only, 2 lines in, 1 out, in the opening paragraph. One commit. |
| "Reads the pictures a game's tilesets name" is true of main | Pass | `src/features/service/pictures.ts` `readPictures` reads each listed tileset's `image` with `repo.readBytes` (PNG only, inside the game's folder, 1 MB each, 4 MB in all); `src/features/service/open.ts:52` calls it and sends them as `OpenAnswer.pictures`; `src/features/levels/art.ts` `readPictureOf` hands them to `loadArt`. |
| "Never writes" them is true of main | Pass | Every write goes through `commitFiles` (`src/features/github/commit.ts:65`) or `saveFile` (`src/features/github/repo.ts:254`), and both take `text` and encode it from a string: no path can carry a picture's bytes. `put` writes only paths in `allowedFiles` (`src/features/service/allowed.ts:21`): listed level and world files and new `content/levels|worlds/<id>.json`, never a `.png`. The other `saveFile` callers write fixed paths: `automata.access.toml` (`service/people.ts:94`), `automata.editors.toml` (`service/settings.ts:37`), `automata.notes.toml` (`service/notes.ts:129`). |
| The rest of the sentence is true of main | **Fail (R2)** | See R2. |
| The words match the plan's call and are plain | Pass, with R1 | Word for word Task 44's quoted clause. Plain. |
| The rule it amends now agrees with it | **Fail (R1)** | See R1. |
| No rule about what needs the owner changes | Pass | The diff touches the opening description only; Risk, lanes, approvals and Settings are unchanged. |
| PR body ends "Requested by **McThayDT**" | Pass | Last line of the body, read through the GitHub API. Attribution lines at the top are present. |
| Commit identity | Pass | Author and committer McThayDT `<107786093+mcthaydt@users.noreply.github.com>`; no co-author, session trailer or "Generated" line. |
| Draft CI at the head | Not settled | At audit time `commit-authors`, `plan` and `engines (webkit)` had passed; `check`, `engines (chromium, firefox)` and `mockups` were still queued. |

## Reds

**R1. The real "Content only" rule still says an editor opens only JSON, so the two rules disagree.**
- What is wrong: the plan's call 17 amends the rule that "an editor opens only the content files". At `8109888` that rule
  was `CLAUDE.md:19`; commit `129ca354` ("shorter CLAUDE.md") moved it to `.claude/skills/this-repo/SKILL.md:12`, where it
  still reads "An editor opens, writes and exports only the JSON content files a game's `automata.toml` lists". The
  pull request adds the exception to `CLAUDE.md`'s opening paragraph instead, and leaves that rule as it is.
- Evidence: `this-repo/SKILL.md:12` on main; `service/open.ts:52` opens PNGs on main.
- Expected: the one rule about what an editor opens and writes carries the exception, so no file says the editor opens
  only JSON.
- Fix (bounded): add to `this-repo/SKILL.md:12`, after the first sentence: "It also reads, and never writes, the pictures
  a game's tilesets name." Whether `CLAUDE.md` keeps a sentence as well is the owner's call; if it does, see R2.

**R2. "An editor changes authorable content and nothing else" is not true of main.**
- What is wrong: the clause is joined to a new sentence that says an editor changes authorable content and nothing
  else. The editors also write the sharing file, the editors' settings file and the notes file, none of which is a
  content file the game's `automata.toml` lists. The plan quotes this sentence as if it were already in `CLAUDE.md`; it
  never was (`git show 8109888:CLAUDE.md` has no "nothing else"), so the builder brought a claim in with the clause.
- Evidence: `service/people.ts:94` writes `automata.access.toml`; `service/settings.ts:37` writes
  `automata.editors.toml`; `service/notes.ts:129` writes `automata.notes.toml` on `automata/notes`.
- Expected: every sentence in `CLAUDE.md` is true of the code on main.
- Fix (bounded): drop the first half, leaving "An editor reads, and never writes, the pictures a game's tilesets name."
  (or drop the `CLAUDE.md` sentence entirely once R1 puts the clause in `this-repo`).

## Task 44: the features, the structure and the device's keys in `this-repo`

This meets Task 44; it is not a gap. Task 44 was written against the long `CLAUDE.md` of `8109888`. Since `129ca354`,
`CLAUDE.md` on main says "A repo's own layout, CI and rules go in its `this-repo` skill, not here", and the features,
the structure and the device's keys live there. They match what was built:
- Features, lowest first (`this-repo`, Structure) are the 19 folders in `src/features/` and the order of `LAYERS` in
  `tests/architecture/rules.ts`.
- Every `af.` key in `src/` (`af.guide.done`, `af.me.*` incl. `glass`, `af.recent`, `af.saved`, `af.signin.*`,
  `af.tip.*`, `af.tokens`, with `af.draft` in `game/drafts.ts`) is on the list.

Copying them into `CLAUDE.md` would contradict that rule and duplicate facts. The same reasoning is behind R1: the
pictures clause belongs beside those facts, in `this-repo`.

## Notes (not blocking)

- The PR title says "never write a game's pictures"; the clause is narrower (the pictures its tilesets name). Fine as a
  title.
- Graphify was not needed: the change is one docs sentence, and the read and write paths were found and read directly
  in the files above.
