import { Command } from 'commander'
import { type Hub } from './hub'
import { type Subcommand } from './define'
import { type ProviderHub } from '../providers'
import { type ServiceHub } from '../services'

export interface AppOptions {
  name?: string
  description?: string
  version?: string
}

export interface Context {
  readonly cmd: string
  readonly hub: Hub<ProviderHub & ServiceHub>
}

export class App {
  private _program = new Command()

  get raw() {
    return this._program
  }

  readonly name: string = 'clt'
  readonly description: string = 'A command line tool.'
  readonly version: string = '1.0.0'
  readonly context: Context

  constructor(context: Context, options: AppOptions = {}) {
    this.context = context

    const { name, description, version } = options
    if (name) this.name = name
    if (description) this.description = description
    if (version) this.version = version
    this._program.name(this.name).description(this.description).version(this.version)
  }

  subcommand(c: Subcommand) {
    const subcommand = this._program
      .command(c.name)
      .aliases(c.alias || [])
      .description(c.description)

    if (c.action) {
      subcommand.action((...args) => c.action!(...args.slice(0, -1), this))
    }

    if (c.options) {
      c.options.forEach((o) => {
        if (o.parser) {
          subcommand.option(o.flag, o.description, o.parser, o.default)
        } else {
          subcommand.option(o.flag, o.description, o.default)
        }
      })
    }
    return this
  }

  parse(argv?: string[]) {
    this._program.parseOptions(argv ?? process.argv)
    return this._program.opts()
  }

  run(argv?: string[]) {
    this._program.parse(argv)
    return this
  }
}
