import { dirname } from 'node:path'
import { ensureDir } from 'fs-extra'
import { writeFileSync, type WriteFileOptions } from 'node:fs'
import pc from 'picocolors'
import { defineLoadable, defineOrder } from '../core/define'

const LOG = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
} as const

type Level = Lowercase<`${keyof typeof LOG}`>
type Log = { time: Date; level: Level; message: any[] }
type Color = typeof pc.green

function stringify(val: any) {
  if (val instanceof Error) {
    val = { name: val.name, cause: val.cause, message: val.message, stack: val.stack }
  }
  const isObj = typeof val === 'object' && val !== null
  return (isObj ? JSON.stringify(val) : String(val)).replaceAll(/\s+/gim, ' ')
}

function compare(a: Level, b: Level) {
  const LogLevel = Object.freeze({
    [LOG.DEBUG]: 1,
    [LOG.INFO]: 2,
    [LOG.WARN]: 3,
    [LOG.ERROR]: 4,
  })
  if (LogLevel[a] === LogLevel[b]) return 0
  return LogLevel[a] > LogLevel[b] ? 1 : -1
}

class Formatter {
  static json(log: Log): string {
    return JSON.stringify(log)
  }

  static default({ time, level, message }: Log): string {
    return `${time.toISOString()} [${level.toUpperCase()}] ${message.map(stringify).join(', ')}`
  }
}

interface Writer {
  can(log: Log): boolean
  write(formatted: string, log: Log): void
}

interface ConsoleWriterOptions {
  level?: Level
  color?: Record<Level, Color>
}

class ConsoleWriter implements Writer {
  readonly level: Level = LOG.INFO
  readonly color: Record<Level, Color> = {
    [LOG.DEBUG]: pc.cyan,
    [LOG.INFO]: pc.green,
    [LOG.WARN]: pc.yellow,
    [LOG.ERROR]: pc.red,
  }

  constructor(options: ConsoleWriterOptions = {}) {
    Object.assign(this, options)
  }

  can(log: Log): boolean {
    return compare(this.level, log.level) <= 0
  }

  write(formatted: string, { level }: Log) {
    console[level](this.color[level](formatted))
  }
}

interface FileWriterOptions {
  level?: Level
  file?: string
  immediate?: boolean
  limit?: number
  append?: boolean
}

class FileWriter implements Writer {
  readonly level: Level = LOG.DEBUG
  readonly file: string = 'log.log'
  readonly immediate: boolean = false
  readonly limit: number = 50
  readonly append: boolean = true
  readonly encoding: BufferEncoding = 'utf-8'

  private _buffer: string[] = []

  constructor(options: FileWriterOptions = {}) {
    Object.assign(this, options)
  }

  can(log: Log): boolean {
    return compare(this.level, log.level) <= 0
  }

  write(formatted: string) {
    const o: WriteFileOptions = { encoding: this.encoding, flag: this.append ? 'a' : 'w' }
    if (this.immediate) {
      ensureDir(dirname(this.file))
      writeFileSync(this.file, formatted + '\n', o)
    } else {
      this._buffer.push(formatted)
      if (this._buffer.length >= this.limit) {
        ensureDir(dirname(this.file))
        writeFileSync(this.file, this._buffer.join('\n') + '\n', o)
        this._buffer = []
      }
    }
  }
}

export interface LoggerOptions {
  formatter: (log: Log) => string
  writers: Writer[]
}

export class Logger {
  private _options: LoggerOptions = {
    formatter: Formatter.default,
    writers: [],
  }

  constructor(options: Partial<LoggerOptions> = {}) {
    this._options = { ...this._options, ...options }
  }

  log(level: Level, ...message: any[]) {
    const log: Log = { time: new Date(), level, message }
    const str = this._options.formatter(log)
    this._options.writers.forEach((writer) => {
      if (writer.can(log)) writer.write(str, log)
    })
  }

  debug(...message: any[]) {
    this.log(LOG.DEBUG, ...message)
  }

  info(...message: any[]) {
    this.log(LOG.INFO, ...message)
  }

  warn(...message: any[]) {
    this.log(LOG.WARN, ...message)
  }

  error(...message: any[]) {
    this.log(LOG.ERROR, ...message)
  }
}

export const name = 'logger' as const

export const logger = new Logger({
  formatter: Formatter.default,
  writers: [new ConsoleWriter(), new FileWriter({ immediate: true })],
})

export default defineLoadable({
  type: 'provider',
  name,
  order: defineOrder('provider', 0),
  factory: () => {
    return new Logger({
      formatter: Formatter.default,
      writers: [new ConsoleWriter(), new FileWriter()],
    })
  },
})
