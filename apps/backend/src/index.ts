import path from 'node:path'
import { cac } from 'cac'
import bodyParser from '@koa/bodyparser'
import logger from 'koa-logger'
import { App } from './app'
import { DEFAULT_APP_CONF, type AppConf, type Conf } from './configs'
import { parseConf, createDBConnection } from './helpers'
import apiRouter from './routers'
import { error } from './middlewares'

async function listen(port: number, conf: Conf = {}) {
  if (!conf.datasource) throw new Error('config.datasource is required')
  const conn = await createDBConnection(conf.datasource)

  const app = new App()

  app.use(error()).use(logger()).use(bodyParser())
  app.inject({ conf, conn }).routers(apiRouter)

  app.listen(port, () => {
    console.log(`Server running on port http://localhost:${port}`)
  })
}

interface MainResult {
  port: number
  conf: Conf
}

async function main({ name, description, version }: AppConf): Promise<MainResult> {
  return new Promise<MainResult>((resolve) => {
    const cli = cac(name)
    cli
      .command('start', description)
      .option('-c, --config <path>', 'Path to config file')
      .option('-p,--port <port>', 'Port to listen on', { default: DEFAULT_APP_CONF.port })
      .action(({ config, port }) => {
        const file = path.join(process.cwd(), ...config.split(path.sep))
        resolve({ port, conf: parseConf(file) })
      })
    cli.version(version)
    cli.help()
    cli.parse()
  })
}

if (require.main === module) {
  const appConf: AppConf = Object.assign({}, DEFAULT_APP_CONF, {
    name: process.env.NAME,
    description: process.env.DESCRIPTION,
    version: process.env.VERSION,
  })
  main(appConf).then(({ port, conf }) => {
    listen(port, conf)
  })
}
