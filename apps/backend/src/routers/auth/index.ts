import type { Context } from 'koa'
import Router from '@koa/router'
import * as z from 'zod'
import type { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse } from '@demo/api'
import { UserRepo } from '@/repos'
import { badRequest, conflict, generateToken, ok } from '@/helpers'
import { jwt } from '@/middlewares'

const router = new Router()

router.prefix('/auth')

// POST /api/auth/login
// curl -s -X POST http://localhost:3000/api/auth/login -d '{"email": "zhangsan@example.com", "password": "123456"}' -H "Content-Type: application/json | jq "."
router.post('/login', async (ctx: Context) => {
  const { conf, conn, session } = ctx.inject
  const { email, password } = z
    .object({
      email: z.string().trim().email(),
      password: z.string().min(6).max(20),
    })
    .parse(ctx.request.body as LoginRequest)

  const userRepo = new UserRepo(conn)
  const user = await userRepo.findOne('email = ? AND password = ?', email, password)
  if (!user) {
    ctx.body = badRequest({ message: 'password is incorrect' })
    return
  }

  const token = generateToken({ id: user.id }, conf.server?.auth)
  // 存储 token 到 session，设置客户端在线状态
  session.client.add(user.id, { token })
  console.log(session.client.get(user.id))

  // 简单点，不设置 cookie，直接返回 token
  const response: LoginResponse = { ...user, token }
  ctx.body = ok(response)
})

// POST /api/auth/register
// curl -s -X POST http://localhost:3000/api/auth/register -d '{"email": "wangwu@example.com", "username": "wangwu", "password": "123456"}' -H "Content-Type: application/json | jq "."
router.post('/register', async (ctx: Context) => {
  const { conf, conn, session } = ctx.inject
  const { username, email, password } = z
    .object({
      username: z.string().trim().min(1).max(50),
      email: z.string().trim().email(),
      password: z.string().min(6).max(20),
    })
    .parse(ctx.request.body as RegisterRequest)

  // 检查用户是否已存在
  const userRepo = new UserRepo(conn)
  const existingUser = await userRepo.findOneByEmail(email)
  if (existingUser) {
    ctx.body = conflict({ message: 'email already exists' })
    return
  }

  // 插入新用户
  const user = await userRepo.insert({ username, email, password })
  if (!user) {
    ctx.body = badRequest({ message: 'create user failed' })
    return
  }

  const token = generateToken({ id: user.id }, conf.server?.auth)
  // 存储 token 到 session，设置客户端在线状态
  session.client.add(user.id, { token })

  // 简单点，不设置 cookie，直接返回 token
  const response: RegisterResponse = { ...user, token }
  ctx.body = ok(response)
})

// POST /api/auth/logout
// curl -s -X POST http://localhost:3000/api/auth/logout -H "Authorization: Bearer <token>" -H "Content-Type: application/json | jq "."
router.post('/logout', jwt({ passthrough: true }), async (ctx: Context) => {
  const { id } = ctx.state.user
  if (id) {
    // 从 session 中删除客户端在线状态
    ctx.inject.session.client.remove(id)
  }
  ctx.body = ok()
})

export default router
