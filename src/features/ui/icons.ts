// The icons the editors use, by the job each does. Every one is Phosphor's regular drawing: the package's own SVG
// file, read as text at build time, so it is the same bytes the site ships and it fills with the colour of the words
// beside it (`fill="currentColor"`). Nothing here is fetched, so the page's strict header has nothing to refuse.
import arrowClockwise from '@phosphor-icons/core/assets/regular/arrow-clockwise.svg?raw'
import arrowCounterClockwise from '@phosphor-icons/core/assets/regular/arrow-counter-clockwise.svg?raw'
import arrowDown from '@phosphor-icons/core/assets/regular/arrow-down.svg?raw'
import arrowLeft from '@phosphor-icons/core/assets/regular/arrow-left.svg?raw'
import arrowRight from '@phosphor-icons/core/assets/regular/arrow-right.svg?raw'
import arrowUp from '@phosphor-icons/core/assets/regular/arrow-up.svg?raw'
import caretRight from '@phosphor-icons/core/assets/regular/caret-right.svg?raw'
import checkCircle from '@phosphor-icons/core/assets/regular/check-circle.svg?raw'
import copy from '@phosphor-icons/core/assets/regular/copy.svg?raw'
import downloadSimple from '@phosphor-icons/core/assets/regular/download-simple.svg?raw'
import floppyDisk from '@phosphor-icons/core/assets/regular/floppy-disk.svg?raw'
import hourglassMedium from '@phosphor-icons/core/assets/regular/hourglass-medium.svg?raw'
import info from '@phosphor-icons/core/assets/regular/info.svg?raw'
import link from '@phosphor-icons/core/assets/regular/link.svg?raw'
import magnifyingGlass from '@phosphor-icons/core/assets/regular/magnifying-glass.svg?raw'
import mapTrifold from '@phosphor-icons/core/assets/regular/map-trifold.svg?raw'
import note from '@phosphor-icons/core/assets/regular/note.svg?raw'
import play from '@phosphor-icons/core/assets/regular/play.svg?raw'
import plus from '@phosphor-icons/core/assets/regular/plus.svg?raw'
import sealCheck from '@phosphor-icons/core/assets/regular/seal-check.svg?raw'
import shareNetwork from '@phosphor-icons/core/assets/regular/share-network.svg?raw'
import signIn from '@phosphor-icons/core/assets/regular/sign-in.svg?raw'
import signOut from '@phosphor-icons/core/assets/regular/sign-out.svg?raw'
import trash from '@phosphor-icons/core/assets/regular/trash.svg?raw'
import userPlus from '@phosphor-icons/core/assets/regular/user-plus.svg?raw'
import warning from '@phosphor-icons/core/assets/regular/warning.svg?raw'
import x from '@phosphor-icons/core/assets/regular/x.svg?raw'
import xCircle from '@phosphor-icons/core/assets/regular/x-circle.svg?raw'

/** Every icon, by job. An icon is always drawn beside its words, never alone. */
export const ICONS = {
  back: arrowLeft,
  save: floppyDisk,
  undo: arrowCounterClockwise,
  redo: arrowClockwise,
  moveLeft: arrowLeft,
  moveRight: arrowRight,
  moveUp: arrowUp,
  moveDown: arrowDown,
  notes: note,
  copy: copy,
  file: downloadSimple,
  share: shareNetwork,
  waiting: hourglassMedium,
  approve: sealCheck,
  turnDown: xCircle,
  add: plus,
  addPerson: userPlus,
  remove: trash,
  signIn: signIn,
  signOut: signOut,
  tryIt: play,
  find: magnifyingGlass,
  world: mapTrifold,
  info: info,
  good: checkCircle,
  problem: warning,
  link: link,
  open: caretRight,
  again: arrowClockwise,
  hide: x,
} as const

export type IconName = keyof typeof ICONS
