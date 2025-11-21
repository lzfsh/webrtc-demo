import type { Context } from 'koa'
import Router from '@koa/router'
import { ok } from '@/helpers'

const router = new Router({ prefix: '/user' })

router.post('/list', async (ctx: Context) => {
  ctx.body = ok([])
})

export default router
