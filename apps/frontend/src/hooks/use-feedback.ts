import { App } from 'antd'

export function useFeedback() {
  return App.useApp()
}

export function useMessage() {
  return App.useApp().message
}

export function useModal() {
  return App.useApp().modal
}

export function useNotification() {
  return App.useApp().notification
}
