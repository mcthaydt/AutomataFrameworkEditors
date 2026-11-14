import { expect, test } from 'vitest'
import { whoIs } from '#src/features/exchange/exchange.ts'
import { json, recorder } from '../../fixtures/fetcher.ts'

const env = { GITHUB_CLIENT_ID: 'id', GITHUB_CLIENT_SECRET: 'secret', GITHUB_API_URL: 'http://fake.test' }

test('a token this App made gives the login and id', async () => {
  const { fetcher, calls } = recorder(() => json({ user: { login: 'grandma', id: 7 } }))
  expect(await whoIs('ghu_1', env, fetcher)).toEqual({ ok: true, value: { login: 'grandma', id: 7 } })
  expect(calls).toHaveLength(1)
  expect(calls[0]?.url).toBe('http://fake.test/applications/id/token')
  expect(calls[0]?.method).toBe('POST')
  expect(calls[0]?.headers.get('authorization')).toBe(`Basic ${btoa('id:secret')}`)
  expect(calls[0]?.body).toEqual({ access_token: 'ghu_1' })
})

test('a token GitHub does not know for this App is signed-out', async () => {
  for (const status of [404, 422]) {
    const { fetcher } = recorder(() => json({ message: 'Not Found' }, status))
    expect(await whoIs('ghu_other', env, fetcher)).toEqual({ ok: false, problem: 'signed-out' })
  }
})

test('GitHub down is busy, never signed-out', async () => {
  const down = recorder(() => {
    throw new Error('reset')
  })
  expect(await whoIs('ghu_1', env, down.fetcher)).toEqual({ ok: false, problem: 'busy' })
  const bad = recorder(() => json({}, 502))
  expect(await whoIs('ghu_1', env, bad.fetcher)).toEqual({ ok: false, problem: 'busy' })
})

test('an empty token is signed-out and GitHub is never asked', async () => {
  const { fetcher, calls } = recorder(() => json({}))
  expect(await whoIs('', env, fetcher)).toEqual({ ok: false, problem: 'signed-out' })
  expect(calls).toEqual([])
})

test('an App with no id or secret is not set up, and GitHub is never asked', async () => {
  const { fetcher, calls } = recorder(() => json({}))
  expect(await whoIs('ghu_1', {}, fetcher)).toEqual({ ok: false, problem: 'not-set-up' })
  expect(calls).toEqual([])
})

test('an answer with no login is not trusted', async () => {
  const { fetcher } = recorder(() => json({ user: {} }))
  expect(await whoIs('ghu_1', env, fetcher)).toEqual({ ok: false, problem: 'signed-out' })
})
