import { TokenService } from '@/services'
import type { LoginResponse, User } from '@demo/api'
import { create } from 'zustand'

type UserWithToken = User & { token?: LoginResponse['token'] }

interface State {
  token?: string
  user?: User
}

interface Action {
  getToken(): string | undefined
  setToken(token: string): void
  setUser(user: UserWithToken): void
  getUser(): User | undefined
  clear(): void
}

export type Store = State & Action

export const useAuthStore = create<Store>((set, get) => {
  const token = TokenService.getToken()

  const getToken = () => get().token
  const setToken = (token: string) => {
    TokenService.setToken(token)
    set({ token })
  }

  const getUser = () => get().user
  const setUser = (user: UserWithToken) => {
    set({ user })
    if (user.token) get().setToken(user.token)
  }

  const clear = () => {
    TokenService.removeToken()
    set({ token: void 0, user: void 0 })
  }

  return { token, user: void 0, getToken, setToken, getUser, setUser, clear }
})
