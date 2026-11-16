// The frame every editor shares: the top bar and its menus, and what a workspace tells it. Nothing here knows what a
// level is; the workspace brings that.
export { type Docks, floating, type HoldButton, type Layout, layout } from './docks.ts'
export { default as Faces } from './Faces.svelte'
export { default as Hold } from './Hold.svelte'
export { commandFor, KEYS } from './keys.ts'
export { default as ListPanel } from './ListPanel.svelte'
export { default as SettingsPanel } from './SettingsPanel.svelte'
export { type MainButton, mainButton, type Status, type StatusFacts, statusOf } from './status.ts'
export { default as Toolbar } from './Toolbar.svelte'
export { default as TopBar } from './TopBar.svelte'
export { EDITORS, TOOLS, type Tool, type Workspace } from './workspace.ts'
