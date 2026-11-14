import { expect, test } from 'vitest'
import { addToGameUrl, createSession, type SessionConfig, signInUrl } from '#src/features/session/session.ts'
import type { Tokens } from '#src/features/wire/wire.ts'

const config: SessionConfig = { webUrl: 'https://gh.test', clientId: 'cid', appSlug: 'my app' }

class Store implements Storage {
  private data = new Map<string, string>()
  get length(): number {
    return this.data.size
  }
  clear(): void {
    this.data.clear()
  }
  getItem(key: string): string | null {
    return this.data.get(key) ?? null
  }
  key(index: number): string | null {
    return [...this.data.keys()][index] ?? null
  }
  removeItem(key: string): void {
    this.data.delete(key)
  }
  setItem(key: string, value: string): void {
    this.data.set(key, value)
  }
}
class Broken extends Store {
  override getItem(): string | null {
    throw new Error('private mode')
  }
  override setItem(): void {
    throw new Error('private mode')
  }
  override removeItem(): void {
    throw new Error('private mode')
  }
}

function make(
  over: {
    kept?: Storage
    brief?: Storage
    swap?: (ask: { code: string } | { refresh: string }) => Promise<Tokens | undefined>
  } = {},
) {
  const gone: string[] = []
  const swaps: unknown[] = []
  let cleaned = 0
  const kept = over.kept ?? new Store()
  const brief = over.brief ?? new Store()
  const session = createSession({
    config,
    origin: 'https://editors.test',
    kept,
    brief,
    go: (url) => gone.push(url),
    clean: () => cleaned++,
    swap: async (ask) => {
      swaps.push(ask)
      return over.swap ? over.swap(ask) : { token: 'new-token', refresh: 'new-refresh' }
    },
    random: () => 'a'.repeat(32),
  })
  return { session, kept, brief, gone, swaps, cleaned: () => cleaned }
}
const url = (query: string) => new URL(`https://editors.test/${query}`)

test("the sign-in page is GitHub's, with the App's id, the redirect and the state, and no scope", () => {
  const link = new URL(signInUrl(config, { redirectUri: 'https://editors.test/', state: 'abc' }))
  expect(link.origin + link.pathname).toBe('https://gh.test/login/oauth/authorize')
  expect(Object.fromEntries(link.searchParams)).toEqual({
    client_id: 'cid',
    redirect_uri: 'https://editors.test/',
    state: 'abc',
  })
  expect(addToGameUrl(config)).toBe('https://gh.test/apps/my%20app/installations/new')
})

test('begin stores a fresh state and the return place, then goes to the sign-in page carrying that state', () => {
  const { session, brief, gone } = make()
  session.begin('#/game/a/b')
  expect(brief.getItem('af.signin.state')).toBe('a'.repeat(32))
  expect(brief.getItem('af.signin.return')).toBe('#/game/a/b')
  const link = new URL(gone[0] ?? '')
  expect(link.searchParams.get('state')).toBe('a'.repeat(32))
  expect(link.searchParams.get('redirect_uri')).toBe('https://editors.test/')
  expect(link.searchParams.has('scope')).toBe(false)
})

test('finish with no code is nothing-to-do', async () => {
  const { session, swaps, cleaned } = make()
  expect(await session.finish(url(''))).toEqual({ result: 'nothing-to-do', returnTo: '#/' })
  expect(swaps).toEqual([])
  expect(cleaned()).toBe(0)
})

test('finish with the stored state and a code swaps it, keeps the tokens, clears the brief, cleans the URL, and returns where the person was', async () => {
  const { session, brief, kept, swaps, cleaned } = make()
  session.begin('#/game/a/b/share')
  const done = await session.finish(url('?code=c1&state=' + 'a'.repeat(32)))
  expect(done).toEqual({ result: 'signed-in', returnTo: '#/game/a/b/share' })
  expect(swaps).toEqual([{ code: 'c1' }])
  expect(JSON.parse(kept.getItem('af.tokens') ?? '')).toEqual({ token: 'new-token', refresh: 'new-refresh' })
  expect(brief.getItem('af.signin.state')).toBeNull()
  expect(brief.getItem('af.signin.return')).toBeNull()
  expect(cleaned()).toBe(1)
  expect(session.token()).toBe('new-token')
})

test('finish with a different state is failed, and swap is never called', async () => {
  const { session, swaps, kept } = make()
  session.begin('#/')
  expect((await session.finish(url('?code=c1&state=evil'))).result).toBe('failed')
  expect((await session.finish(url('?code=c1'))).result).toBe('failed')
  expect(swaps).toEqual([])
  expect(kept.getItem('af.tokens')).toBeNull()
})

test('a code with no sign-in under way is failed', async () => {
  const { session, swaps } = make()
  expect((await session.finish(url('?code=c1&state=whatever'))).result).toBe('failed')
  expect(swaps).toEqual([])
})

test('error=access_denied is cancelled; any other error is failed', async () => {
  const { session } = make()
  session.begin('#/')
  expect((await session.finish(url('?error=access_denied&state=x'))).result).toBe('cancelled')
  expect((await session.finish(url('?error=server_error'))).result).toBe('failed')
})

test('when swap gives nothing it is failed and nothing is kept', async () => {
  const { session, kept } = make({ swap: async () => undefined })
  session.begin('#/')
  expect((await session.finish(url('?code=c1&state=' + 'a'.repeat(32)))).result).toBe('failed')
  expect(kept.getItem('af.tokens')).toBeNull()
})

test('a return from adding the editor to a game (setup_action, no state) is never swapped; the URL is cleaned', async () => {
  const { session, swaps, cleaned } = make()
  expect((await session.finish(url('?code=x&setup_action=install'))).result).toBe('nothing-to-do')
  expect(swaps).toEqual([])
  expect(cleaned()).toBe(1)
})

test('renew with a kept refresh swaps it, keeps the new tokens and says yes', async () => {
  const { session, kept, swaps } = make()
  kept.setItem('af.tokens', JSON.stringify({ token: 'old', refresh: 'r-old' }))
  expect(session.token()).toBe('old')
  expect(await session.renew()).toBe(true)
  expect(swaps).toEqual([{ refresh: 'r-old' }])
  expect(session.token()).toBe('new-token')
})

test('a refused renew forgets everything and says no; with no refresh it says no and forgets', async () => {
  const refused = make({ swap: async () => undefined })
  refused.kept.setItem('af.tokens', JSON.stringify({ token: 'old', refresh: 'r' }))
  refused.session.token()
  expect(await refused.session.renew()).toBe(false)
  expect(refused.session.token()).toBeUndefined()

  const none = make()
  none.kept.setItem('af.tokens', JSON.stringify({ token: 'old' }))
  none.session.token()
  expect(await none.session.renew()).toBe(false)
  expect(none.swaps).toEqual([])
  expect(none.session.token()).toBeUndefined()
})

test('two renew() calls at once make one swap', async () => {
  const { session, kept, swaps } = make()
  kept.setItem('af.tokens', JSON.stringify({ token: 'old', refresh: 'r' }))
  session.token()
  const [a, b] = await Promise.all([session.renew(), session.renew()])
  expect([a, b]).toEqual([true, true])
  expect(swaps).toHaveLength(1)
})

test('another tab that renewed first is used, not swapped over (GitHub replaces the refresh each time)', async () => {
  const { session, kept, swaps } = make()
  kept.setItem('af.tokens', JSON.stringify({ token: 'old', refresh: 'r1' }))
  session.token()
  kept.setItem('af.tokens', JSON.stringify({ token: 'other-tab', refresh: 'r2' }))
  expect(await session.renew()).toBe(true)
  expect(swaps).toEqual([])
  expect(session.token()).toBe('other-tab')
})

test('signOut forgets the tokens', () => {
  const { session, kept } = make()
  kept.setItem('af.tokens', JSON.stringify({ token: 'old' }))
  expect(session.token()).toBe('old')
  session.signOut()
  expect(session.token()).toBeUndefined()
})

test('a Storage that throws (private mode) makes token() undefined and never throws out', async () => {
  const { session } = make({ kept: new Broken(), brief: new Broken() })
  expect(session.token()).toBeUndefined()
  session.begin('#/')
  expect((await session.finish(url('?code=c&state=s'))).result).toBe('failed')
  expect(await session.renew()).toBe(false)
  session.signOut()
})

test('garbage kept on the device is no sign-in', () => {
  for (const raw of ['not json', '{"token":3}', '{"token":""}', 'null']) {
    const { session, kept } = make()
    kept.setItem('af.tokens', raw)
    expect(session.token()).toBeUndefined()
  }
})
