import type { Context } from './app'

export interface Subcommand {
  name: string
  alias?: string[]
  description: string
  options?: {
    flag: string
    description: string
    default?: any
    parser?: (val: string) => any
  }[]
  action?: (...args: any[]) => any
}

export function defineSubcommand(c: Subcommand) {
  return c
}

export type LoadableFactory<T = any> = (ctx: Context) => T

export interface Loadable<T = any> {
  type: 'provider' | 'service'
  name: string
  description?: string
  order: number
  value?: T
  factory?: LoadableFactory<T>
}

export function defineLoadable<T>(l: Loadable<T>) {
  return l
}

/**
 * 生成加载顺序值，确保 loadable 能够按正确顺序加载。数字越小，注册优先级越高。
 * @param type provider or service
 * @param priority 加载优先级 (0-255)，数值越小优先级越高
 * @returns  编码后的加载顺序值，provider 范围为 0-255，service 范围为 256-511，provider 组件先于 service 组件加载
 */
export function defineOrder(type: Loadable['type'], priority: number) {
  // 通过基础值的不同，确保 provider 和 service 的 order 值不会重叠，且加载优先级比 service 高
  const base = { provider: 0, service: 1 }[type]
  // 边界处理：确保优先级值在有效范围内 (0-255)
  const safePriority = Math.max(0, Math.min(priority, 255))
  // 位运算组合：基础值左移8位 + 优先级值，生成最终 order 值
  // provider: 0 << 8 | priority → 0-255
  // service: 1 << 8 | priority → 256-511
  return (base << 8) | safePriority
}

export function sortLoadables(...loadables: Loadable[]) {
  return loadables.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
}
