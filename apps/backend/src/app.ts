import Koa from 'koa'
import bodyParser from '@koa/bodyparser'
import type Router from '@koa/router'
import { inject, error } from './middleware'

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

  inject(o: object) {
    this.use(inject(o))
    return this
  }
}
