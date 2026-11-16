// The links game's files as the pretend GitHub keeps a branch: a map from path to text.
import { linksFiles } from './links.ts'

/** The links game's files, each as `writeContent` writes it. */
export function linksMap(): Map<string, string> {
  const files = linksFiles()
  const map = new Map<string, string>()
  for (const [path, text] of Object.entries(files)) if (text !== undefined) map.set(path, text)
  return map
}
