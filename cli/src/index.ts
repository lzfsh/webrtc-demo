import { App, Hub, type Context } from './core'
import commands from './commands'
import providers, { type ProviderHub } from './providers'
import services, { type ServiceHub } from './services'

class AppContext implements Context {
  readonly cmd = process.cwd()
  readonly hub: Hub<ProviderHub & ServiceHub> = new Hub<ProviderHub & ServiceHub>(this)
    .add(...providers)
    .add(...services)
}

const app = new App(new AppContext(), {
  name: process.env.NAME,
  description: process.env.DESCRIPTION,
  version: process.env.VERSION,
})

commands.forEach((c) => app.subcommand(c))
app.run(process.argv)
