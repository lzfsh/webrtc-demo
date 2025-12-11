import type { Context, Injection, Next, Middleware } from 'koa'

export default function inject(inject: Injection): Middleware {
  const ret = async (ctx: Context, next: Next) => {
    // TODO: 修改
    Object.assign(ctx, { inject })
    await next()
  }
  return ret as Middleware
}
