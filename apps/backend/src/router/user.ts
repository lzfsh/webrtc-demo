import Router from '@koa/router'

const router = new Router()

router.get('/api/user/:id', async (ctx) => {
  ctx.body = 'Hello World!'
})

export default router
