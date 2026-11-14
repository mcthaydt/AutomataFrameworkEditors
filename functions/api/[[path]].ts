// The one Cloudflare Pages Function: every /api request, handled by the service feature.
import { handleApi } from '../../src/features/service/service.ts'

export const onRequest = (context: {
  request: Request
  env: Parameters<typeof handleApi>[1]
}): Promise<Response> => handleApi(context.request, context.env)
