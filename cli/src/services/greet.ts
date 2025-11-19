import { defineLoadable, defineOrder } from '../core/define'

export const name = 'greet' as const

export class GreetService {
  greet(name: string) {
    console.log(`hello ${name}`)
  }
}

export default defineLoadable({
  type: 'service',
  name,
  order: defineOrder('service', 0),
  factory: () => new GreetService(),
})
