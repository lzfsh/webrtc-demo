import type { Response } from './types'

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

export function isSuccess<T>(resp: Response<T>): boolean {
  return resp.code >= Code.Ok && resp.code < Code.MultipleChoices
}

export function isFailure<T>(resp: Response<T>): boolean {
  return resp.code < Code.Ok || resp.code >= Code.MultipleChoices
}
