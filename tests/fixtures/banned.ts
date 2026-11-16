// Words a person never reads on a screen (the drunk-grandma test): the names of GitHub's insides. A word is
// banned as a whole word, in any case, so "sharing" is fine and "sha" is not.
export const BANNED: readonly string[] = [
  'repo',
  'repository',
  'commit',
  'branch',
  'token',
  'oauth',
  'json',
  'toml',
  'sync',
  'push',
  'pull',
  'merge',
  'conflict',
  'schema',
  'sha',
  'api',
  'fork',
  'error',
]

/** The banned words found in `text`, as whole words. */
export function bannedIn(text: string): string[] {
  const words = text.toLowerCase().split(/[^a-z0-9]+/)
  return BANNED.filter((word) => words.includes(word))
}

// The same insides, in the other languages the editors speak. A word is banned whole, in any case. Korean, Japanese and
// Chinese have no spaces between words, so there the text is searched for the word itself.
export const BANNED_BY_LANGUAGE: Readonly<Record<string, readonly string[]>> = {
  es: ['repositorio', 'commit', 'rama', 'token', 'fusionar'],
  pt: ['repositório', 'repositorio', 'commit', 'ramo', 'token', 'mesclar'],
  fr: ['dépôt', 'commit', 'branche', 'jeton', 'fusionner'],
  de: ['repository', 'commit', 'branch', 'zweig', 'token', 'mergen'],
  ru: ['репозиторий', 'коммит', 'ветка', 'токен'],
  ko: ['저장소', '커밋', '브랜치', '토큰'],
  ja: ['リポジトリ', 'コミット', 'ブランチ', 'トークン'],
  zh: ['仓库', '提交', '分支', '令牌'],
}
const UNSPACED = new Set(['ko', 'ja', 'zh'])

/** The banned words found in `text` of language `lang` (English uses `bannedIn`). */
export function bannedInLanguage(text: string, lang: string): string[] {
  if (lang === 'en') return bannedIn(text)
  const list = BANNED_BY_LANGUAGE[lang] ?? []
  const lower = text.toLowerCase()
  if (UNSPACED.has(lang)) return list.filter((word) => lower.includes(word))
  const words = lower.split(/[^\p{L}\p{N}]+/u)
  return list.filter((word) => words.includes(word))
}
