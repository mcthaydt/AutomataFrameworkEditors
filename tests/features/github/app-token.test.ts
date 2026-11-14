import { createPublicKey, verify } from 'node:crypto'
import { expect, test } from 'vitest'
import { appJwt } from '#src/features/github/github.ts'
import { makeTestKeys } from '../../fixtures/keys.ts'

const NOW = Date.UTC(2026, 10, 13, 12, 0, 0)

const part = (jwt: string, i: number): unknown =>
  JSON.parse(Buffer.from(jwt.split('.')[i] ?? '', 'base64url').toString('utf8'))

/** True when the JWT's signature verifies with the public key. */
function signedBy(jwt: string, publicPem: string): boolean {
  const [head, body, signature] = jwt.split('.')
  return verify(
    'RSA-SHA256',
    Buffer.from(`${head}.${body}`),
    createPublicKey(publicPem),
    Buffer.from(signature ?? '', 'base64url'),
  )
}

test('the pass has three parts, the header and payload the plan names', async () => {
  const keys = makeTestKeys()
  const jwt = await appJwt('12345', keys.pkcs8, NOW)
  expect(jwt.split('.')).toHaveLength(3)
  expect(part(jwt, 0)).toEqual({ alg: 'RS256', typ: 'JWT' })
  expect(part(jwt, 1)).toEqual({ iss: '12345', iat: NOW / 1000 - 60, exp: NOW / 1000 + 9 * 60 })
})

test('its signature verifies with the public key, for a PKCS#8 key', async () => {
  const keys = makeTestKeys()
  expect(signedBy(await appJwt('1', keys.pkcs8, NOW), keys.publicPem)).toBe(true)
})

test('and for the same key as PKCS#1, the form GitHub hands out', async () => {
  const keys = makeTestKeys()
  expect(keys.pkcs1).toContain('BEGIN RSA PRIVATE KEY')
  expect(signedBy(await appJwt('1', keys.pkcs1, NOW), keys.publicPem)).toBe(true)
})

test('keys of 2048 and 4096 bits both import, whatever their length bytes come to', async () => {
  for (const bits of [2048, 4096]) {
    const keys = makeTestKeys(bits)
    expect(signedBy(await appJwt('1', keys.pkcs1, NOW), keys.publicPem), `${bits} bits`).toBe(true)
  }
}, 60_000)

test('a key pasted with its line breaks as \\n still works', async () => {
  const keys = makeTestKeys()
  const jwt = await appJwt('1', keys.pkcs1.trim().replaceAll('\n', '\\n'), NOW)
  expect(signedBy(jwt, keys.publicPem)).toBe(true)
})

test('a key that is not a key throws an error that does not contain the key text', async () => {
  const text = 'this is not a key but it is secret'
  const error = await appJwt(
    '1',
    `-----BEGIN RSA PRIVATE KEY-----\n${text}\n-----END RSA PRIVATE KEY-----`,
    NOW,
  ).catch((e: unknown) => e)
  expect(error).toBeInstanceOf(Error)
  expect(String((error as Error).message)).not.toContain(text)
  expect(String((error as Error).message)).not.toContain('secret')
})
