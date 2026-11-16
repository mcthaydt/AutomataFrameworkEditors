// The device: what size and kind of screen this is, what is pointing at it, and the person's own "For me" choices.
// Nothing here draws; the shell reads it when a panel opens.

export { glassOn } from './glass.ts'
export { keepMe, languageFor, ME_DEFAULT, type Me, readMe } from './me.ts'
export { nextPointers, type PointerKind, type Pointers, rowSize } from './pointer.ts'
export { deviceWord, type SizeClass, sizeClass } from './size.ts'
