import { CallAnswerAction, CallType, type Call, type CallAnswer, type CancelCall, type EndCall } from './payload/call'
import { MessageEvent } from './const'
import type { Message } from './types'
import type { RTCAnswer, RTCCandidate, RTCOffer, RTCServer, RTCServerResponse } from './payload'

export class Packager {
  static prepareMessage<T>(event: string, payload?: T, rest?: Omit<Message<T>, 'event' | 'payload' | 'id'>) {
    return { ...rest, event, payload }
  }

  static preparePing() {
    return this.prepareMessage(MessageEvent.Ping)
  }

  static preparePong() {
    return this.prepareMessage(MessageEvent.Pong)
  }

  static prepareCall(payload: Call) {
    return this.prepareMessage(MessageEvent.Call, payload)
  }

  static prepareVideoCall(payload: Omit<Call, 'type'>) {
    return this.prepareCall({ ...payload, type: CallType.Video })
  }

  static prepareAudioCall(payload: Omit<Call, 'type'>) {
    return this.prepareCall({ ...payload, type: CallType.Audio })
  }

  static prepareCancelCall(payload: CancelCall) {
    return this.prepareMessage(MessageEvent.CancelCall, payload)
  }

  static prepareCallAnswer(payload: CallAnswer) {
    return this.prepareMessage(MessageEvent.CallAnswer, payload)
  }

  static prepareAcceptCall(payload: Omit<CallAnswer, 'action' | 'reason'>) {
    return this.prepareCallAnswer({ ...payload, action: CallAnswerAction.Accept })
  }

  static prepareDeclineCall(payload: Omit<CallAnswer, 'action' | 'reason' | 'roomId'>) {
    return this.prepareCallAnswer({ ...payload, action: CallAnswerAction.Decline })
  }

  static prepareMissCall(payload: Omit<CallAnswer, 'action' | 'roomId'>) {
    return this.prepareCallAnswer({ ...payload, action: CallAnswerAction.Miss })
  }

  static prepareEndCall(payload: EndCall) {
    return this.prepareMessage(MessageEvent.EndCall, payload)
  }

  static prepareRTCOffer(payload: RTCOffer) {
    return this.prepareMessage(MessageEvent.RTCOffer, payload)
  }

  static prepareRTCAnswer(payload: RTCAnswer) {
    return this.prepareMessage(MessageEvent.RTCAnswer, payload)
  }

  static prepareRTCServer(id: string | number, payload: RTCServer = {}) {
    return this.prepareMessage(MessageEvent.RTCServer, payload, { id })
  }

  static prepareRTCServerResponse(id: string | number, payload: RTCServerResponse) {
    return this.prepareMessage(MessageEvent.RTCServerResponse, payload, { id })
  }

  static prepareRTCCandidate(payload: RTCCandidate) {
    return this.prepareMessage(MessageEvent.RTCCandidate, payload)
  }
}
