import axios, { CanceledError, type AxiosRequestConfig } from 'axios'
import { useMemo } from 'react'
import { useNavigate } from 'react-router'
import { Code, isFailure, type HttpClient, LOGIN_URL, REGISTER_URL, UserClient, AuthClient } from '@demo/api'
import { useAuthStore } from '@/stores'
import { useMessage } from '@/hooks'
import { RoutePath } from '@/configs'

let client: HttpClient<AxiosRequestConfig>

export function useHttpClient() {
  const message = useMessage()
  const authStore = useAuthStore()
  const navigate = useNavigate()

  const init = () => {
    const instance = axios.create({
      timeout: 10 * 1000,
      withCredentials: true,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    })

    instance.interceptors.request.use(
      (conf) => {
        const noTokenAPIs = Object.freeze([LOGIN_URL, REGISTER_URL])
        if (conf.url && noTokenAPIs.includes(conf.url)) return conf
        // 如果直接拿 token，有闭包问题，可能拿到过期的 token，所以使用函数获取，确保每次能拿到最新的 token
        const token = authStore.getToken()
        if (token) conf.headers['Authorization'] = `Bearer ${token}`
        return conf
      },
      (err: any) => {
        if (err instanceof Error) message.error(err.message)
        return err
      },
    )
    instance.interceptors.response.use(
      (response) => {
        const { data } = response
        if (isFailure(data)) message.error(data.message)
        if (data.code === Code.Unauthorized) {
          navigate(RoutePath.Login)
          authStore.clear()
        }
        return data
      },
      (err: any) => {
        if (err instanceof CanceledError) return err
        if (err instanceof Error) message.error(err.message)
        return err
      },
    )

    const client: HttpClient<AxiosRequestConfig> = {
      get: <R = any>(url: string, conf?: AxiosRequestConfig): Promise<R> => {
        return instance.get<null, R>(url, conf)
      },
      delete: <R = any>(url: string, conf?: AxiosRequestConfig): Promise<R> => {
        return instance.delete<null, R>(url, conf)
      },
      post: <D = any, R = any>(url: string, data: D, conf?: AxiosRequestConfig): Promise<R> => {
        return instance.post<null, R>(url, data, conf)
      },
      put: <D = any, R = any>(url: string, data: D, conf?: AxiosRequestConfig): Promise<R> => {
        return instance.put<null, R>(url, data, conf)
      },
      patch: <D = any, R = any>(url: string, data: D, conf?: AxiosRequestConfig): Promise<R> => {
        return instance.patch<null, R>(url, data, conf)
      },
    }
    return client
  }

  return (client ??= init())
}

export function useUserClient() {
  const client = useHttpClient()
  return useMemo(() => UserClient(client), [client])
}

export function useAuthClient() {
  const client = useHttpClient()
  return useMemo(() => AuthClient(client), [client])
}
