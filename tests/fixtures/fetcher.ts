// A made-up `fetch` for tests of code that calls GitHub: it records every call and answers from a function.

export interface Call {
  readonly url: string
  readonly method: string
  readonly headers: Headers
  /** The body as the code sent it: parsed when it is JSON, otherwise the text; undefined when there was none. */
  readonly body: unknown
}

export type Handler = (call: Call) => Response | Promise<Response>

export interface Recorder {
  readonly fetcher: typeof fetch
  readonly calls: Call[]
}

/** A JSON answer, as GitHub gives one. */
export function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...headers },
  })
}

export function recorder(handler: Handler): Recorder {
  const calls: Call[] = []
  const fetcher: typeof fetch = async (input, init) => {
    const request = new Request(input, init)
    const text = request.body === null ? '' : await request.text()
    let body: unknown
    if (text !== '') {
      try {
        body = JSON.parse(text)
      } catch {
        body = text
      }
    }
    const call: Call = { url: request.url, method: request.method, headers: request.headers, body }
    calls.push(call)
    return handler(call)
  }
  return { fetcher, calls }
}

/** The keys a router answers: `METHOD /path` exactly as the code sends it (the path as it is on the wire, no query). */
export type Routes = Readonly<Record<string, (call: Call) => Response | Promise<Response>>>

/** A handler that answers by method and path, and fails the test's expectations loudly on a call nobody planned. */
export function route(routes: Routes): Handler {
  return (call) => {
    const { pathname } = new URL(call.url)
    const answerer = routes[`${call.method} ${pathname}`]
    if (answerer === undefined) return json({ message: `no route for ${call.method} ${pathname}` }, 599)
    return answerer(call)
  }
}
