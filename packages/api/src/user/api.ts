import type { Client, Response } from '../types'
import type {
  ListUserRequest,
  ListUserResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
} from './types'

export function UserClient(client: Client) {
  const loginURL = '/api/user/login'
  const login = <C = any>(req: LoginRequest, conf?: C) => {
    return client.post<LoginRequest, Response<LoginResponse>, C>(loginURL, req, conf)
  }

  const registerURL = '/api/user/register'
  const register = <C = any>(req: RegisterRequest, conf?: C) => {
    return client.post<RegisterRequest, Response<RegisterResponse>, C>(registerURL, req, conf)
  }

  const listUserURL = '/api/user/list'
  const listUser = <C = any>(req: ListUserRequest, conf?: C) => {
    return client.post<ListUserRequest, Response<ListUserResponse>, C>(listUserURL, req, conf)
  }

  return { loginURL, login, registerURL, register, listUserURL, listUser } as const
}
