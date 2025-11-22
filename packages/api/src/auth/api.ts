import type { HttpClient, Response } from '../types'
import type { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse } from './types'

export function AuthClient<C extends object>(client: HttpClient<C>) {
  const LoginURL = '/api/auth/login'
  const login = (req: LoginRequest, conf?: C) => {
    return client.post<LoginRequest, Response<LoginResponse>>(LoginURL, req, conf)
  }

  const RegisterURL = '/api/auth/register'
  const register = (req: RegisterRequest, conf?: C) => {
    return client.post<RegisterRequest, Response<RegisterResponse>>(RegisterURL, req, conf)
  }

  return { LoginURL, login, RegisterURL, register } as const
}
