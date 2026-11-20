// The frame every editor shares: the top bar and its menus, and what a workspace tells it. Nothing here knows what a
// level is; the workspace brings that.
export { type Docks, floating, type HoldButton, type Layout, layout } from './docks.ts'
export { default as Face } from './Face.svelte'
export { default as Faces } from './Faces.svelte'
export { default as Find } from './Find.svelte'
export { type Found, type Go, parseGo } from './find.ts'
export { default as Help } from './Help.svelte'
export { default as Hold } from './Hold.svelte'
export { default as Keys } from './Keys.svelte'
export { commandFor, KEYS } from './keys.ts'
export { default as Language } from './Language.svelte'
export { default as ListPanel } from './ListPanel.svelte'
export { default as Settings } from './Settings.svelte'
export { default as SettingsPanel } from './SettingsPanel.svelte'
export { type MainButton, mainButton, type Status, type StatusFacts, statusOf } from './status.ts'
export { default as Toolbar } from './Toolbar.svelte'
export { default as TopBar } from './TopBar.svelte'
export { default as Tour } from './Tour.svelte'
export {
  finishGuide,
  guideWanted,
  type Happened,
  keepTick,
  readTicks,
  STEPS,
  type Step,
  stepsIn,
  type TourState,
  tourFrom,
  tourNext,
} from './tour.ts'
export { default as Welcome } from './Welcome.svelte'
export { EDITORS, TOOLS, type Tool, type Workspace } from './workspace.ts'
