import { cac } from 'cac'
import mysql from 'mysql2/promise'
import { App } from './app'
import { routers } from './router'
import { parseConf, type Conf } from './utils'
import path from 'node:path'

interface MainOptions {
  name: string
  description: string
  version: string
}

async function start(conf: Conf) {
  const conn = await mysql.createConnection(conf.datasource)

  const app = new App()
  const { port = 3000 } = conf.server
  app.inject({ conf, conn }).routers(...routers)
  app.listen(port, () => {
    console.log(`Server running on port http://127.0.0.1:${port}`)
  })
}

async function main({ name, description, version }: MainOptions) {
  const cli = cac(name)
  cli
    .command('start', description)
    .option('-c, --config <path>', 'Path to config file')
    .action(({ config }) => {
      const file = path.join(process.cwd(), ...config.split(path.sep))
      start(parseConf(file))
    })
  cli.version(version)
  cli.help()
  cli.parse()
}

if (require.main === module) {
  main({
    name: process.env.NAME ?? '@demo/server',
    description: process.env.DESCRIPTION ?? 'Backend server for demo.',
    version: process.env.VERSION ?? '1.0.0',
  })
}
