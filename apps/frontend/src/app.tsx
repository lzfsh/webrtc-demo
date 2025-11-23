import { Suspense, type PropsWithChildren } from 'react'
import { Routes, Route, Navigate, BrowserRouter } from 'react-router'
import { ErrorBoundary } from 'react-error-boundary'
import { ConfigProvider, App as AntdApp } from 'antd'
import { GLOBAL_ANTD_CONF, RoutePath, type RouteConf, OUT_LAYOUT_ROUTE, IN_LAYOUT_ROUTE } from './configs'
import { Fallback, Loading, RouteAuthGuarder } from './components'
import { Layout } from './layout'
import './reset.css'

function Wrapper({ children }: PropsWithChildren) {
  return (
    <ConfigProvider {...GLOBAL_ANTD_CONF}>
      <AntdApp message={{ maxCount: 1 }}>
        <ErrorBoundary fallbackRender={Fallback}>{children}</ErrorBoundary>
      </AntdApp>
    </ConfigProvider>
  )
}

const renderRoute = ({ path, component: Comp, auth }: RouteConf) => {
  let element = (
    <Suspense fallback={<Loading />}>
      <Comp />
    </Suspense>
  )
  if (auth) element = <RouteAuthGuarder>{element}</RouteAuthGuarder>
  return <Route key={path} path={path} element={element} />
}

export default function App() {
  return (
    <Wrapper>
      <BrowserRouter>
        <Routes>
          <Route path={RoutePath.Root} element={<Navigate replace to={RoutePath.Home} />} />
          {OUT_LAYOUT_ROUTE.map(renderRoute)}
          <Route element={<Layout />}>{IN_LAYOUT_ROUTE.map(renderRoute)}</Route>
          <Route path={RoutePath.Other} element={<Navigate replace to={RoutePath.NotFound} />} />
        </Routes>
      </BrowserRouter>
    </Wrapper>
  )
}
