// The page's entry: mounts the suite on the page, with the sign-in settings Vite was given at build time.
import { mountSuite } from './index.ts'

const target = document.getElementById('app')
if (target === null) throw new Error('The page has no #app to mount into.')
/** `owner/name` from the site's settings; anything else is no example game. */
function demoGame(value: string | undefined): { owner: string; name: string } | undefined {
  const [owner, name, ...rest] = (value ?? '').split('/')
  const part = /^[A-Za-z0-9._-]+$/
  return owner !== undefined && name !== undefined && rest.length === 0 && part.test(owner) && part.test(name)
    ? { owner, name }
    : undefined
}

mountSuite(target, {
  webUrl: import.meta.env.VITE_GITHUB_WEB_URL ?? 'https://github.com',
  clientId: import.meta.env.VITE_GITHUB_CLIENT_ID ?? '',
  appSlug: import.meta.env.VITE_GITHUB_APP_SLUG ?? '',
  demo: demoGame(import.meta.env.VITE_DEMO_GAME),
})
