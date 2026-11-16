// The one-line message of a commit: what a person wrote, cut to one short line.

const MESSAGE_LENGTH = 72

/** The message cut to one line of at most 72 characters; nothing left of it becomes `Change <path>`. */
export function oneLine(message: string, path: string): string {
  const line = message.replace(/\s+/g, ' ').trim().slice(0, MESSAGE_LENGTH).trim()
  return line === '' ? `Change ${path}` : line
}
