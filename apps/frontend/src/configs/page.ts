import { CallType, type Call } from '@demo/ws'
import { RoutePath } from '@/configs'

export interface ConnectSearchParams {
  type: Call['type']
  room: string
  caller?: string | number
  callee?: string | number
}

export class Page {
  static close() {
    window.close()
  }
}

export class Connect extends Page {
  static readonly SearchParam = Object.freeze({
    Type: 'type',
    Room: 'room',
    Caller: 'caller',
    Callee: 'callee',
  })

  static openInBlank(searchParams: ConnectSearchParams) {
    const url = new URL(RoutePath.Connect, window.location.origin)
    Object.entries(searchParams).forEach(([key, value]) => {
      url.searchParams.set(key, value)
    })
    window.open(url, '_blank')
  }

  static parseSearchParams(searchParams: URLSearchParams): Partial<ConnectSearchParams> {
    const search = Object.fromEntries(searchParams.entries()) as unknown as ConnectSearchParams

    return {
      room: search.room,
      type: [CallType.Video, CallType.Audio].includes(search.type) ? search.type : CallType.Audio,
      // 排除 0 和 NaN
      caller: search.caller ? Number(search.caller) || void 0 : void 0,
      // 排除 0 和 NaN
      callee: search.callee ? Number(search.callee) || void 0 : void 0,
    }
  }
}
