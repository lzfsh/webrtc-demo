import type { Context } from 'koa'
import Router from '@koa/router'
import * as z from 'zod'
import { notFound, ok, unauthorized } from '@/helpers'
import { jwt } from '@/middlewares'
import { UserRepo } from '@/repos'
import { LoginStatus, type GetUserResponse, type ListUserRequest, type ListUserResponse } from '@demo/api'

const router = new Router()

router.prefix('/user').use(jwt())

// GET /api/user/profile
// curl -s -X GET http://localhost:3000/api/user/profile -H "Authorization: Bearer <token>" | jq '.'
router.get('/profile', async (ctx: Context) => {
  const { conn } = ctx.inject
  const { id } = ctx.state.user
  if (!id) {
    ctx.body = unauthorized()
    return
  }

  // 查询用户信息
  const userRepo = new UserRepo(conn)
  const user = await userRepo.findOneByID(id)
  if (!user) {
    ctx.body = notFound({ message: 'User not found' })
    return
  }
  const response: GetUserResponse = user
  ctx.body = ok(response)
})

// POST /api/user/list
// curl -s -X POST http://localhost:3000/api/user/list -H "Authorization: Bearer <token>" -H "Content-Type: application/json" | jq '.'
router.post('/list', async (ctx: Context) => {
  const { conn, session } = ctx.inject
  const { id, username, email, loginStatus } = z
    .object({
      id: z.number().int().gte(1).optional(),
      username: z.string().trim().min(1).max(50).optional(),
      email: z.string().trim().email().optional(),
      loginStatus: z.union([z.literal(LoginStatus.Online), z.literal(LoginStatus.Offline)]).optional(),
    })
    .parse(ctx.request.body as ListUserRequest)

  // 创建用户模型实例
  const userRepo = new UserRepo(conn)
  // 查询所有用户（这里简单实现，其他项目可能需要分页）
  const sql: string[] = []
  if (id) sql.push(`id = ${id}`)
  if (username) sql.push(`username LIKE "%${username}%"`)
  if (email) sql.push(`email = "${email}"`)
  const users = await userRepo.findMany(sql.join(' AND '))

  let response: ListUserResponse = users.map((user) => {
    return { ...user, loginStatus: session.client.get(user.id) ? LoginStatus.Online : LoginStatus.Offline }
  })
  if (loginStatus != void 0) {
    response = response.filter((u) => u.loginStatus === loginStatus)
  }
  ctx.body = ok(response)
})

export default router
