import middleware from 'koa-jwt'
import type { Context, Middleware, Next } from 'koa'
import type { Options } from 'koa-jwt'

export type JwtMiddleWareOptions = Partial<Pick<Options, 'isRevoked' | 'debug'>>

export default function jwt(opts: JwtMiddleWareOptions = {}): Middleware {
  const ret = async (ctx: Context, next: Next) => {
    const { auth } = ctx.inject.conf
    // interface Options {
    //   /** 设置用于签名和验证 JWT 的密钥 */
    //   secret: Secret | SecretLoader
    //   /** 指定将解码后的 JWT payload 存储在 ctx.state 上的属性名 */
    //   key?: string
    //   /** 指定将原始 token 存储在 ctx.state 上的属性名 */
    //   tokenKey?: string
    //   /** 自定义从请求中提取 token 的方法 */
    //   getToken?(ctx: Koa.Context, opts: jwt.Options): string | null
    //   /** 检查 token 是否已被撤销（例如用户注销后） */
    //   isRevoked?(ctx: Koa.Context, decodedToken: object, token: string): Promise<boolean>
    //   /** 控制当没有提供 token 时的行为，false (默认): 抛出 401 错误，true: 允许无 token 请求通过 */
    //   passthrough?: boolean
    //   /** 指定从哪个 cookie 名称中读取 token */
    //   cookie?: string
    //   /** 开启调试模式，输出详细日志 */
    //   debug?: boolean
    //   /** 验证 JWT 的受众（audience）字段，确保 token 是为指定受众生成的 */
    //   audience?: string | string[]
    //   /** 验证 JWT 的发行者（issuer）字段，确保 token 是由指定发行者生成的 */
    //   issuer?: string | string[]
    //   /** 指定支持的加密算法*/
    //   algorithms?: string[]
    // }
    await middleware({
      secret: auth?.secret ?? '',
      // algorithms: auth?.algorithm ? [auth.algorithm] : void 0,
      // audience: auth?.audience,
      // issuer: auth?.issuer,
      // 如果是采用 cookie 登陆，这里最好写死 cookie
      // cookie: auth?.cookie,
      /** key 写死，不要改，后面 Router 中间件都是通过 ctx.state.user 来获取用户信息 */
      key: 'user',
      /** tokenKey 写死，不要改，后面 Router 中间件都是通过 ctx.state.token 来获取 token */
      tokenKey: 'token',
      ...opts,
    })(ctx, next)
  }
  return ret as Middleware
}
