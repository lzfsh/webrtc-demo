export interface Message<T = undefined> {
  id?: string | number
  event: string
  payload?: T
}

export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] }

export interface Serializer {
  name: string
  serialize<T>(message: T): string | ArrayBuffer
  deserialize<T>(raw: string | ArrayBuffer): T
}
