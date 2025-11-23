import type { HttpClient, Response } from '../types'
import type { GetUserResponse, ListUserRequest, ListUserResponse } from './types'

export const GET_USER_URL = '/api/user/profile'
export const LIST_USER_URL = '/api/user/list'

export function UserClient<C extends object>(client: HttpClient<C>) {
  const getUser = (conf?: C) => {
    return client.get<Response<GetUserResponse>>(GET_USER_URL, conf)
  }

  const listUser = (req: ListUserRequest, conf?: C) => {
    return client.post<ListUserRequest, Response<ListUserResponse>>(LIST_USER_URL, req, conf)
  }

  return { GET_USER_URL, getUser, LIST_USER_URL, listUser } as const
}
