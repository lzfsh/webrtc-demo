import mysql from 'mysql2/promise'

// 创建一个数据库连接
export const conn = await mysql.createConnection({
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: '123456',
  database: 'demo',
})
