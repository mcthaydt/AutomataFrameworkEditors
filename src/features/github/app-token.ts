// The App's own short-lived pass: a JWT signed RS256 with WebCrypto, which is how GitHub knows a call is from the
// App itself. GitHub hands the App's private key out as PKCS#1 (`BEGIN RSA PRIVATE KEY`); WebCrypto imports only
// PKCS#8, so a PKCS#1 key is wrapped first. Whoever sets the site up pastes the key exactly as GitHub gave it.

const KEY_PROBLEM = "The App's private key could not be read."

const encoder = new TextEncoder()

function base64url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}

/** DER's length bytes: one byte below 128, otherwise 0x80 plus the count, then the length itself. */
function derLength(length: number): number[] {
  if (length < 0x80) return [length]
  const bytes: number[] = []
  for (let rest = length; rest > 0; rest = Math.floor(rest / 256)) bytes.unshift(rest % 256)
  return [0x80 + bytes.length, ...bytes]
}

function der(tag: number, content: Uint8Array | readonly number[]): Uint8Array<ArrayBuffer> {
  const body = Uint8Array.from(content)
  return Uint8Array.from([tag, ...derLength(body.length), ...body])
}

/**
 * `SEQUENCE { INTEGER 0, SEQUENCE { OID rsaEncryption, NULL }, OCTET STRING <pkcs1> }`. The two lengths that depend
 * on the key's own size are worked out here, because GitHub's keys differ by a byte or two.
 */
export function pkcs1ToPkcs8(pkcs1: Uint8Array): Uint8Array<ArrayBuffer> {
  const version = der(0x02, [0])
  const rsaEncryption = der(0x06, [0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01])
  const algorithm = der(0x30, [...rsaEncryption, ...der(0x05, [])])
  return der(0x30, [...version, ...algorithm, ...der(0x04, pkcs1)])
}

/** The key's DER bytes, as PKCS#8, from a PEM in either form. A key pasted with `\n` for its line breaks works. */
function privateKeyDer(pem: string): Uint8Array<ArrayBuffer> {
  const text = pem.replaceAll('\\n', '\n')
  const match = /-----BEGIN (RSA )?PRIVATE KEY-----([\s\S]*?)-----END (?:RSA )?PRIVATE KEY-----/.exec(text)
  if (match === null) throw new Error(KEY_PROBLEM)
  const binary = atob((match[2] ?? '').replace(/\s+/g, ''))
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
  return match[1] === undefined ? bytes : pkcs1ToPkcs8(bytes)
}

/** The App's pass. `iss` is the App's id, `iat` a minute ago (for a slow clock), `exp` nine minutes on. */
export async function appJwt(appId: string, privateKeyPem: string, nowMs: number): Promise<string> {
  let key: CryptoKey
  try {
    key = await crypto.subtle.importKey(
      'pkcs8',
      privateKeyDer(privateKeyPem),
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign'],
    )
  } catch {
    // Never put the key's own text into a message.
    throw new Error(KEY_PROBLEM)
  }
  const seconds = Math.floor(nowMs / 1000)
  const head = base64url(encoder.encode(JSON.stringify({ alg: 'RS256', typ: 'JWT' })))
  const body = base64url(
    encoder.encode(JSON.stringify({ iss: appId, iat: seconds - 60, exp: seconds + 9 * 60 })),
  )
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, encoder.encode(`${head}.${body}`))
  return `${head}.${body}.${base64url(new Uint8Array(signature))}`
}
