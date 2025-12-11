import { useEffect } from 'react'
import { useMemoizedFn } from 'ahooks'
import type { DefaultEvent, TypedEvent } from '@/utils'
import type { WebSocketClient, WebSocketEvent, WebSocketService, WebSocketServiceEvent } from '@/services'

/** 这里 WebSocketService，WebSocketClient 都继承自 TypedEvent，但是通过最后一种函数声明方式，是检测不出对应的事件对象，不得已采用函数声明重载的方式标注类型  */
export function useListener<N extends keyof WebSocketServiceEvent & string>(
  target: WebSocketService | null | undefined,
  event: N,
  listener: WebSocketServiceEvent[N],
): void
export function useListener<N extends keyof WebSocketEvent & string>(
  target: WebSocketClient | null | undefined,
  event: N,
  listener: WebSocketEvent[N],
): void
export function useListener<E extends DefaultEvent, N extends keyof E & string>(
  target: TypedEvent<E> | null | undefined,
  event: N,
  listener: E[N],
) {
  const memoizedListener = useMemoizedFn(listener)

  useEffect(() => {
    target?.on(event, memoizedListener as any)
    return () => {
      target?.off(event, memoizedListener as any)
    }
  }, [target, event, memoizedListener])
}
