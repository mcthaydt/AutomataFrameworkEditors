import type { Api } from '#src/features/api/api.ts'

/** A page with no game to ask: the team's reads (notes, a helper's change) find nobody home and say so. */
export const noGame = {
  open: async () => ({ ok: false, problem: 'offline' }),
  notes: async () => ({ ok: false, problem: 'offline' }),
} as unknown as Api
