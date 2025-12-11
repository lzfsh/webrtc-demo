export function isObject(val: any): val is object {
  const type = typeof val
  return val != null && (type === 'object' || type === 'function')
}
