/* eslint-disable @typescript-eslint/no-empty-object-type */
export interface RTCServer {}
export type RTCServerResponse = RTCIceServer[]

export interface RTCOffer {
  from: string | number
  to: string | number
  sdp: RTCSessionDescriptionInit
}
export type RTCAnswer = RTCOffer

export interface RTCCandidate {
  from: string | number
  to: string | number
  candidate: RTCIceCandidateInit
}
