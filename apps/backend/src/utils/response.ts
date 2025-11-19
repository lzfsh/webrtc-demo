import { message } from 'statuses'
import type { Response } from '@demo/api'
import { constant } from './other'

export const Code = Object.freeze({
  Ok: 200,
  MultipleChoices: 300,
  BadRequest: 400,
  Unauthorized: 401,
  Forbidden: 403,
  NotFound: 404,
  Conflict: 409,
  ClientClosed: 499,
  InternalServerError: 500,
  ServiceUnavailable: 503,
  GatewayTimeout: 504,
})

export class HttpResponse<T = null> {
  public readonly code: number
  public readonly reason?: string
  public readonly message: string
  public readonly data: T | null = null

  constructor(options: Partial<Response<T>>) {
    this.code = options.code ?? Code.Ok
    this.reason = (() => {
      if (options.reason) return options.reason
      if (this.code < Code.Ok || this.code >= Code.MultipleChoices) {
        const ret = message[this.code]
        if (ret) return constant(ret)
      }
    })()
    this.message = options.message ?? message[this.code] ?? (message[Code.Ok] as string)
    this.data = options.data ?? null
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

export function ok<T>(data: T): HttpResponse<T> {
  return new HttpResponse({ code: Code.Ok, message: 'ok', data })
}

export type FailOptions = Partial<Pick<Response, 'code' | 'reason' | 'message'>>

export function fail<T>(options: FailOptions = {}): HttpResponse<T> {
  return new HttpResponse(options)
}

export function badRequest(options: FailOptions = {}): HttpResponse {
  return new HttpResponse({ ...options, code: Code.BadRequest })
}

export function unauthorized(options: FailOptions = {}): HttpResponse {
  return new HttpResponse({ ...options, code: Code.Unauthorized })
}

export function forbidden(options: FailOptions = {}): HttpResponse {
  return new HttpResponse({ ...options, code: Code.Forbidden })
}

export function notFound(options: FailOptions = {}): HttpResponse {
  return new HttpResponse({ ...options, code: Code.NotFound })
}

export function conflict(options: FailOptions = {}): HttpResponse {
  return new HttpResponse({ ...options, code: Code.Conflict })
}

export function clientClosed(options: FailOptions = {}): HttpResponse {
  return new HttpResponse({ ...options, code: Code.ClientClosed })
}

export function internalServerError(options: FailOptions = {}): HttpResponse {
  return new HttpResponse({ ...options, code: Code.InternalServerError })
}

export function serviceUnavailable(options: FailOptions = {}): HttpResponse {
  return new HttpResponse({ ...options, code: Code.ServiceUnavailable })
}

export function gatewayTimeout(options: FailOptions = {}): HttpResponse {
  return new HttpResponse({ ...options, code: Code.GatewayTimeout })
}
