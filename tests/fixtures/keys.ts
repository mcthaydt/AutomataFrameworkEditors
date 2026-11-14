// RSA keys made now, for tests of the App's signed pass. None is committed: every run makes its own.
import { createPrivateKey, generateKeyPairSync } from 'node:crypto'

export interface TestKeys {
  /** PKCS#1, the form GitHub hands a key out in (`BEGIN RSA PRIVATE KEY`). */
  readonly pkcs1: string
  /** The same key as PKCS#8 (`BEGIN PRIVATE KEY`). */
  readonly pkcs8: string
  /** The public half as SPKI PEM. */
  readonly publicPem: string
}

export function makeTestKeys(modulusLength = 2048): TestKeys {
  const pair = generateKeyPairSync('rsa', {
    modulusLength,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs1', format: 'pem' },
  })
  const pkcs8 = createPrivateKey(pair.privateKey).export({ type: 'pkcs8', format: 'pem' }).toString()
  return { pkcs1: pair.privateKey, pkcs8, publicPem: pair.publicKey }
}
