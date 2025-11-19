// import { cac } from 'cac'
import mysql from 'mysql2/promise'
import { App } from './app'
import { routers } from './router'

interface MainOptions {
  name: string
  version: string
}

// function main({ name, version }: MainOptions) {
//   const cli = cac(name)
//   cli.option('-c, --config <path>', 'Path to config file')
//   cli.action((path) => {})
//   cli.version(version)
// }

async function main({ name, version }: MainOptions) {
  const port = 3000

  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '123456',
    database: 'demo',
    // table: 'user',
  })
  await conn.query('SELECT * FROM users WHERE username = ? AND password = ?', ['admin', '123456'])

  const app = new App()
  app.inject({ conn }).routers(...routers)
  app.listen(port, () => {
    console.log(`Server running on port http://localhost:${port}`)
  })
}

if (require.main === module) {
  main({
    name: process.env.NAME ?? '@demo/server',
    version: process.env.VERSION ?? '1.0.0',
  })
}
