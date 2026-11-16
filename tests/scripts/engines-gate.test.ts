import { describe, expect, test } from 'vitest'
import { type Ask, getJson, type Job, judge, listJobs } from '../../scripts/engines-gate.ts'

const job = (name: string, conclusion: string | null): Job => ({ name, conclusion })
const chromium = (a: string | null, b: string | null): Job[] => [
  job('browsers (chromium 1/2)', a),
  job('browsers (chromium 2/2)', b),
]

describe('judge: both shards of a browser must have passed', () => {
  test('passes when both shards passed', () => {
    const verdict = judge([chromium('success', 'success')], 'chromium')
    expect(verdict.ok).toBe(true)
    expect(verdict.lines).toEqual(['browsers (chromium 1/2): success', 'browsers (chromium 2/2): success'])
  })

  test('fails when a shard failed, was cancelled, or has no result', () => {
    expect(judge([chromium('success', 'failure')], 'chromium').ok).toBe(false)
    expect(judge([chromium('cancelled', 'success')], 'chromium').ok).toBe(false)
    expect(judge([chromium('success', null)], 'chromium').ok).toBe(false)
  })

  test('fails when a shard is missing, and when the browser has no shards at all', () => {
    expect(judge([[job('browsers (chromium 1/2)', 'success')]], 'chromium').ok).toBe(false)
    expect(judge([[]], 'chromium').ok).toBe(false)
  })

  test('reads only the shards of the browser it was asked about', () => {
    const jobs = [...chromium('success', 'success'), job('browsers (webkit 1/2)', 'failure')]
    expect(judge([jobs], 'chromium').ok).toBe(true)
    expect(judge([jobs], 'webkit').ok).toBe(false)
  })

  test('a shard that was run again counts by its last result: failed then passed is a pass', () => {
    const first = chromium('success', 'failure')
    const second = [job('browsers (chromium 2/2)', 'success')]
    expect(judge([first, second], 'chromium').ok).toBe(true)
  })

  test('a shard that was run again counts by its last result: passed then failed is a fail', () => {
    const first = chromium('success', 'success')
    const second = [job('browsers (chromium 2/2)', 'failure')]
    expect(judge([first, second], 'chromium').ok).toBe(false)
  })

  test('re-running only the check itself, which lists no shards, keeps the shards of the attempt before', () => {
    const first = chromium('success', 'success')
    const second = [job('engines (chromium)', 'failure')]
    expect(judge([first, second], 'chromium').ok).toBe(true)
  })
})

const answer = (status: number, body: unknown = {}): Awaited<ReturnType<Ask>> => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
})
const noWait = { tries: 5, wait: async () => {} }

describe('getJson: asks again when GitHub is the one that failed', () => {
  test('a 502 and then an answer gives the answer, after one more try', async () => {
    const seen: number[] = []
    const replies = [answer(502), answer(200, { jobs: [] })]
    const ask: Ask = async () => {
      seen.push(seen.length)
      return replies.shift() ?? answer(500)
    }
    expect(await getJson('https://api.github.com/x', 't', ask, noWait)).toEqual({ jobs: [] })
    expect(seen).toHaveLength(2)
  })

  test('a dropped connection, a 500 and a 429 are asked again too', async () => {
    const replies: (Awaited<ReturnType<Ask>> | Error)[] = [
      new Error('socket hang up'),
      answer(500),
      answer(429),
      answer(200, 1),
    ]
    const ask: Ask = async () => {
      const next = replies.shift()
      if (next instanceof Error) throw next
      return next ?? answer(500)
    }
    expect(await getJson('u', 't', ask, noWait)).toBe(1)
  })

  test('it gives up after the tries it was given, and says what GitHub answered', async () => {
    let asked = 0
    const ask: Ask = async () => {
      asked += 1
      return answer(502)
    }
    await expect(getJson('https://api.github.com/x', 't', ask, noWait)).rejects.toThrow(/HTTP 502/)
    expect(asked).toBe(5)
  })

  test('a 404 or a 403 is not asked again', async () => {
    let asked = 0
    const ask: Ask = async () => {
      asked += 1
      return answer(404)
    }
    await expect(getJson('u', 't', ask, noWait)).rejects.toThrow(/HTTP 404/)
    expect(asked).toBe(1)
  })

  test('it waits longer after each failure, and sends the token', async () => {
    const waited: number[] = []
    const headers: Record<string, string>[] = []
    const replies = [answer(502), answer(502), answer(200, 'ok')]
    const ask: Ask = async (_url, init) => {
      headers.push(init.headers)
      return replies.shift() ?? answer(500)
    }
    await getJson('u', 'secret', ask, { tries: 5, wait: async (n) => void waited.push(n) })
    expect(waited).toEqual([1, 2])
    expect(headers[0]?.Authorization).toBe('Bearer secret')
  })
})

describe('listJobs: reads every page of an attempt', () => {
  test('a full page of 100 asks for the next one, and the last short page ends it', async () => {
    const page = (count: number, from: number): { jobs: Job[] } => ({
      jobs: Array.from({ length: count }, (_, i) => job(`job ${from + i}`, 'success')),
    })
    const urls: string[] = []
    const bodies = [page(100, 0), page(3, 100)]
    const ask: Ask = async (url) => {
      urls.push(url)
      return answer(200, bodies.shift())
    }
    const jobs = await listJobs('o/r', '42', 2, 't', ask, noWait)
    expect(jobs).toHaveLength(103)
    expect(urls).toEqual([
      'https://api.github.com/repos/o/r/actions/runs/42/attempts/2/jobs?per_page=100&page=1',
      'https://api.github.com/repos/o/r/actions/runs/42/attempts/2/jobs?per_page=100&page=2',
    ])
  })
})
