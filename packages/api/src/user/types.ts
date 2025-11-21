/** 用户连接状态 1: 在线, 0: 离线 */
export const LoginStatus = Object.freeze({ Online: 1, Offline: 0 })
export type ILoginStatus = (typeof LoginStatus)[keyof typeof LoginStatus]

export interface User {
  id: number
  username: string
  email: string
  createdAt: number
  updatedAt: number
}

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

export interface ListUserRequest {
  id?: number // 用户ID
  email?: string // 邮箱
  username?: string // 用户名
  loginStatus?: ILoginStatus // 登录状态
}

export interface UserWithLoginStatus extends User {
  loginStatus: ILoginStatus // 登录状态
}
export type ListUserResponse = UserWithLoginStatus[]
