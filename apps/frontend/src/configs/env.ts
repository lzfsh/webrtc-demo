export class Env {
  static readonly WS_PREFIX = import.meta.env.VITE_APP_WS_PREFIX || '/api/ws/connect'

  static int(env: string): number | undefined
  static int(env: string, defaultVal: number): number
  static int(env: string, defaultVal?: number): number | undefined {
    const value = env ? Number.parseInt(env) : NaN
    return Number.isNaN(value) ? defaultVal : value
  }

  static float(env: string): number | undefined
  static float(env: string, defaultVal: number): number
  static float(env: string, defaultVal?: number): number | undefined {
    const value = env ? Number.parseFloat(env) : NaN
    return Number.isNaN(value) ? defaultVal : value
  }

  static bool(env: string, defaultVal?: boolean): boolean {
    const truthy = ['true', '1', 'yes', 'on'].includes(env.toLowerCase())
    return truthy ? true : (defaultVal ?? false)
  }

  static json<T = object>(env: string): T | undefined
  static json<T = object>(env: string, defaultVal: T): T
  static json<T = object>(env: string, defaultVal?: T): T | undefined {
    try {
      return env ? JSON.parse(env) : defaultVal
    } catch {
      return defaultVal
    }
  }
}
