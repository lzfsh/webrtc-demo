import Koa from 'koa'
import { routers } from './router'

const app = new Koa()

routers.forEach((r) => {
  app.use(r.routes()).use(r.allowedMethods())
})

const port = process.env.PORT || 3000

app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})
