import path from 'node:path'
import { cac } from 'cac'
import Koa, { type Injection } from 'koa'
import bodyParser from '@koa/bodyparser'
import logger from 'koa-logger'
import { defaultConf, mergeConf, parseConf, type Conf } from './configs'
import apiRouter from './routers'
import { error, inject } from './middlewares'
import { createClientSession, createDBConnection } from './helpers'

const name = process.env.NAME ?? '@demo/server'
const description = process.env.DESCRIPTION ?? 'Backend server for demo.'
const version = process.env.VERSION ?? '1.0.0'

async function listen(conf: Conf = {}): Promise<void> {
  if (!conf.data?.database) throw new Error('config.data.database is required')

  const conn = await createDBConnection(conf.data.database)
  const clientSession = createClientSession({
    expiresIn: conf.server!.websocket!.heartbeat!,
    retainsIn: conf.server!.auth!.expiresIn!,
  })
  const injection: Injection = { conf, conn, session: { client: clientSession } }

  const app = new Koa()
  app.use(error()).use(logger()).use(bodyParser()).use(inject(injection))
  app.use(apiRouter.routes()).use(apiRouter.allowedMethods())
  app.listen(conf.server!.port!)
}

function main() {
  const cli = cac(name)
  cli
    .command('start', description)
    .option('-c, --config <path>', 'Path to config file')
    .option('-p,--port <port>', 'Port to listen on', { default: defaultConf.server!.port })
    .action(async (opts) => {
      try {
        const file = path.join(process.cwd(), ...opts.config.split(path.sep))
        // 合并配置文件和命令行参数
        const conf = mergeConf(defaultConf, parseConf(file), { server: { port: opts.port } })
        await listen(conf)
        console.log(`Server running on port http://localhost:${conf.server!.port!}`)
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
