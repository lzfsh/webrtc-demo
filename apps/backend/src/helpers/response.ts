import { message } from 'statuses'
import { type Response, Code } from '@demo/api'

export class HttpResponse<T = null> {
  public readonly code: number
  public readonly reason?: string
  public readonly message: string
  public readonly data: T | null = null

  constructor(opts: Partial<Response<T>>) {
    this.code = opts.code ?? Code.Ok
    this.reason = (() => {
      if (opts.reason) return opts.reason
      if (this.code < Code.Ok || this.code >= Code.MultipleChoices) {
        const ret = message[this.code]
        if (ret) return ret.toUpperCase().replace(/\s+/g, '_')
      }
    })()
    this.message = opts.message ?? message[this.code] ?? (message[Code.Ok] as string)
    this.data = opts.data ?? null
  }

  withData(data: T): HttpResponse<T> {
    return new HttpResponse({ code: this.code, reason: this.reason, message: this.message, data })
  }

  withReason(reason: string): HttpResponse<T> {
    return new HttpResponse({ code: this.code, reason, message: this.message, data: this.data as T })
  }

  withMessage(message: string): HttpResponse<T> {
    return new HttpResponse({ code: this.code, reason: this.reason, message, data: this.data as T })
  }

  toJSON(): Response<T> {
    return {
      code: this.code,
      reason: this.reason,
      message: this.message,
      data: this.data as T,
    }
  }
}

/** 成功响应，不传 data 时，返回 data 为 null */
export function ok<T>(data?: T): HttpResponse<T> {
  return new HttpResponse({ code: Code.Ok, message: 'ok', data })
}

export type FailOptions = Partial<Pick<Response, 'code' | 'reason' | 'message'>>

export function fail<T>(opts: FailOptions = {}): HttpResponse<T> {
  return new HttpResponse(opts)
}

export function badRequest(opts: FailOptions = {}): HttpResponse {
  return new HttpResponse({ ...opts, code: Code.BadRequest })
}

export function unauthorized(opts: FailOptions = {}): HttpResponse {
  return new HttpResponse({ ...opts, code: Code.Unauthorized })
}

export function forbidden(opts: FailOptions = {}): HttpResponse {
  return new HttpResponse({ ...opts, code: Code.Forbidden })
}

export function notFound(opts: FailOptions = {}): HttpResponse {
  return new HttpResponse({ ...opts, code: Code.NotFound })
}

export function conflict(opts: FailOptions = {}): HttpResponse {
  return new HttpResponse({ ...opts, code: Code.Conflict })
}

export function clientClosed(opts: FailOptions = {}): HttpResponse {
  return new HttpResponse({ ...opts, code: Code.ClientClosed })
}

export function internalServerError(opts: FailOptions = {}): HttpResponse {
  return new HttpResponse({ ...opts, code: Code.InternalServerError })
}

export function serviceUnavailable(opts: FailOptions = {}): HttpResponse {
  return new HttpResponse({ ...opts, code: Code.ServiceUnavailable })
}

export function gatewayTimeout(opts: FailOptions = {}): HttpResponse {
  return new HttpResponse({ ...opts, code: Code.GatewayTimeout })
}
