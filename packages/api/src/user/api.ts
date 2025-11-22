import type { HttpClient, Response } from '../types'
import type { GetUserResponse, ListUserRequest, ListUserResponse } from './types'

export function UserClient<C extends object>(client: HttpClient) {
  const GetUserURL = '/api/user/profile'
  const getUser = (conf?: C) => {
    return client.get<Response<GetUserResponse>>(GetUserURL, conf)
  }

  const ListUserURL = '/api/user/list'
  const listUser = (req: ListUserRequest, conf?: C) => {
    return client.post<ListUserRequest, Response<ListUserResponse>>(ListUserURL, req, conf)
  }

  return { GetUserURL, getUser, ListUserURL, listUser } as const
}
