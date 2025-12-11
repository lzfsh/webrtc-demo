import { useEffect, useRef } from 'react'
import { useOutletContext, useSearchParams } from 'react-router'
import { Button, Flex } from 'antd'
import { CallType } from '@demo/ws'
import type { OutletContext } from '@/layout'
import { useDocumentTitle, useListener } from '@/hooks'
import { WebSocketSrvEvent } from '@/services'
import { useAuthStore } from '@/stores'
import { Connect } from '@/configs'

export default function PageConnect() {
  const { user } = useAuthStore()
  const { ws } = useOutletContext<OutletContext>()
  const [searchParams] = useSearchParams()
  useDocumentTitle('Connect')

  const pcRef = useRef<RTCPeerConnection>(null)
  const localStreamRef = useRef<MediaStream>(null)
  const localMediaRef = useRef<HTMLMediaElement>(null)
  const remoteStreamRef = useRef<MediaStream | null>(null)
  const remoteMediaRef = useRef<HTMLMediaElement>(null)

  const search = Connect.parseSearchParams(searchParams)
  const type = search.type ?? CallType.Audio
  const isCaller = search.caller === user?.id
  const isCallee = search.callee === user?.id

  const createMediaElement = (stream: MediaStream, muted: boolean = true) => {
    let mediaElement: HTMLMediaElement | null = null
    if (type === CallType.Video) {
      const video = window.document.createElement('video')
      video.style.cssText = `width: calc(100% - 16px)`
      // video.controls = false
      video.autoplay = true
      video.muted = muted
      video.srcObject = stream
      mediaElement = video
    } else if (type === CallType.Audio) {
      const audio = window.document.createElement('audio')
      // audio.controls = false
      audio.autoplay = true
      audio.muted = muted
      audio.srcObject = stream
      mediaElement = audio
    }
    if (mediaElement) window.document.getElementById('player')?.appendChild(mediaElement)
    return mediaElement
  }

  const setupPeerConnection = async () => {
    if (!isCaller && !isCallee) return
    if (!search.caller || !search.callee) return
    if (pcRef.current) return

    const rtcServers = await ws.getRTCServers()
    const constraints: MediaStreamConstraints = {
      audio: true,
      video: type === CallType.Video,
    }
    const stream = await window.navigator.mediaDevices.getUserMedia(constraints)
    localStreamRef.current = stream
    if (type === CallType.Video) {
      localMediaRef.current = createMediaElement(stream)
    }

    const pc = new RTCPeerConnection({ iceServers: rtcServers.payload })
    pc.ontrack = ({ streams, track }) => {
      if (!remoteStreamRef.current) {
        remoteStreamRef.current = new MediaStream()
        remoteMediaRef.current = createMediaElement(remoteStreamRef.current, false)
      }
      if (streams.length > 0) {
        streams.forEach((stream) => {
          stream.getTracks().forEach((track) => {
            remoteStreamRef.current?.addTrack(track)
          })
        })
      } else {
        /**
         * why track? streams may be an empty arrays
         * when addTrack in the remote peer is called without the second parameter, event.streams is an empty array
         * @see {@link https://stackoverflow.com/questions/77990313/why-webrtc-peer-gets-empty-event-streams-array-in-track-event}
         * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/addTrack}
         */
        remoteStreamRef.current.addTrack(track)
      }
    }

    pc.onicecandidate = ({ candidate }) => {
      if (!candidate) return
      if (isCaller && search.callee) ws.forwardRTCCandidate(candidate, search.callee)
      if (isCallee && search.caller) ws.forwardRTCCandidate(candidate, search.caller)
    }

    stream.getTracks().forEach((track) => pc.addTrack(track, stream))
    pcRef.current = pc

    if (isCaller && search.callee) {
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      ws.forwardRTCOffer(offer, search.callee)
    }
  }

  const closePeerConnection = () => {
    if (pcRef.current) {
      pcRef.current.close()
      pcRef.current.ontrack = null
      pcRef.current.onicecandidate = null
      pcRef.current = null
    }
    if (localMediaRef.current) {
      localMediaRef.current.srcObject = null
      localMediaRef.current.remove()
      localMediaRef.current = null
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        remoteStreamRef.current?.removeTrack(track)
        track.stop()
      })
      localStreamRef.current = null
    }

    if (remoteMediaRef.current) {
      remoteMediaRef.current.srcObject = null
      remoteMediaRef.current.remove()
      remoteMediaRef.current = null
    }
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((track) => {
        remoteStreamRef.current?.removeTrack(track)
        track.stop()
      })
      remoteStreamRef.current = null
    }
  }

  const hangUp = () => {
    if (isCaller) ws.forwardCallEnd(search.callee!)
    if (isCallee) ws.forwardCallEnd(search.caller!)
    closePeerConnection()
    Connect.close()
  }

  useEffect(() => {
    if (isCaller) setupPeerConnection()
    return closePeerConnection
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useListener(ws, WebSocketSrvEvent.RTCOffer, async ({ payload }) => {
    const { from, to, sdp } = payload
    if (to !== user?.id) return

    if (!pcRef.current) {
      await setupPeerConnection()
    }
    const pc = pcRef.current!
    await pc.setRemoteDescription(sdp)
    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    ws.forwardRTCAnswer(answer, from)
  })

  useListener(ws, WebSocketSrvEvent.RTCAnswer, async ({ payload }) => {
    const { to, sdp } = payload
    const pc = pcRef.current
    if (!pc || to !== user?.id) return

    await pc.setRemoteDescription(sdp)
  })

  useListener(ws, WebSocketSrvEvent.RTCCandidate, ({ payload }) => {
    const { to, candidate } = payload
    const pc = pcRef.current
    if (!pc || to !== user?.id) return

    pc.addIceCandidate(candidate)
  })

  useListener(ws, WebSocketSrvEvent.EndCall, ({ payload }) => {
    const { to } = payload
    if (to !== user?.id) return
    closePeerConnection()
    Connect.close()
  })

  return (
    <Flex vertical align='center' gap={16}>
      <Flex id='player' style={{ width: '100%' }} justify='space-between' gap={16} align='center'></Flex>
      <Button type='primary' danger onClick={hangUp}>
        Hang up
      </Button>
    </Flex>
  )
}
