// The pretend GitHub signs nothing itself: it needs the App's public key to check the App's pass. A fresh pair is
// made for every server, so no key is ever committed.
import { createPublicKey, type KeyObject } from 'node:crypto'
import { makeTestKeys } from '../keys.ts'

export interface FakeKeys {
  /** PKCS#1, as GitHub hands the App's key out. This is what the API's settings hold. */
  readonly privatePem: string
  readonly publicKey: KeyObject
}

/** A fresh RSA key pair, made now. */
export function makeKeys(): FakeKeys {
  const keys = makeTestKeys()
  return { privatePem: keys.pkcs1, publicKey: createPublicKey(keys.publicPem) }
}
