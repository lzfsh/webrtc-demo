import Router from '@koa/router'
import authRouter from './auth'
import userRouter from './user'

const apiRouter = new Router({ prefix: '/api' })
apiRouter.use(authRouter.routes()).use(authRouter.allowedMethods())
apiRouter.use(userRouter.routes()).use(userRouter.allowedMethods())

export { authRouter, userRouter }
export default apiRouter
