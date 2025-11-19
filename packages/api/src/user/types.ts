/** 用户连接状态 1: 在线, 0: 离线 */
export const ConnStatus = Object.freeze({ Online: 1, Offline: 0 })
export type IConnStatus = (typeof ConnStatus)[keyof typeof ConnStatus]

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
  connStatus?: IConnStatus // 连接状态
}

export type ListUserResponse = (User & {
  connStatus: IConnStatus // 连接状态
})[]
