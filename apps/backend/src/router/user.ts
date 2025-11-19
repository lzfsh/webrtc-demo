import type { Context } from 'koa'
import Router from '@koa/router'
import * as z from 'zod'
import type { LoginRequest } from '@demo/api'
import { toUserDTO, type UserModel } from '../model/user'
import { ok, unauthorized } from '../utils'

const router = new Router()

router.post('/api/user/login', async (ctx: Context) => {
  const { email, password } = z
    .object({
      email: z.string('email is not a string').min(1, 'email is empty'),
      password: z.string('password is not a string').min(1, 'password is empty'),
    })
    .parse(ctx.request.body as LoginRequest)

  const sql = 'SELECT * FROM users WHERE email = ? AND password = ?'
  const [rows] = await ctx.inject.conn.query<UserModel[]>(sql, [email, password])

  if (rows.length > 0) {
    ctx.body = ok(toUserDTO(rows[0]))
  } else {
    ctx.body = unauthorized({ message: 'username or password is incorrect' })
  }
})

export default router
