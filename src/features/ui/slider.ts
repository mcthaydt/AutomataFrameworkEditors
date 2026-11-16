// The arithmetic behind the Slider and the number pad: a value is always inside its limits and on its step.

const places = (n: number): number => String(n).split('.')[1]?.length ?? 0

/**
 * `value` held between `least` and `most` and moved to the nearest step from `least`. Not a number is `least`. The
 * answer is rounded to the step's own decimals, so 0.1 + 0.2 is 0.3 and never 0.30000000000000004.
 */
export function snap(value: number, least: number, most: number, step: number): number {
  if (!Number.isFinite(value)) return least
  const held = Math.min(most, Math.max(least, value))
  const stepped = least + Math.round((held - least) / step) * step
  const rounded = Number(stepped.toFixed(Math.max(places(step), places(least))))
  return Math.min(most, Math.max(least, rounded))
}
