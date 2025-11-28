export interface Packet<T = undefined> {
  event: string
  data?: T
}

export const ping: Packet = {
  event: 'ping',
}

export const pong: Packet = {
  event: 'pong',
}
