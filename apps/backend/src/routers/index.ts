import Router from '@koa/router'
import authRouter from './auth'
import userRouter from './user'
import wsRouter from './ws'

const apiRouter = new Router({ prefix: '/api' })
apiRouter.use(authRouter.routes()).use(authRouter.allowedMethods())
apiRouter.use(userRouter.routes()).use(userRouter.allowedMethods())
apiRouter.use(wsRouter.routes()).use(wsRouter.allowedMethods())

export { authRouter, userRouter, wsRouter }
export default apiRouter
