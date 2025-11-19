import { sortLoadables } from '../core/define'
import logger, { name as loggerName, type Logger } from './logger'
import request, { name as requestName, type Request } from './request'

const providers = sortLoadables(logger, request)

export type ProviderHub = {
  [loggerName]: Logger
  [requestName]: Request
}

export default providers
