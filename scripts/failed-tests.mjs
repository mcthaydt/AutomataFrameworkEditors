// Reads the JSON that Vitest wrote and prints one short line per failed test: where it ran, what it was called and the
// first line of why. CI runs it after the journeys so that a red run can be read in a few lines instead of a log.
import { readFileSync } from 'node:fs'

const [file] = process.argv.slice(2)
let results
try {
  results = JSON.parse(readFileSync(file ?? '', 'utf8'))
} catch {
  console.log('No results file to read.')
  process.exit(0)
}
const failed = []
for (const suite of results.testResults ?? []) {
  const where = String(suite.name).replace(/^.*\/tests\//, 'tests/')
  for (const test of suite.assertionResults ?? []) {
    if (test.status !== 'failed') continue
    const why = String(test.failureMessages?.[0] ?? '').split('\n')[0]
    failed.push(`${where} > ${test.fullName}\n    ${why.slice(0, 220)}`)
  }
}
console.log(`${failed.length} failed of ${results.numTotalTests} journeys.`)
for (const line of failed) console.log(line)
