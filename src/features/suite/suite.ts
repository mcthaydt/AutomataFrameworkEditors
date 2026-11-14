// The suite on a page: finishes a sign-in GitHub sent back, then mounts the app.
import { mount, unmount } from 'svelte'
import { createApi, swapTokens } from '../api/api.ts'
import { addToGameUrl, createSession, type SessionConfig } from '../session/session.ts'
import App from './App.svelte'

export type SuiteConfig = SessionConfig

/** 32 hex characters from the browser's own random numbers. */
function randomState(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function mountSuite(target: HTMLElement, config: SuiteConfig): { destroy(): void } {
  const session = createSession({
    config,
    origin: location.origin,
    kept: localStorage,
    brief: sessionStorage,
    go: (url) => location.assign(url),
    clean: () => history.replaceState(null, '', `${location.pathname}${location.hash}`),
    swap: swapTokens,
    random: randomState,
  })
  const api = createApi(session)
  let app: ReturnType<typeof mount> | undefined
  let destroyed = false

  // A sign-in that GitHub sent back is finished first, so the app opens on the place the person was.
  void session.finish(new URL(location.href)).then(({ result, returnTo }) => {
    if (destroyed) return
    // Cancelled or not, the person lands where they were: a level they were trying stays on screen.
    if (result !== 'nothing-to-do') location.hash = returnTo
    app = mount(App, {
      target,
      props: {
        api,
        session,
        ready: config.clientId !== '',
        start: result === 'cancelled' || result === 'failed' ? result : undefined,
        addUrl: addToGameUrl(config),
        remembered: localStorage,
        drafts: sessionStorage,
      },
    })
  })

  return {
    destroy() {
      destroyed = true
      if (app !== undefined) void unmount(app)
    },
  }
}
