import { isEmpty, isObject, isString } from './is'

export function deepFreeze<T extends object>(obj: T): T {
  if (!isObject(obj)) return obj

  Object.keys(obj).forEach((key) => {
    const val = obj[key as keyof T]
    if (isObject(val)) deepFreeze(val)
  })
  return Object.freeze(obj)
}

export interface TransformOptions {
  exclude?: (string | number| symbol)[]
}

/** 去除对象中为空值(undefined/null/空字符串（trim）/空数组/空对象/NaN，0 和 0n 被认为是有效值)的属性 */
export function removeEmptyValues<T>(payload: T, opts: TransformOptions = {}): T {
  const { exclude = [] } = opts
  if (!isObject(payload)) return payload

  if (Array.isArray(payload)) {
    return payload.filter((v, i) => exclude.includes(i) || !isEmpty(v)) as T
  }

  const keys = Object.keys(payload) as (keyof T)[]
  return keys.reduce((r, k) => {
    const v = payload[k]
    if (exclude.includes(k) || !isEmpty(v)) r[k] = v
    return r
  }, {} as T)
}

/** 去除对象中字符串值的左右空白字符  */
export function trimObjectStrings<T>(payload: T, opts: TransformOptions = {}): T {
  const { exclude = [] } = opts
  if (!isObject(payload)) return payload

  // 处理数组情况
  if (Array.isArray(payload)) {
    return payload.map((v, i) => (exclude.includes(i) || !isString(v) ? v : v.trim())) as T
  }

  const keys = Object.keys(payload) as (keyof T)[]
  return keys.reduce((r, k) => {
    const v = payload[k]
    r[k] = (exclude.includes(k) || !isString(v) ? v : v.trim()) as T[keyof T]
    return r
  }, {} as T)
}
