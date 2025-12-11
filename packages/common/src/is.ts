export function isObject(val: any): val is object {
  const type = typeof val
  return val != null && (type === 'object' || type === 'function')
}

export function isString(val: unknown): val is string {
  return typeof val === 'string'
}

/**
 * 判断是否为空值，空值为 undefined/null/空字符串（trim）/空数组/空对象/NaN，0 和 0n 被认为是有效值
 */
export function isEmpty(value: unknown): boolean {
  if (value == void 0) return true
  if (Number.isNaN(value)) return true
  if (typeof value === 'string' && value.trim() === '') return true
  if (Array.isArray(value) && value.length === 0) return true
  if (typeof value === 'object' && Object.keys(value).length === 0) return true
  return false
}
