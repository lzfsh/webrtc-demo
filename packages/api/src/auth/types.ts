import type { User } from '../user'

export interface LoginRequest extends Pick<User, 'email'> {
  password: string
}

export interface LoginResponse extends User {
  token: string // 登陆凭证
}

export interface RegisterRequest extends Pick<User, 'username' | 'email'> {
  password: string
}

export type RegisterResponse = LoginResponse
