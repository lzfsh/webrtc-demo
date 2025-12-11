export type DefaultEvent = Record<string, (...args: any[]) => any>

export class TypedEvent<E extends DefaultEvent = DefaultEvent> {
  private _listeners: Map<keyof E, Set<E[keyof E]>> = new Map()

  listeners<N extends keyof E>(event: N) {
    return Array.from(this._listeners.get(event) ?? [])
  }

  has(event: string) {
    return this._listeners.has(event) && this._listeners.get(event)?.size !== 0
  }

  on<N extends keyof E>(event: N, listener: E[N]) {
    if (!this._listeners.has(event)) this._listeners.set(event, new Set())
    this._listeners.get(event)?.add(listener)
  }

  once<N extends keyof E>(event: N, listener: E[N]) {
    if (!this._listeners.has(event)) this._listeners.set(event, new Set())
    const once: any = (...args: any[]) => {
      this.off(event, once)
      return listener(...args)
    }
    this._listeners.get(event)?.add(once)
  }

  emit<N extends keyof E>(event: N, ...args: Parameters<E[N & string]>) {
    const rets: ReturnType<E[N]>[] = []
    this._listeners.get(event)?.forEach((listener) => {
      const ret = listener(...args)
      if (ret != void 0) rets.push(ret)
    })
    return rets.length > 0 ? rets : void 0
  }

  off<N extends keyof E>(event: N, listener?: E[N]) {
    if (listener) {
      this._listeners.get(event)?.delete(listener)
    } else {
      this._listeners.get(event)?.clear()
    }
  }

  clear() {
    this._listeners.clear()
  }

  addListener<N extends keyof E>(event: N, listener: E[N]) {
    this.on(event, listener)
  }

  addEventListener<N extends keyof E>(event: N, listener: E[N]) {
    this.on(event, listener)
  }

  removeListener<N extends keyof E>(event: N, listener: E[N]) {
    this.off(event, listener)
  }

  removeEventListener<N extends keyof E>(event: N, listener: E[N]) {
    this.off(event, listener)
  }
}
