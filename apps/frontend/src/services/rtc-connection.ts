import { TypedEvent } from '@/utils'

export type RTCConnectionEvent = {
  test: (data: string) => void
}
export class RTCConnection extends TypedEvent<RTCConnectionEvent> {
  private _pc: RTCPeerConnection

  constructor() {
    super()
    this._pc = new RTCPeerConnection()
  }

  createOffer(options?: RTCOfferOptions) {
    return this._pc?.createOffer(options).then((offer) => {
      this._pc.setLocalDescription(offer)
      return offer
    })
  }

  createAnswer(options?: RTCAnswerOptions) {
    return this._pc?.createAnswer(options).then((answer) => {
      this._pc.setLocalDescription(answer)
      return answer
    })
  }
}
