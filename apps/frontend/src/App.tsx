import { Suspense, type PropsWithChildren } from 'react'
import { Routes, Route, Navigate, BrowserRouter } from 'react-router'
import { ErrorBoundary } from 'react-error-boundary'
import { ConfigProvider, App as AntdApp } from 'antd'
import { antdConf, routes, RoutePath } from './configs'
import { Fallback, Loading } from './components'
import './reset.css'

function Wrapper({ children }: PropsWithChildren) {
  return (
    <ConfigProvider {...antdConf}>
      <AntdApp message={{ maxCount: 1 }}>
        <ErrorBoundary fallbackRender={Fallback}>{children}</ErrorBoundary>
      </AntdApp>
    </ConfigProvider>
  )
}

export default function App() {
  return (
    <Wrapper>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Navigate replace to={RoutePath.Home} />} />
          {routes.map(({ path, component: Comp }) => (
            <Route
              key={path}
              path={path}
              element={
                <Suspense fallback={<Loading />}>
                  <Comp />
                </Suspense>
              }
            />
          ))}
          <Route path='*' element={<Navigate replace to={RoutePath.NotFound} />} />
        </Routes>
      </BrowserRouter>
    </Wrapper>
  )
}
