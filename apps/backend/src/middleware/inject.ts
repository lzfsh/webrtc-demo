import type { Context, Next } from 'koa'

export default function inject(inject: object) {
  return async (ctx: Context, next: Next) => {
    Object.assign(ctx, { inject })
    await next()
  }
}
