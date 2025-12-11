import { createAntdPopup, createPopupHook } from '@/hooks'
import { OutgoingModal } from '../components'

export const useOutgoingModal = createPopupHook(
  OutgoingModal,
  (action) => {
    const open = action.open
    const close = (opts: Parameters<typeof action.close>[1] = {}) => {
      action.close(void 0, opts)
    }
    return { open, close } as const
  },
  createAntdPopup,
)
