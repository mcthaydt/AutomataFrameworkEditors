// The rows of the three menus, worked out from what the page knows. Pure, so what each person sees (a visitor, someone
// who only suggests, an owner) can be checked without a page.
import type { AccessLevel } from '../access/access.ts'
import type { MenuItem } from '../ui/ui.ts'
import { nameOf, type Row, type Words } from '../words/words.ts'
import { EDITORS, type Workspace } from './workspace.ts'

type Bar = Words['menus']
const say = (row: Row, ...parts: (string | number)[]): string =>
  typeof row === 'string' ? row : row(...parts)

export interface GameFacts {
  readonly signedIn: boolean
  readonly level: AccessLevel
  /** How many changes wait to be looked at. */
  readonly waiting: number
  /** The open level's name, or none on a screen with no level. */
  readonly levelName: string | undefined
}

/** The game's menu: what belongs to the whole game, and the way out. A visitor is never shown who can change it. */
export function gameItems(facts: GameFacts, bar: Bar): readonly MenuItem[] {
  const items: MenuItem[] = []
  if (facts.signedIn) {
    items.push({ id: 'people', words: say(bar.whoCanChange), icon: 'users-three' })
    items.push({ id: 'history', words: say(bar.whatChanged), icon: 'clock-counter-clockwise' })
  }
  if (facts.signedIn && facts.waiting > 0) {
    items.push({ id: 'waiting', words: say(bar.waitingRow, facts.waiting), icon: 'clock-counter-clockwise' })
  }
  if (facts.levelName !== undefined) {
    items.push({
      id: 'keep',
      words: say(bar.keepCopyOf, nameOf(facts.levelName)),
      about: say(bar.keepCopyAbout),
      icon: 'download-simple',
    })
  }
  if (items.length > 0) items.push({ id: 'rule-1', words: '', kind: 'rule' })
  items.push({ id: 'help', words: say(bar.helpRow), about: say(bar.helpAbout), icon: 'question', key: '?' })
  items.push({ id: 'settings', words: say(bar.settingsRow), icon: 'gear' })
  items.push({ id: 'rule-3', words: '', kind: 'rule' })
  items.push({
    id: 'games',
    words: say(bar.yourGames),
    about: say(bar.yourGamesAbout),
    icon: 'squares-four',
  })
  items.push({ id: 'rule-2', words: '', kind: 'rule' })
  items.push(
    facts.signedIn
      ? { id: 'sign-out', words: say(bar.signOut), icon: 'arrow-square-out' }
      : { id: 'sign-in', words: say(bar.signIn), icon: 'arrow-square-out' },
  )
  return items
}

/** The six editors, the one the person is in ticked. */
export function editorItems(bar: Bar, current: Workspace['id']): readonly MenuItem[] {
  return EDITORS.map((editor) => ({
    id: editor.id,
    words: say(bar[editor.name]),
    about: say(bar[editor.about]),
    icon: editor.icon,
    here: editor.id === current,
  }))
}

/** What a tap on an editor that is not built says; undefined for one that is. */
export function noteFor(bar: Bar, id: string): string | undefined {
  const editor = EDITORS.find((one) => one.id === id)
  return editor === undefined || editor.note === undefined ? undefined : say(bar[editor.note])
}

export interface PartFacts {
  readonly workspace: Workspace
  readonly part: string
  /** An upright phone: the editors and the game's menu are in this menu too, since the bar has no room for them. */
  readonly compact: boolean
  /** Every level of the game, with the one open ticked. */
  readonly levels: readonly string[]
  readonly level: string | undefined
  /** The map is a place of this part too: its row, and whether it is the one on screen. */
  readonly map?: { readonly words: string; readonly about: string; readonly here: boolean } | undefined
}

/** Where to go: the parts, every level, and on an upright phone the editors and the game's menu as well. */
export function partItems(facts: PartFacts, game: GameFacts, bar: Bar): readonly MenuItem[] {
  const items: MenuItem[] = [{ id: 'h-parts', words: say(bar.inWorld), kind: 'heading' }]
  for (const part of facts.workspace.parts) {
    items.push({
      id: `part:${part.id}`,
      words: say(bar[part.words]),
      about: say(bar[part.about]),
      icon: 'squares-four',
      here: part.id === facts.part && facts.map?.here !== true,
    })
  }
  if (facts.map !== undefined) {
    items.push({
      id: 'map',
      words: facts.map.words,
      about: facts.map.about,
      icon: 'map-trifold',
      here: facts.map.here,
    })
  }
  if (facts.levels.length > 1) {
    items.push({ id: 'h-levels', words: say(bar.allLevels), kind: 'heading' })
    for (const id of facts.levels) {
      items.push({ id: `level:${id}`, words: nameOf(id), here: id === facts.level })
    }
  }
  if (facts.compact) {
    items.push({ id: 'rule-editors', words: '', kind: 'rule' })
    items.push({ id: 'h-editors', words: say(bar.sixEditors), kind: 'heading' })
    for (const item of editorItems(bar, facts.workspace.id)) items.push({ ...item, id: `editor:${item.id}` })
    items.push({ id: 'rule-game', words: '', kind: 'rule' })
    for (const item of gameItems(game, bar)) items.push({ ...item, id: `game:${item.id}` })
  }
  return items
}
