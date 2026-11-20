# World play tools (plan pull request 17, Task 42): implementation audit, cycle 1

Audit all of your work for completeness, consistency, cohesion, and harmony, both within itself and relative to the spec and relative to the codebase. Assume nothing. Verify everything. Investigate any incomplete implementations or incomplete integrations. Do your best work.

- Pull request: #123, `claude/project-thread-8j24v5`. Lane 2. Reviewed by a fresh session that did not build it.
- Commit examined: `28d34ddad07260f0fb64314ce95d8c42c9b98edf` (the merge of main's glass into Task 42). Base `5021c69`.
- Read against: plan Task 42 (commit 8109888), the builder's brief (`handoff/world/pr17.md`), the PR body.
- Verdict: **2 red, 6 notes.** Nothing is wrong with what people see; the reds are two tests that say less than the plan or the old test said.

## What ran (and what did not)

| Check | Result |
| --- | --- |
| `pnpm lint && pnpm knip` | clean |
| `pnpm typecheck` | 0 errors, 0 warnings |
| Chromium browser tests (`tests/features/play` filter runs all 22 files) | 190 passed |
| Journeys `play` and `open-game` (Chromium, built page) | 24 passed |
| Draft CI on this head | quick gate, quick engines (chromium), browsers chromium 1 to 6, screens, mockups, commit-authors: success |
| WebKit and Firefox | **not run**: no such browsers in this container, and draft CI does not run them. They run in the full run after ready. |
| Node version | this container has Node 22.23.5, the repo wants 24; lint, typecheck and the browser tests ran anyway |

## Judgement 1: the weight test

I re-measured the Crate Game fixture (hero walking right from its start, tiles the crate moved, Chromium, the fixture's own `heavy`):

| How heavy | 60 ticks | 120 ticks |
| --- | --- | --- |
| 0.5 | 2.42 | 8.01 (at the wall) |
| 1 | 2.29 | 7.83 |
| 2 | 2.06 | 7.28 |
| 3 | 1.83 | 6.74 |
| 4 | 1.63 | 6.22 |

The builder's numbers are exact. I then widened the fixture's `most` to 16 for one scratch run (not committed): at 60 ticks, 1 gives 2.29, 4 gives 1.63, 8 gives 0.96, 16 gives 0.21.

- **The plan's number was a wrong prediction; the framework does not fall short.** The framework's own F4 test asserts weight 8 is pushed less than half as far as weight 1 at 60 ticks. Measured here: 0.96 / 2.29 = 0.42, so that claim holds. The plan used 4 against 0.5 under 120 ticks, but the fixture's top weight is 4, which at 60 ticks is 0.67 of the light crate, and the hero sets its own speed each tick, so a heavy crate slows the push without stopping it. At 120 ticks the light crate is also at the wall, so that measure is cut short whatever the weight. The plan's "less than half" needs a weight of about 8, which the fixture does not offer.
- **Without the change the test fails for the right reason:** with `weight` taken out of `crate.json`, only this test fails (heavy no longer slower), 189 others pass.
- **Is 0.75 the tightest honest bound? No.** The measured ratio is 0.674 and the sim is deterministic, so a bound of 0.7 is honest and leaves 4 percent of room; 0.75 leaves 11. Also the test's title says "a third less far", which 0.75 does not assert (that is a quarter). See N1.

## Judgement 2: the old tests that used a missing character

Names in the PR body: `play.browser.test.ts` (one test removed, two added) and `world-play.browser.test.ts` (two tests changed). Reading the diff:

- The missing character is no longer the cannot-play case because the plan (M3) says it now plays with the thing left out; a missing tileset is a fair stand-in for "the framework refuses the level", and the new "left out" test fails when `withoutLostThings` is removed (checked). So the swap is right.
- **But two assertions got weaker.** See R1.

## Judgement 3: every test in plan Task 42 Step 1

Each test below was checked by breaking the code it covers (a mutation run, then restored) and reading which tests failed.

| Plan Step 1 | Test | Fails without the change |
| --- | --- | --- |
| step moves the tick by one | `paused, one step moves the tick by exactly one…` and the PlayBar `one step shows only while…` | yes (step made a no-op: both fail) |
| slow halves the ticks | `slow halves the ticks in a second, and slower quarters them` | yes (setSpeed no-op) |
| back through the strip after 5 s | `after five seconds of play, going back…` and `the strip goes back through the last seconds` | yes (backTo no-op: both fail; `keepSeconds` removed: 3 fail) |
| play from a tapped spot | `play from a spot starts the hero there…`, `spot.test.ts`, and the journey | yes for `arrive` removed (2 fail); see N2 for the tap glue |
| walking through `exit` opens room-2, top bar says so | `walking through a door tells the screen where it leads, once` and the journey | the door is told (yes: `ondoor` off fails it); **the top bar is not asserted anywhere: R2** |
| door into a missing level: "1 problem", Play says why | `open.test.ts` and the `open-game` journey | yes (stop-the-play removed: 2 fail) |
| missing character plays with the thing left out, problem still listed | `a thing whose character is gone is left out…` | yes |
| world file naming a missing level: level alone, doors shut | the play and bar tests | yes (`doorsShut` false: 2 fail) |
| crate at 4 goes less far than at 0.5 | the weight test | yes (see above), but the bound differs from the plan: N1 |

The word "listed" in the missing-character row is covered by `problemsOf` being unchanged in what it lists; the "left out" test does not itself read the list.

## Acceptance against the brief, one by one

- Every Step 1 test exists, failed first, and passes in Chromium: **pass** (WebKit and Firefox: not run here, CI after ready).
- Lint, typecheck, knip, node: **pass** (CI's node run is the gate; I ran the Chromium browser project and the two journeys).
- Mockups the plan names (`world-levels-play`, `world-levels-play-from`): the PR names the sketch file and says what differs ("Start again" keeps its name; icons with spoken names). **Pass.**
- Design instructions on every new surface, seen at computer (1280 by 800), iPad sideways (builder's shots) and phone (390 wide): bar `glass-1`, the "Play from here" strip and the no-doors note `glass-2`, no colour, blur or dimming of their own in the diff; every icon-only button has a spoken name and a tooltip (checked in the diff and by the tests for step and speed); on a phone the six buttons share one line, all 44 px or more in the screenshots; the lone strip text ("Drag back to see it again", the clock) is readable on the glass. **Pass.**
- Run like a person at computer size (the builder did not): the bar at the top left, play, one step (only when paused), speed "Slow" with its word, start again, "Play from here", bigger, and the strip with a clock; "Play from here" shows its centred bottom strip with Cancel; a tap at tile 8 puts the hero at tile 8; a door followed from room 1 opens Room 2 in the route and the top bar ("Levels · Room 2") and the play goes on beside the door; a game with a door into a missing level opens with "1 problem" and Play shows "There is no level called "room-9". This game has: room-1, room-2, room-3." **Pass.** Pictures: `computer-1` to `computer-9` and `phone-1` to `phone-4` in the reviewer's scratch folder (not in the repo).

## Findings

### Red

**R1.** UNIT: `tests/features/play/world-play.browser.test.ts` ("a level that cannot be built is not started…") and `tests/features/play/play.browser.test.ts` ("a door into a level that is not there stops the play…"). VERDICT: red. REQUIREMENT: "Never loosen a test"; M3 says the framework's sentence is what the person reads. REASON: the swap from a missing character to a missing tileset made two assertions weaker. EVIDENCE: before, the test asserted the whole sentence `There is no character called "ghost"`; now it asserts only `toContain('nowhere')`, though the real sentence is `There is no tileset called "nowhere". This game has: ground.` (measured). The `not.toContain('[0]')` guard on "no place in the file" now guards nothing, because a missing tileset has no `[0]` in it. The removed play-level test also asserted that the sentence lines carry no `.json` or `[n]` and that no canvas is made; the new door test asserts only the class and `room-9`. EXPECTED: the whole sentence is asserted, and the "no file, no place, no canvas" checks hold for a case that could leak one. FIX: in `world-play.browser.test.ts` assert `There is no tileset called "nowhere"`; in `play.browser.test.ts` add to the door test `expect(caught.lines.join(' ')).not.toMatch(/\.json|\[\d+\]/)` and `expect(box.querySelector('canvas')).toBeNull()`. Only those two files.

**R2.** UNIT: `tests/journeys/play.journey.test.ts` (the door journey). VERDICT: red. REQUIREMENT: plan Task 42 Step 1: walking through `exit` "opens room-2 in the editor and the top bar says so". REASON: the journey asserts `location.hash` and `page.url()` only. EVIDENCE: the top bar does read "Levels · Room 2" (my run at computer size, shown), but no test would fail if the list or the top bar kept saying Room 1. EXPECTED: the journey reads the top bar's level name. FIX: after the hash wait, `await page.getByText('Levels · Room 2').waitFor()` (the exact words are in `computer-7`); optionally the list's current row too. Only that file.

### Notes (kept apart, not blocking)

**N1 (weight).** Tighten the bound to `light * 0.7` (measured 0.674, deterministic) or rename the test to "less far" ("a quarter less" for 0.75). Add that 8 against 1 under 60 ticks is the framework's own claim, so this test is about the editor's play passing `heavy` through, not the physics. The lead should write in `progress.md` that the plan's "less than half at 120 ticks" was a wrong prediction (fixture tops out at 4, the light crate hits the wall by 120), not a framework gap.

**N2 (tap glue).** The component test "Play from here waits for a tap…" is titled "a tap starts the hero there" but ends with no assertion on where the hero is. Breaking the tap's x by 8 tiles passes all 190 browser tests; only the journey caught it (it failed, at 17 s, because the hero from tile 4 never reached the door). Add a hero-position assertion to the component test.

**N3 (speed after a door).** `PlayPart` is remounted for each level (`{#key levelId}`), so a person who chose Slow is back on Normal in the next room. Read in code; not run. Either keep the speed in World or accept it and say so.

**N4 (waiting for a tap).** While the "tap the level" strip is up the game keeps running (the clock moved 0:03 to 0:04 in my shot), so the hero can move before the tap. Fine for now; pausing while waiting might be kinder.

**N5 (tip over the bar).** The builder reports the first Play's tip card sits over the bar's second row on iPad until "Got it". At computer size it sits beside the bar and covers nothing. Pre-existing placement.

**N6 (words).** Nine languages present for every new row; plain wording in English. None were read by a native speaker (plan #219 holds that), for example the Chinese `这次玩不能走门` reads a little stiff.

**N7 (`following` flag).** `World.svelte` sets `following = true` before `go(...)` and clears it in the level-change effect; if a door ever led to the level already open, the effect would not run and the next real stop would be skipped once. Read in code; the framework does not make such a door today.

## What the next cycle reads

Only the fix diff: the two test files for R1, the journey for R2, and whichever notes the builder takes.
