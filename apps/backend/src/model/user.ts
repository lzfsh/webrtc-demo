import type { RowDataPacket } from 'mysql2/promise'

export interface UserModel extends RowDataPacket {
  id: number
  created_at: string
  updated_at: string
  deleted_at?: string
  username: string
  email: string
  password: string
}

export function toUserDTO(user: UserModel) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    createdAt: new Date(user.created_at).getTime(),
    updatedAt: new Date(user.updated_at).getTime(),
  }
}
