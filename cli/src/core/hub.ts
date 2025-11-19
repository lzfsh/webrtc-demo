import type { Context } from './app'
import type { Loadable } from './define'

export type DefaultHubDefine = Record<string, any>

export class Hub<Def extends object = DefaultHubDefine> {
  private _loadables = new Map<string, Loadable>()
  private _ctx: Context

  constructor(context: Context) {
    this._ctx = context
  }

  add(...loadables: Loadable[]) {
    loadables.forEach((l) => {
      if (!l.value && !l.factory) {
        throw new Error('Loadable must defines a value or a factory.')
      }
      this._loadables.set(l.name, l)
    })
    return this
  }

  remove<N extends keyof Def & string>(...names: N[]) {
    names.forEach((name) => this._loadables.delete(name))
    return this
  }

  clear() {
    this._loadables.clear()
    return this
  }

  get<N extends keyof Def & string>(name: N): Loadable<Def[N]> {
    const loadable = this._loadables.get(name)
    if (!loadable) throw new Error(`Loadable ${name} not found`)
    return loadable
  }

  getValue<N extends keyof Def & string>(name: N): Def[N] {
    const loadable = this.get(name)
    if (!loadable.value) loadable.value = loadable.factory?.(this._ctx)
    return loadable.value as Def[N]
  }
}
