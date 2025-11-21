import Koa, { type Injection } from 'koa'
import bodyParser from '@koa/bodyparser'
import type Router from '@koa/router'
import { error, inject } from './middlewares'

export class App extends Koa {
  constructor() {
    super()
    this.use(bodyParser()).use(error())
  }

  routers(...routes: Router[]) {
    routes.forEach((r) => {
      this.use(r.routes()).use(r.allowedMethods())
    })
    return this
  }

  inject(o: Injection) {
    this.use(inject(o))
    return this
  }
}
