import type { Client, Response } from '../types'
import type { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse } from './types'

export function AuthClient(client: Client) {
  const LoginURL = '/api/auth/login'
  const login = <C = any>(req: LoginRequest, conf?: C) => {
    return client.post<LoginRequest, Response<LoginResponse>, C>(LoginURL, req, conf)
  }

  const RegisterURL = '/api/auth/register'
  const register = <C = any>(req: RegisterRequest, conf?: C) => {
    return client.post<RegisterRequest, Response<RegisterResponse>, C>(RegisterURL, req, conf)
  }

  return { LoginURL, login, RegisterURL, register } as const
}
