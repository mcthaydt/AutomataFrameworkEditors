// The real API code (`handleApi`) in front of the pretend GitHub, called the way the page calls it.
import { handleApi } from '#src/features/service/service.ts'
import type { Answer } from '#src/features/wire/wire.ts'
import { type FakeGitHub, type PEOPLE, startFakeGitHub } from './fake-github/server.ts'

/** The address the page is served from in these tests. */
export const SITE = 'https://editors.test'
/** The one game a visitor may open. */
export const DEMO = 'grandma/crate-game'

export interface TestApi {
  readonly fake: FakeGitHub
  /** Calls the real handleApi as `person`, from the site's own origin. A 'visitor' sends no token. */
  call<T>(
    person: (typeof PEOPLE)[number] | 'visitor',
    method: 'GET' | 'POST',
    path: string,
    body?: unknown,
  ): Promise<{ status: number; answer: Answer<T> }>
  /** The same, with the headers and token chosen by the test. */
  raw<T>(
    method: 'GET' | 'POST',
    path: string,
    init?: { headers?: Record<string, string>; body?: unknown },
  ): Promise<{ status: number; answer: Answer<T> }>
  close(): Promise<void>
}

export async function startTestApi(
  env: { DEMO_GAME?: string | undefined } = { DEMO_GAME: DEMO },
): Promise<TestApi> {
  const fake = await startFakeGitHub(0, SITE)
  const apiEnv = { ...fake.env, ...(env.DEMO_GAME === undefined ? {} : { DEMO_GAME: env.DEMO_GAME }) }
  const raw: TestApi['raw'] = async (method, path, init = {}) => {
    const request = new Request(`${SITE}${path}`, {
      method,
      headers: {
        ...(method === 'POST' ? { origin: SITE, 'content-type': 'application/json' } : {}),
        ...init.headers,
      },
      ...(init.body === undefined ? {} : { body: JSON.stringify(init.body) }),
    })
    const res = await handleApi(request, apiEnv)
    return { status: res.status, answer: (await res.json()) as never }
  }
  return {
    fake,
    raw,
    call: (person, method, path, body) => {
      return raw(method, path, {
        headers: person === 'visitor' ? {} : { authorization: `Bearer ${fake.tokenFor(person)}` },
        body,
      })
    },
    close: () => fake.close(),
  }
}
