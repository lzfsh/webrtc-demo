export class TokenService {
  static readonly TOKEN_KEY = '__DEMO_TOKEN__'

  static getToken() {
    return localStorage.getItem(this.TOKEN_KEY) ?? void 0
  }

  static setToken(token: string) {
    localStorage.setItem(this.TOKEN_KEY, token)
  }

  static removeToken() {
    localStorage.removeItem(this.TOKEN_KEY)
  }
}
