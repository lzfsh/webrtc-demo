import mysql from 'mysql2/promise'
import type { Conf } from '@/configs'

export function createDBConnection(conf: Conf['datasource']) {
  return mysql.createConnection(conf)
}
