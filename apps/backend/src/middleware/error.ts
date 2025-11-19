import type { Context, Next } from 'koa'
import * as z from 'zod'
import { badRequest, Code, internalServerError, notFound } from '../utils'

export default function error() {
  return async (ctx: Context, next: Next) => {
    try {
      await next()

      // 处理未匹配到的接口，返回 404
      if (ctx.status === Code.NotFound && !ctx.body) {
        ctx.body = notFound()
      }
    } catch (err) {
      // 处理参数校验错误，返回 400
      if (err instanceof z.ZodError) {
        const reason = 'INVALID_PARAM'
        const message = err.issues.map((item) => item.message).join(', ')
        ctx.body = badRequest({ reason, message })
        return
      }

      // 但其他中间件出现的错误，返回 500
      let message: string | undefined
      if (err instanceof Error) {
        message = err.message
      }
      ctx.body = internalServerError({ message })
    }
  }
}
