/** 配置文件类型 */
export interface Conf {
  server: {
    port?: number
  }
  datasource: {
    host: string
    port: number
    user: string
    password: string
    database: string
  }
}

export const DefaultConf = Object.freeze({
  server: {
    port: 3000,
  },
})
