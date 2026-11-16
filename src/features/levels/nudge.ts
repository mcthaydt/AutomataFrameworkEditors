// The four ways a key or a pad button moves what is picked, by one tile.
export type Way = 'left' | 'right' | 'up' | 'down'

export const WAYS: Readonly<Record<string, Way | undefined>> = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'up',
  ArrowDown: 'down',
}
