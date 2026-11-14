// The page's entry: mounts the suite on the page, with the sign-in settings Vite was given at build time.
import { mountSuite } from './index.ts'

const target = document.getElementById('app')
if (target === null) throw new Error('The page has no #app to mount into.')
mountSuite(target, {
  webUrl: import.meta.env.VITE_GITHUB_WEB_URL ?? 'https://github.com',
  clientId: import.meta.env.VITE_GITHUB_CLIENT_ID ?? '',
  appSlug: import.meta.env.VITE_GITHUB_APP_SLUG ?? '',
})
