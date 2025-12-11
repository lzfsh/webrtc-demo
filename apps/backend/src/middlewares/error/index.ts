import type { Context, Middleware, Next } from 'koa'
import * as z from 'zod'
import { badRequest, internalServerError, notFound, unauthorized } from '@/helpers'
import { Code } from '@demo/api'

export default function error(): Middleware {
  const ret = async (ctx: Context, next: Next) => {
    try {
      await next()

      // 处理未匹配到的接口，返回 404
      if (ctx.status === Code.NotFound && !ctx.body) {
        ctx.body = notFound()
      }
    } catch (err) {
      console.log(err)
      // 处理参数校验错误，返回 400
      if (err instanceof z.ZodError) {
        const reason = 'INVALId_PARAM'
        const message = err.issues.map((item) => `${item.path.join(', ')}: ${item.message}`).join(', ')
        ctx.body = badRequest({ reason, message })
        return
      }

      // 处理其他中间件出现的错误，返回 500
      let message: string | undefined
      if (err instanceof Error) {
        message = err.message
        // 处理 jwt 校验错误，返回 401
        // TODO: 修改
        if (err.name === 'UnauthorizedError') {
          ctx.body = unauthorized({ message })
          return
        }
      }

      ctx.body = internalServerError({ message })
    }
  }
  return ret as Middleware
}
