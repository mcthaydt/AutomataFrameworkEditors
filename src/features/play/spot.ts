/** `m:ss` of a count of ticks. */
export function clock(ticks: number, hz: number): string {
  const seconds = Math.max(0, Math.floor(ticks / hz))
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}
