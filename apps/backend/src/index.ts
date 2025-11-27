import path from 'node:path'
import { createServer } from 'node:http'
import { cac } from 'cac'
import Koa, { type Injection, type UserState } from 'koa'
import { WebSocketServer } from 'ws'
import bodyParser from '@koa/bodyparser'
import logger from 'koa-logger'
import { defaultConf, mergeConf, parseConf, type Conf } from './configs'
import apiRouter from './routers'
import { error, inject } from './middlewares'
import { createSessionManager, createDBConnection, parseToken } from './helpers'

const name = process.env.NAME ?? '@demo/server'
const description = process.env.DESCRIPTION ?? 'Backend server for demo.'
const version = process.env.VERSION ?? '1.0.0'

const server = new WebSocketServer({ noServer: true, autoPong: false })

async function listen(conf: Conf) {
  if (!conf.server.port) throw new Error('config.server.port is required')
  if (!conf.server.auth) throw new Error('config.server.auth is required')
  if (!conf.server.websocket) throw new Error('config.server.websocket is required')
  if (!conf.data?.database) throw new Error('config.data.database is required')

  const conn = await createDBConnection(conf.data.database)
  const manager = createSessionManager()
  const injection: Injection = { conf, conn, manager }

  const app = new Koa()
  app.use(error()).use(logger()).use(bodyParser()).use(inject(injection))
  app.use(apiRouter.routes()).use(apiRouter.allowedMethods())

  const http = createServer(app.callback())
  http.on('upgrade', (req, socket, head) => {
    // CONNECT /api/ws/connect
    // websocat -E -vvvv  ws://localhost:3000/api/ws/connect?token=<token>
    server.handleUpgrade(req, socket, head, (ws) => {
      // 只有在 /api/ws/socket 路径下才处理升级请求
      if (!req.url?.startsWith('/api/ws/connect')) {
        ws.close(1008, 'path /api/ws/connect is required')
        return
      }
      // 解析写到 req 上的 token
      const token = req.url.split('token=')[1] ?? ''
      if (!token) {
        ws.close(1008, 'token is required')
        return
      }
      // 验证 token 是否有效
      const user = parseToken<UserState>(token, conf.server.auth)
      if (!user) {
        ws.close(1008, 'token is invalid')
        return
      }
      server.emit('connection', ws, req)
      manager.getUser(user.id)?.getClient(token)?.addSocket(ws)
    })
  })
  return http.listen(conf.server.port)
}

function main() {
  const cli = cac(name)
  cli
    .command('start', description)
    .option('-c, --config <path>', 'Path to config file')
    .option('-p,--port <port>', 'Port to listen on', { default: defaultConf.server.port })
    .action(async (opts) => {
      try {
        const file = path.join(process.cwd(), ...opts.config.split(path.sep))
        // 合并配置文件和命令行参数
        const conf = mergeConf(defaultConf, parseConf(file), { server: { port: opts.port } } as Conf)
        await listen(conf)
        console.log(`Server running on port http://localhost:${conf.server.port}`)
      } catch (err) {
        console.error(err)
      }
    })
  cli.version(version)
  cli.help()
  cli.parse()
}

if (require.main === module) {
  main()
}
