// Only the icons the screens use, Phosphor's regular weight, read from the package's own SVGs at build time. An icon
// is drawn with its word wherever there is room, and keeps its place when a short bar drops the word.

import arrowClockwise from '@phosphor-icons/core/regular/arrow-clockwise.svg?raw'
import arrowCounterClockwise from '@phosphor-icons/core/regular/arrow-counter-clockwise.svg?raw'
import arrowDown from '@phosphor-icons/core/regular/arrow-down.svg?raw'
import arrowLeft from '@phosphor-icons/core/regular/arrow-left.svg?raw'
import arrowRight from '@phosphor-icons/core/regular/arrow-right.svg?raw'
import arrowUp from '@phosphor-icons/core/regular/arrow-up.svg?raw'
import caretDown from '@phosphor-icons/core/regular/caret-down.svg?raw'
import caretLeft from '@phosphor-icons/core/regular/caret-left.svg?raw'
import caretRight from '@phosphor-icons/core/regular/caret-right.svg?raw'
import caretUp from '@phosphor-icons/core/regular/caret-up.svg?raw'
import check from '@phosphor-icons/core/regular/check.svg?raw'
import copy from '@phosphor-icons/core/regular/copy.svg?raw'
import cursor from '@phosphor-icons/core/regular/cursor.svg?raw'
import dotsThree from '@phosphor-icons/core/regular/dots-three.svg?raw'
import eraser from '@phosphor-icons/core/regular/eraser.svg?raw'
import eye from '@phosphor-icons/core/regular/eye.svg?raw'
import eyeSlash from '@phosphor-icons/core/regular/eye-slash.svg?raw'
import gear from '@phosphor-icons/core/regular/gear.svg?raw'
import globe from '@phosphor-icons/core/regular/globe.svg?raw'
import link from '@phosphor-icons/core/regular/link.svg?raw'
import list from '@phosphor-icons/core/regular/list.svg?raw'
import lock from '@phosphor-icons/core/regular/lock.svg?raw'
import lockOpen from '@phosphor-icons/core/regular/lock-open.svg?raw'
import magnifyingGlass from '@phosphor-icons/core/regular/magnifying-glass.svg?raw'
import minus from '@phosphor-icons/core/regular/minus.svg?raw'
import paintBrush from '@phosphor-icons/core/regular/paint-brush.svg?raw'
import pause from '@phosphor-icons/core/regular/pause.svg?raw'
import play from '@phosphor-icons/core/regular/play.svg?raw'
import plus from '@phosphor-icons/core/regular/plus.svg?raw'
import plusCircle from '@phosphor-icons/core/regular/plus-circle.svg?raw'
import question from '@phosphor-icons/core/regular/question.svg?raw'
import trash from '@phosphor-icons/core/regular/trash.svg?raw'
import warning from '@phosphor-icons/core/regular/warning.svg?raw'
import x from '@phosphor-icons/core/regular/x.svg?raw'

export type IconName =
  | 'cursor'
  | 'plus-circle'
  | 'paint-brush'
  | 'eraser'
  | 'link'
  | 'play'
  | 'pause'
  | 'x'
  | 'plus'
  | 'minus'
  | 'check'
  | 'caret-down'
  | 'caret-up'
  | 'caret-left'
  | 'caret-right'
  | 'arrow-up'
  | 'arrow-down'
  | 'arrow-left'
  | 'arrow-right'
  | 'arrow-counter-clockwise'
  | 'arrow-clockwise'
  | 'dots-three'
  | 'magnifying-glass'
  | 'warning'
  | 'globe'
  | 'gear'
  | 'question'
  | 'list'
  | 'eye'
  | 'eye-slash'
  | 'lock'
  | 'lock-open'
  | 'trash'
  | 'copy'

/** The drawing inside an SVG file's outer tag. */
function inner(svg: string): string {
  return svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')
}

/** Everything inside the `<svg>` of each icon (the paths): all are drawn on a 256 by 256 box, filled with the text colour. */
export const ICONS: Readonly<Record<IconName, string>> = {
  cursor: inner(cursor),
  'plus-circle': inner(plusCircle),
  'paint-brush': inner(paintBrush),
  eraser: inner(eraser),
  link: inner(link),
  play: inner(play),
  pause: inner(pause),
  x: inner(x),
  plus: inner(plus),
  minus: inner(minus),
  check: inner(check),
  'caret-down': inner(caretDown),
  'caret-up': inner(caretUp),
  'caret-left': inner(caretLeft),
  'caret-right': inner(caretRight),
  'arrow-up': inner(arrowUp),
  'arrow-down': inner(arrowDown),
  'arrow-left': inner(arrowLeft),
  'arrow-right': inner(arrowRight),
  'arrow-counter-clockwise': inner(arrowCounterClockwise),
  'arrow-clockwise': inner(arrowClockwise),
  'dots-three': inner(dotsThree),
  'magnifying-glass': inner(magnifyingGlass),
  warning: inner(warning),
  globe: inner(globe),
  gear: inner(gear),
  question: inner(question),
  list: inner(list),
  eye: inner(eye),
  'eye-slash': inner(eyeSlash),
  lock: inner(lock),
  'lock-open': inner(lockOpen),
  trash: inner(trash),
  copy: inner(copy),
}
