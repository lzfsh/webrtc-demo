import type { Context } from 'koa'
import Router from '@koa/router'
import * as z from 'zod'
import type { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse } from '@demo/api'
import { UserRepo } from '@/repos'
import { badRequest, conflict, generateToken, ok } from '@/helpers'

const router = new Router()

router.prefix('/auth')

// POST /api/auth/login
// curl -s -X POST http://localhost:3000/api/auth/login -d '{"email": "zhangsan@example.com", "password": "123456"}' -H "Content-Type: application/json | jq "."
router.post('/login', async (ctx: Context) => {
  const { email, password } = z
    .object({
      email: z.string().trim().email(),
      password: z.string().min(6).max(20),
    })
    .parse(ctx.request.body as LoginRequest)

  const userRepo = new UserRepo(ctx.inject.conn)
  const user = await userRepo.findOne('email = ? AND password = ?', email, password)
  if (!user) {
    ctx.body = badRequest({ message: 'password is incorrect' })
    return
  }

  // 简单点，不设置 cookie，直接返回 token
  const token = generateToken({ id: user.id }, ctx.inject.conf.auth)
  const response: LoginResponse = { ...user, token }
  ctx.body = ok(response)
})

// POST /api/auth/register
// curl -s -X POST http://localhost:3000/api/auth/register -d '{"email": "wangwu@example.com", "username": "wangwu", "password": "123456"}' -H "Content-Type: application/json | jq "."
router.post('/register', async (ctx: Context) => {
  const { username, email, password } = z
    .object({
      username: z.string().trim().min(1).max(50),
      email: z.string().trim().email(),
      password: z.string().min(6).max(20),
    })
    .parse(ctx.request.body as RegisterRequest)

  // 检查用户是否已存在
  const userRepo = new UserRepo(ctx.inject.conn)
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

  // 简单点，不设置 cookie，直接返回 token
  const token = generateToken({ id: user.id }, ctx.inject.conf.auth)
  const response: RegisterResponse = { ...user, token }
  ctx.body = ok(response)
})

export default router
