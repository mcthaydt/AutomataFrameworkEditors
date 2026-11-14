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
