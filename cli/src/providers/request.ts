import axios, { type AxiosInstance } from 'axios'
import { defineLoadable, defineOrder, type LoadableFactory } from '../core/define'

export const name = 'request' as const

export type Request = AxiosInstance

export const factory: LoadableFactory<Request> = ({ hub }) => {
  const logger = hub.getValue('logger')

  const ins = axios.create({
    timeout: 1000 * 10,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  })

  ins.interceptors.request.use(
    (conf) => {
      const { url, method } = conf
      logger.debug(`${method?.toUpperCase()} ${url}`)
      return conf
    },
    (err) => {
      logger.error(`Request occurred error:`, err?.message)
      return err
    },
  )

  ins.interceptors.response.use(
    (response) => {
      const { data, config } = response
      const { method, url } = config
      logger.debug(`${method?.toUpperCase()} ${url} success, response is`, data)
      return data
    },
    (err) => {
      logger.error(`Request occurred error:`, err?.message)
      return err
    },
  )

  return ins
}

export default defineLoadable({
  type: 'provider',
  name,
  order: defineOrder('provider', 1),
  factory,
})
