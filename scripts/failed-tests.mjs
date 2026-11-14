// Reads the JSON that Vitest wrote and prints the failed journeys grouped by why they failed: how many, a few names,
// and the first lines of the message. CI runs it after the journeys so that a red run can be read in a few lines
// instead of a log of hundreds.
import { readFileSync } from 'node:fs'

const [file] = process.argv.slice(2)
let results
try {
  results = JSON.parse(readFileSync(file ?? '', 'utf8'))
} catch {
  console.log('No results file to read.')
  process.exit(0)
}
// The escape character that starts a colour code, written so that no control character sits in a pattern.
const COLOUR = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g')
const groups = new Map()
let failed = 0
for (const suite of results.testResults ?? []) {
  const where = String(suite.name).replace(/^.*\/tests\//, '')
  for (const test of suite.assertionResults ?? []) {
    if (test.status !== 'failed') continue
    failed += 1
    // The message without colour codes or stack lines: what was expected and what the page said instead.
    const lines = String(test.failureMessages?.[0] ?? '')
      .replace(COLOUR, '')
      .split('\n')
      .filter((line) => line.trim() !== '' && !/^\s+at /.test(line))
      .slice(0, 7)
      .map((line) => `      ${line.slice(0, 180)}`)
    const key = lines.join('\n')
    const group = groups.get(key) ?? { names: [], key }
    group.names.push(`${where} > ${test.fullName}`)
    groups.set(key, group)
  }
}
console.log(`${failed} failed of ${results.numTotalTests} journeys, in ${groups.size} kinds.`)
for (const { names, key } of [...groups.values()].sort((a, b) => b.names.length - a.names.length)) {
  console.log(`\n${names.length} x`)
  for (const name of names.slice(0, 4)) console.log(`    ${name.slice(0, 170)}`)
  if (names.length > 4) console.log(`    ... and ${names.length - 4} more`)
  console.log(key)
}
