import { isEmpty, isObject } from './is'

export function cleanEmptyField<T>(payload: T, options: { recursive?: boolean } = { recursive: false }): T {
  if (!isObject(payload)) return payload

  if (Array.isArray(payload)) {
    return payload
      .map((item) => (options.recursive && isObject(item) ? cleanEmptyField(item, options) : item))
      .filter((value) => !isEmpty(value)) as T
  }

  const fields = Object.keys(payload) as (keyof T)[]
  return fields.reduce((result, field) => {
    let value = payload[field]
    if (options.recursive && isObject(value)) value = cleanEmptyField(value, options)
    if (!isEmpty(value)) result[field] = value
    return result
  }, {} as T)
}
