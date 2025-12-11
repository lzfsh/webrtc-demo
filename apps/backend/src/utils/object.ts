import { isObject } from './is'

export function deepFreeze<T extends object>(obj: T): T {
  if (!isObject(obj)) return obj

  Object.keys(obj).forEach((key) => {
    const val = obj[key as keyof T]
    if (isObject(val)) deepFreeze(val)
  })
  return Object.freeze(obj)
}
