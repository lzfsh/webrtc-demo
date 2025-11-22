import type { Client, Response } from '../types'
import type { GetUserResponse, ListUserRequest, ListUserResponse } from './types'

export function UserClient(client: Client) {
  const GetUserURL = '/api/user/profile'
  const getUser = <C = any>(conf?: C) => {
    return client.get<Response<GetUserResponse>, C>(GetUserURL, conf)
  }

  const ListUserURL = '/api/user/list'
  const listUser = <C = any>(req: ListUserRequest, conf?: C) => {
    return client.post<ListUserRequest, Response<ListUserResponse>, C>(ListUserURL, req, conf)
  }

  return { GetUserURL, getUser, ListUserURL, listUser } as const
}
