import type { User } from '@demo/api'
import type { Connection, ResultSetHeader } from 'mysql2/promise'
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

export function toUserDTO(user: UserModel): User {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    createdAt: new Date(user.created_at).getTime(),
    updatedAt: new Date(user.updated_at).getTime(),
  }
}

export class UserRepo {
  private _db: Connection

  constructor(db: Connection) {
    this._db = db
  }

  async findOneById(id: string | number) {
    const sql = 'SELECT * FROM users WHERE id = ?'
    const [rows] = await this._db.query<UserModel[]>(sql, [id])
    if (rows.length > 0) {
      return toUserDTO(rows[0])
    }
  }

  async findOneByEmail(email: string) {
    const sql = 'SELECT * FROM users WHERE email = ?'
    const [rows] = await this._db.query<UserModel[]>(sql, [email])
    if (rows.length > 0) {
      return toUserDTO(rows[0])
    }
  }

  async findOne(sql: string = '', ...values: any[]) {
    const fullSql = `SELECT * FROM users ${sql.trim() ? `WHERE ${sql}` : ''}`
    const [rows] = await this._db.query<UserModel[]>(fullSql, values)
    if (rows.length > 0) {
      return toUserDTO(rows[0])
    }
  }

  async findMany(sql: string = '', ...values: any[]) {
    const fullSql = `SELECT * FROM users ${sql.trim() ? `WHERE ${sql}` : ''}`
    const [rows] = await this._db.query<UserModel[]>(fullSql, values)
    return rows.map(toUserDTO)
  }

  async insert(user: { username: string; email: string; password: string }) {
    const { username, email, password } = user
    const sql = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)'
    const [{ insertId }] = await this._db.query<ResultSetHeader>(sql, [username, email, password])
    return this.findOneById(insertId)
  }
}
