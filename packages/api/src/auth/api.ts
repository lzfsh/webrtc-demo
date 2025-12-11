import type { HttpClient, Response } from '../types'
import type { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse } from './types'

export const LOGIN_URL = '/api/auth/login'
export const REGISTER_URL = '/api/auth/register'
export const LOGOUT_URL = '/api/auth/logout'

export function AuthClient<C extends object>(client: HttpClient<C>) {
  const login = (req: LoginRequest, conf?: C) => {
    return client.post<LoginRequest, Response<LoginResponse>>(LOGIN_URL, req, conf)
  }

  const register = (req: RegisterRequest, conf?: C) => {
    return client.post<RegisterRequest, Response<RegisterResponse>>(REGISTER_URL, req, conf)
  }

  const logout = (conf?: C) => {
    return client.post(LOGOUT_URL, {}, conf)
  }

  return { LOGIN_URL, login, REGISTER_URL, register, LOGOUT_URL, logout } as const
}
