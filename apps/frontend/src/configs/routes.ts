import { lazy } from 'react'

export interface RouteConf {
  path: string
  component: React.FC
  layout?: boolean
  auth?: boolean
}

export const RoutePath = Object.freeze({
  Root: '/',
  Home: '/home',
  Login: '/login',
  Register: '/register',
  Connect: '/connect',
  NotFound: '/404',
  Other: '*',
})

export const APP_ROUTE: RouteConf[] = [
  {
    path: RoutePath.Login,
    component: lazy(() => import('@/pages/login')),
  },
  {
    path: RoutePath.Register,
    component: lazy(() => import('@/pages/register')),
  },
  {
    path: RoutePath.Home,
    component: lazy(() => import('@/pages/home')),
    layout: true,
    auth: true,
  },
  {
    path: RoutePath.Connect,
    component: lazy(() => import('@/pages/connect')),
    layout: true,
    auth: true,
  },
  {
    path: RoutePath.NotFound,
    component: lazy(() => import('@/pages/not-found')),
  },
]

export const IN_LAYOUT_ROUTE = APP_ROUTE.filter(({ layout }) => layout)
export const OUT_LAYOUT_ROUTE = APP_ROUTE.filter(({ layout }) => !layout)
