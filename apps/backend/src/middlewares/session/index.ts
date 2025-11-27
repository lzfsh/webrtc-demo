import type { Context, Next, Middleware, Session } from 'koa'

export default function session(): Middleware {
  const ret = async (ctx: Context, next: Next) => {
    const { state, inject } = ctx
    const { manager } = inject
    let session: Session = { manager }
    if (state.user?.id) {
      const user = manager.getUser(state.user.id)
      const client = state.token ? user?.getClient(state.token) : void 0
      session = { manager, user, client }
    }
    Object.assign(ctx, { session })
    await next()
  }
  return ret as Middleware
}
