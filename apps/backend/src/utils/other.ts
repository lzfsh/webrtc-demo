export function constant(str: string): string {
  return str.toUpperCase().replace(/\s+/g, '_')
}
