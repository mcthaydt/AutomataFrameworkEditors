// Signing in, as the page lives it. GitHub only says who a person is: the page sends them to GitHub's sign-in page,
// GitHub sends them back with a one-time code, and this site's API swaps the code for a sign-in that the page keeps.
// Nothing here reads a screen, and the only thing kept on the device is the sign-in itself.
import type { Auth, swapTokens } from '../api/api.ts'
import type { Tokens } from '../wire/wire.ts'

export type SignInResult = 'nothing-to-do' | 'signed-in' | 'cancelled' | 'failed'

export interface SessionConfig {
  /** GitHub's address; the pretend GitHub's in the journeys. */
  readonly webUrl: string
  readonly clientId: string
  readonly appSlug: string
}

export interface Session extends Auth {
  /** Remembers where the person was, then sends the browser to GitHub's sign-in page. */
  begin(returnTo: string): void
  /** Call once at start-up with the page's URL. Finishes a sign-in that GitHub sent back, and cleans the URL. */
  finish(url: URL): Promise<{ result: SignInResult; returnTo: string }>
  signOut(): void
}

const KEPT = 'af.tokens'
const STATE = 'af.signin.state'
const RETURN = 'af.signin.return'

/** The sign-in page: `{webUrl}/login/oauth/authorize`, with no scope (the App's own permissions do the work). */
export function signInUrl(config: SessionConfig, opts: { redirectUri: string; state: string }): string {
  const query = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: opts.redirectUri,
    state: opts.state,
  })
  return `${config.webUrl}/login/oauth/authorize?${query}`
}

/** Where an Owner adds the editor to a game. */
export function addToGameUrl(config: SessionConfig): string {
  return `${config.webUrl}/apps/${encodeURIComponent(config.appSlug)}/installations/new`
}

interface Deps {
  readonly config: SessionConfig
  readonly origin: string
  /** localStorage: the Tokens as JSON, under 'af.tokens'. */
  readonly kept: Storage
  /** sessionStorage: the state and the return place of a sign-in under way. */
  readonly brief: Storage
  /** location.assign */
  readonly go: (url: string) => void
  /** history.replaceState, dropping the query. */
  readonly clean: () => void
  readonly swap: typeof swapTokens
  /** 32 hex characters from crypto.getRandomValues. */
  readonly random: () => string
}

/** A storage call that never throws out: a private window, or a full device, only means nothing is kept. */
function safely<T>(run: () => T): T | undefined {
  try {
    return run()
  } catch {
    return undefined
  }
}

export function createSession(deps: Deps): Session {
  const { kept, brief } = deps

  const read = (): Tokens | undefined =>
    safely(() => {
      const raw = kept.getItem(KEPT)
      if (raw === null) return undefined
      const parsed = JSON.parse(raw) as Partial<Tokens>
      if (typeof parsed.token !== 'string' || parsed.token === '') return undefined
      return typeof parsed.refresh === 'string'
        ? { token: parsed.token, refresh: parsed.refresh }
        : { token: parsed.token }
    })
  const keep = (tokens: Tokens): void => void safely(() => kept.setItem(KEPT, JSON.stringify(tokens)))
  const forget = (): void => void safely(() => kept.removeItem(KEPT))
  const clearBrief = (): void =>
    void safely(() => {
      brief.removeItem(STATE)
      brief.removeItem(RETURN)
    })

  /** The sign-in the page last used for a call, so a renewal can tell whether another tab has already renewed. */
  let lastUsed: string | undefined
  let renewing: Promise<boolean> | undefined

  async function renewNow(): Promise<boolean> {
    const current = read()
    // Another tab renewed first (GitHub gives out a new refresh each time, so the old one is dead): use theirs.
    if (current !== undefined && lastUsed !== undefined && current.token !== lastUsed) return true
    if (current?.refresh === undefined) {
      forget()
      return false
    }
    const next = await deps.swap({ refresh: current.refresh })
    if (next === undefined) {
      forget()
      return false
    }
    keep(next)
    return true
  }

  return {
    token() {
      lastUsed = read()?.token
      return lastUsed
    },

    renew() {
      // Two calls at once make one swap.
      renewing ??= renewNow().finally(() => {
        renewing = undefined
      })
      return renewing
    },

    begin(returnTo) {
      const state = deps.random()
      safely(() => {
        brief.setItem(STATE, state)
        brief.setItem(RETURN, returnTo)
      })
      deps.go(signInUrl(deps.config, { redirectUri: `${deps.origin}/`, state }))
    },

    async finish(url) {
      const returnTo = safely(() => brief.getItem(RETURN)) ?? '#/'
      const params = url.searchParams
      const code = params.get('code')
      const state = params.get('state')
      const error = params.get('error')
      const done = (result: SignInResult): { result: SignInResult; returnTo: string } => {
        clearBrief()
        if (params.size > 0) deps.clean()
        return { result, returnTo }
      }
      // An Owner has just added the editor to a game: nothing to swap, only a URL to tidy.
      if (params.has('setup_action') && state === null) return done('nothing-to-do')
      if (error !== null) return done(error === 'access_denied' ? 'cancelled' : 'failed')
      if (code === null) return { result: 'nothing-to-do', returnTo }
      const expected = safely(() => brief.getItem(STATE))
      if (state === null || expected === null || expected === undefined || state !== expected)
        return done('failed')
      const tokens = await deps.swap({ code })
      if (tokens === undefined) return done('failed')
      keep(tokens)
      return done('signed-in')
    },

    signOut() {
      forget()
    },
  }
}
