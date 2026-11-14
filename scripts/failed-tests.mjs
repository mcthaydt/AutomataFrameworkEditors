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
    // The first lines of the message, without colour codes: what was expected and what the page said instead.
    const why = String(test.failureMessages?.[0] ?? '')
      .replace(/\u001b\[[0-9;]*m/g, '')
      .split('\n')
      .filter((line) => line.trim() !== '')
      .slice(0, 6)
      .map((line) => `    ${line.slice(0, 200)}`)
      .join('\n')
    failed.push(`${where} > ${test.fullName}\n${why}`)
  }
}
console.log(`${failed.length} failed of ${results.numTotalTests} journeys.`)
for (const line of failed) console.log(line)
