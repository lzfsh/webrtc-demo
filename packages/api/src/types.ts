export interface Client {
  get: <R = any, C = any>(url: string, conf?: C) => Promise<R>
  delete<R = any, C = any>(url: string, conf?: C): Promise<R>
  post: <D = any, R = any, C = any>(url: string, data: D, conf?: C) => Promise<R>
  // head: <R = any, C = any>(url: string, conf?: C) => Promise<R>
  // options: <R = any, C = any>(url: string, conf?: C) => Promise<R>
  put: <D = any, R = any, C = any>(url: string, data: D, conf?: C) => Promise<R>
  patch: <D = any, R = any, C = any>(url: string, data: D, conf?: C) => Promise<R>
  // postForm: <D = any, R = any, C = any>(url: string, data: D, conf?: C) => Promise<R>
  // putForm: <D = any, R = any, C = any>(url: string, data: D, conf?: C) => Promise<R>
  // patchForm: <D = any, R = any, C = any>(url: string, data: D, conf?: C) => Promise<R>
}

export interface Response<T = any> {
  code: number
  reason?: string
  message: string
  data: T
}
