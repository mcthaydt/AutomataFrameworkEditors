# The Feel editor (2D): plan audit

Stage 3 of Cycle 5, 2026-11-15. The plan is [`plans/2026-11-15-feel-editor.md`](../plans/2026-11-15-feel-editor.md)
(pull request 35, which also holds the spec's Q4 amendment); the spec is
[`specs/2026-11-15-feel-editor-design.md`](../specs/2026-11-15-feel-editor-design.md) (pull request 30). Its framework
half is AutomataFramework's plan G (pull request 107), audited at the same time in
`docs/superpowers/audits/2026-11-15-live-tuning-plan-audit.md` there. Done with the project's audit prompt: "Audit all
of your work for completeness, consistency, cohesion, and harmony, both within itself and relative to the spec and
relative to the codebase. Assume nothing. Verify everything. Investigate any incomplete implementations or incomplete
integrations. Do your best work."

Read beside it: the redesign's spec and plan (its Task 19, Play, and its layer list), this repo's `main` (`service/save.ts`,
`game/draft.ts`, `wire/wire.ts`, `tests/architecture/rules.ts`, the three test games), the 2D figure builder's plan
(pull request 36), plan H as it stands on its branch (AutomataFramework pull request 101), plan F's plan (pull request
111) and the sound formats spec (pull request 106). Nothing was run: this stage reads documents and code.

**Verdict: sound, with three important fixes and six small ones, all made in the plan (and two words in the spec) in
this pull request.** The Owner's four answers are built as given, Q4 as he changed it. The gates are right: no task
here starts before the Owner's yes to the mockups of all the editors, the redesign's Tasks 1 to 19, plan H, plan G and
this audit. No Owner question is open. One call between two plans of this repo is for the coordinator (E3).

## Findings

| # | Weight | Finding | Fix (made here) |
|---|---|---|---|
| E1 | Important | Two of the spec's slider words break the spec's own limit of 32 characters, which Task 10's words test holds in every language, English included: `wall-jump-lock` "How long it keeps away from the wall" is 36 and `walk-grip` "How quickly it gets going and stops" is 35. The test would fail on the English row the plan fixes. | "How long it stays off the wall" (30) and "How fast it starts and stops" (28), in Appendix A and in the spec's table, listed as a deviation. The other sixteen are 31 or under. The eight other languages will be tight at 32; the builder shortens, the test stands. |
| E2 | Important | Ruling 6 stops both `keydown` and `keyup` from leaving a Feel panel. The framework listens on the window and lets go of a key "wherever the event went" (`input/keyboard.ts` on plan H's branch), so a person holding ArrowRight to walk who taps a slider and then lets go would leave the hero walking. | Only `keydown` is stopped; `keyup` always reaches the window. One more case in Task 8's `feel-play.browser.test.ts`. (The framework already ignores a key typed into an `input`, so the range sliders were safe; buttons were not.) |
| E3 | Important | Task 2 and the 2D figure builder's Task 2 (pull request 36) widen the same API save in two different shapes. Feel's is `EDITABLE = ['level', 'tuning']` with a test that a character file's path is `not-allowed`; the figure builder's is `saveChange`, one change of several content files of any listed type (characters and figures among them), with pictures and `list` for new `automata.toml` entries. Whichever built second would have to undo the first, and Feel's character test would fail the figure builder's saves. Feel's Task 13 also planned its own several-file commit "through GitHub's tree calls", which `saveChange` already is. | Ruling 20 now follows this repo's `CLAUDE.md` rule (any content file `automata.toml` lists) and the figure builder's shape: whichever cycle builds first builds `saveChange`; the other adds only what it lacks. Task 2's test checks an unlisted path and a wrong type instead of a character. Task 13 adds only a removed file and a file new to a listed folder. Reported to the coordinator, who orders the two cycles. |
| E4 | Minor | Task 1 pins "plan G's merge commit". Plan F (pull request 111) adds `Host.reducedMotion()`, and if it lands first every hand-made `Host` in this repo must gain it when the pin moves. | The pin moves to the framework's `main` as it then is, at or after plan G, with any `Host` fixed in the same commit. |
| E5 | Minor | "Before starting" line 6 names the content folders by the spec's pull request (106) only; the plan is plan M (pull request 112). Gap G1 asks for plan F's call, which plan F's plan now names. | Both named: plan F 111, plan M 112, and G1 points the amendment at `Game.showFeel(file, at?)` and `Game.feel()`, to be checked on `main`. G2's answer is in the sound formats spec ("Folders in the project file, for any content kind", `{ type = "sound", folder = "content/sounds" }`, one level deep), which matches the spec's amended Q4. |
| E6 | Minor | The spec puts Reset "beside a number"; the plan hid it inside the opened info, without listing the change. Hidden, a person who has slid a number too far has no visible way back but Undo. | Reset shows beside the value once the number has moved (44 px, icon and word) and is absent at the framework's value, as the spec says. Range stays inside the info. |
| E7 | Minor | The spec says both "Moves opens playing" and that Moves opens with the level still and the tip "Press Play and jump." | The plan follows the second, which the first run needs; now listed as a deviation. |
| E8 | Minor | `walker-game` takes `plain-game`'s level, crate and a hero without a figure. `game.heroes()` is empty for a hero with no figure in a level with no view (plan H's `game.ts`), so `hero()` would stay undefined and the note could not follow it. | Said in Task 8: there the note stays at the start, and no journey plays `walker-game` (none did). |
| E9 | Minor | Feel starts its play through `levels/play.ts`, which the redesign lets anything load only with `await import` (its Task 19 and the rule in `rules.ts`). Task 8 did not say so. | Said in Task 8. |

## Checked and found right

- **The spec, section by section.** The self-review's coverage table holds: every goal, every part of "The screen",
  the eighteen numbers, the range, "Feeling it", undo and saving, Controls, Effects, the first run, Agent-first,
  Languages and the eight journeys each have a task and a test. The deviations the plan lists (Q4, find-bar ids,
  `jump-cut`'s shares, the eight languages written by the build, `walker-game`, the waiting tune's view, the frame kept
  while playing) are reasoned; E6 and E7 are added to them.
- **Q4 as amended** (`6d5355a`): the spec's three passages and the plan's Part 3 agree. Adding or removing an effect
  touches no line of `automata.toml`; only a game with no effects folder gets the one entry, with its first effect.
  Task 13 changes this repo's `CLAUDE.md` rule to say so.
- **The framework's numbers.** Every default, limit and step the plan's tests quote agrees with `MOVE_NUMBERS` on
  plan H's branch: `jump-speed` 12, 4 to 30; `jump-cut` 0.5, 0.1 to 1, step 0.05 (so ruling 12 is right that no step
  lands on a third); `walk-grip` 3 ticks is 0.05 seconds; `ledge-grace` 6 is 0.10; `dash-rest` 30 is 0.50. The refusal
  Task 2 quotes, `"jump-speed" can be 4 to 30`, is `heroTuningProblems`'s own sentence, and the clash and "kept for the
  game's menus" sentences Task 12 quotes are `tuning.ts`'s. A key list is at most 8 and a gamepad list at most 4 there,
  as Task 12 says. `canPlay` is the hero having `moves` (the redesign's Task 19, G1), so a hero moved by its own code
  never reaches Feel's Play.
- **The code it builds on.** `af.draft:` keys are by path (`game/draft.ts`), so a tuning file's draft needs no new key
  shape, and `af.tip.*` is already on `CLAUDE.md`'s list. The API's save already refuses an unlisted path, writes
  `writeContent`'s bytes, checks the id against the file's name and that the whole game loads (`service/save.ts`), so
  Task 2 widens one check and adds none. The layer list (`find` after `levels`) is the redesign's; `feel` goes between.
  `game.sim.query` and `Moves.face`, `Moves.stood` exist for Task 8's `hero()`; dash is a flick of the walking thumb
  on plan H's branch, as Controls' touch line says.
- **The tracker.** Stage 4's 60 points add up (eleven tasks of 4, Task 12's 4, Part 3's 12), and with the other
  stages make 100.

## For the coordinator (not the Owner's)

- E3: the order of the Feel cycle and the figure builder cycle decides which builds `saveChange`.
- This repo's tracker has two "Cycle 4" sections once the figure builder's pull request 36 merges (the environment
  builder's on `main`, and its own). Feel's Cycle 5 is unique today.

## Progress

Stage 3 done: Cycle 5 is at 12%. Stage 4 still waits for the gates above.
