export type DefaultEvent = Record<string, (...args: any[]) => any>

export class TypedEvent<E extends DefaultEvent = DefaultEvent> {
  private _listeners: Map<keyof E, Set<E[keyof E]>> = new Map()

  listeners<Evt extends keyof E & string>(event: Evt) {
    return Array.from(this._listeners.get(event) ?? [])
  }

  has(event: string) {
    return this._listeners.has(event) && this._listeners.get(event)?.size !== 0
  }

  on<Evt extends keyof E & string>(event: Evt, listener: E[Evt]) {
    if (!this._listeners.has(event)) this._listeners.set(event, new Set())
    this._listeners.get(event)?.add(listener)
  }

  once<Evt extends keyof E & string>(event: Evt, listener: E[Evt]) {
    if (!this._listeners.has(event)) this._listeners.set(event, new Set())
    const once: any = (...args: any[]) => {
      this.off(event, once)
      return listener(...args)
    }
    this._listeners.get(event)?.add(once)
  }

  emit<Evt extends keyof E & string>(event: Evt, ...args: Parameters<E[Evt]>) {
    const rets: ReturnType<E[Evt]>[] = []
    this._listeners.get(event)?.forEach((listener) => {
      const ret = listener(...args)
      if (ret != void 0) rets.push(ret)
    })
    return rets.length > 0 ? rets : void 0
  }

  off<Evt extends keyof E & string>(event: Evt, listener?: E[Evt]) {
    if (listener) {
      this._listeners.get(event)?.delete(listener)
    } else {
      this._listeners.get(event)?.clear()
    }
  }

  clear() {
    this._listeners.clear()
  }

  addListener<Evt extends keyof E & string>(event: Evt, listener: E[Evt]) {
    this.on(event, listener)
  }

  addEventListener<Evt extends keyof E & string>(event: Evt, listener: E[Evt]) {
    this.on(event, listener)
  }

  removeListener<Evt extends keyof E & string>(event: Evt, listener: E[Evt]) {
    this.off(event, listener)
  }

  removeEventListener<Evt extends keyof E & string>(event: Evt, listener: E[Evt]) {
    this.off(event, listener)
  }
}
