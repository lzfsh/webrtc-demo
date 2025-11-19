import { type App, defineSubcommand } from '../core'

export default defineSubcommand({
  name: 'greet <name>',
  description: 'greet someone',
  options: [
    {
      flag: '-t, --times <times>',
      description: 'times to greet',
      default: 1,
      parser: (val: string) => Number.parseInt(val),
    },
  ],
  action: (name: string, options: { times: number }, { context: { hub } }: App) => {
    const service = hub.getValue('greet')
    for (let i = 0; i < options.times; i++) {
      service.greet(name)
    }
  },
})
