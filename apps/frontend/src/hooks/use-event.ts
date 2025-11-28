import { useEffect } from 'react'
import { useMemoizedFn } from 'ahooks'
import type { DefaultEvent, TypedEvent } from '@/utils'

export function useEventListener<E extends DefaultEvent, Evt extends keyof E & string>(
  target: TypedEvent<E>,
  event: Evt,
  listener: E[Evt],
) {
  const memoizedListener = useMemoizedFn(listener)

  useEffect(() => {
    target.on(event, memoizedListener as any)
    return () => {
      target.off(event, memoizedListener as any)
    }
  }, [target, event, memoizedListener])
}
