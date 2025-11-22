import Koa, { type Injection } from 'koa'
import type Router from '@koa/router'

import { inject } from './middlewares'

export class App extends Koa {
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
