// UTF-8 text to and from base64, which is how GitHub sends and takes a file's bytes. It uses only `btoa` and `atob`,
// which Node, Cloudflare and every browser have, so one copy serves the API and the page.

export function toBase64(text: string): string {
  let binary = ''
  for (const byte of new TextEncoder().encode(text)) binary += String.fromCharCode(byte)
  return btoa(binary)
}

/** `fromBase64` ignores the line breaks GitHub puts in every 60 characters. */
export function fromBase64(base64: string): string {
  const binary = atob(base64.replace(/\s+/g, ''))
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new TextDecoder().decode(bytes)
}
