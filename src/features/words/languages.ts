// The nine languages the editors speak: the games' six (English, Spanish, Korean, Japanese, Chinese, Portuguese) and
// French, Russian and German. English is the source: every area file has all nine, and a row missing in one falls back
// to English (`wordsIn`), so a half-translated language never shows a blank.

export const LANGUAGES = ['en', 'es', 'ko', 'ja', 'zh', 'pt', 'fr', 'ru', 'de'] as const
export type Lang = (typeof LANGUAGES)[number]

/**
 * Each language in its own words, with its flag's country code (the language card draws the flag from it). A language
 * is always named in itself, so a person who cannot read the page can still find theirs.
 */
export const LANGUAGE_NAMES: Readonly<Record<Lang, { readonly name: string; readonly flag: string }>> = {
  en: { name: 'English', flag: 'gb' },
  es: { name: 'Español', flag: 'es' },
  ko: { name: '한국어', flag: 'kr' },
  ja: { name: '日本語', flag: 'jp' },
  zh: { name: '中文', flag: 'cn' },
  pt: { name: 'Português', flag: 'pt' },
  fr: { name: 'Français', flag: 'fr' },
  ru: { name: 'Русский', flag: 'ru' },
  de: { name: 'Deutsch', flag: 'de' },
}

/** A row: a string, or a function of what it names ("Delete Crate 1"). */
export type Row = string | ((...parts: readonly (string | number)[]) => string)

/** One area's rows in every language. A row that one language lacks is a type error, so none can be forgotten. */
export type Area<Key extends string> = Readonly<Record<Lang, Readonly<Record<Key, Row>>>>

/**
 * Which rows a native speaker has read, per language. None yet: the editors' words are written, not yet read by a
 * speaker, and the day one reads a language this says so (as the games' `automata.translations.toml` does).
 */
export const READ_BY_A_SPEAKER: Readonly<Record<Lang, readonly string[]>> = {
  en: [],
  es: [],
  ko: [],
  ja: [],
  zh: [],
  pt: [],
  fr: [],
  ru: [],
  de: [],
}
