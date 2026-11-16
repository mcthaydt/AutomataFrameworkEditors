// The frame every editor shares: the top bar and its menus, and what a workspace tells it. Nothing here knows what a
// level is; the workspace brings that.
export { default as Faces } from './Faces.svelte'
export { type MainButton, mainButton, type Status, type StatusFacts, statusOf } from './status.ts'
export { default as TopBar } from './TopBar.svelte'
export { EDITORS, TOOLS, type Tool, type Workspace } from './workspace.ts'
