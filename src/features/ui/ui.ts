// What every screen is made of. The older suite's four pieces (a Button, a Choice, a Notice and a Screen) stay until the
// screens that use them are replaced; the editors' look comes with the kit: a Dock, a Sheet, a Menu, a Segment, a
// Slider, a NumberPad, a Knob, a Note, a Tip, a list of Rows and an Icon.
import './ui.css'
import './fonts.css'

export { default as Button } from './Button.svelte'
export { default as Choice } from './Choice.svelte'
export { default as Dock } from './Dock.svelte'
export { loadLanguageFont } from './fonts.ts'
export { default as Icon } from './Icon.svelte'
export { ICONS, type IconName } from './icons.ts'
export { default as Knob } from './Knob.svelte'
export { default as Menu } from './Menu.svelte'
export { default as Note } from './Note.svelte'
export { default as Notice } from './Notice.svelte'
export { default as NumberPad } from './NumberPad.svelte'
export { default as Rows } from './Rows.svelte'
export { default as Screen } from './Screen.svelte'
export { default as Segment } from './Segment.svelte'
export { default as Sheet } from './Sheet.svelte'
export { default as Slider } from './Slider.svelte'
export { snap } from './slider.ts'
export { default as Tip } from './Tip.svelte'
