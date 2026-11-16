// What a pure edit of a level answers: the new thing, or the one plain reason it did not happen. The reason is a word
// the screens put in their own words; nothing here says a sentence.
import type { Level } from '@automataframework/framework/headless'

export type Why =
  | 'solid'
  | 'same'
  | 'no-such-thing'
  | 'outside'
  | 'occupied'
  | 'limit'
  | 'not-allowed'
  | 'taken'

export type Done<T = Level> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly why: Why }

export const ok = <T>(value: T): Done<T> => ({ ok: true, value })
export const no = (why: Why): Done<never> => ({ ok: false, why })
