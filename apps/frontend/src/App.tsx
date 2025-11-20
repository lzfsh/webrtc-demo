import { Suspense, type PropsWithChildren } from 'react'
import { Routes, Route, Navigate, BrowserRouter } from 'react-router'
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary'
import { ConfigProvider, App, Button, Spin } from 'antd'
import { antdConf, routes, RoutePath } from './configs'
import './reset.css'

function Wrapper({ children }: PropsWithChildren) {
  return (
    <ConfigProvider {...antdConf}>
      <App message={{ maxCount: 1 }}>
        <ErrorBoundary fallbackRender={Fallback}>{children}</ErrorBoundary>
      </App>
    </ConfigProvider>
  )
}

export default function Application() {
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

function Loading() {
  return (
    <Spin style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} size='large' />
  )
}

function Fallback({ error }: FallbackProps) {
  const stack: string = error?.stack?.toString()?.replace(/\n/g, '<br/>') ?? ''

  const refresh = () => {
    globalThis.location.reload()
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'start',
        gap: '8px',
        margin: '0 auto',
        padding: '16px',
        width: '900px',
      }}
      role='alert'
    >
      <h1 style={{ fontSize: '24px' }}>Something went wrong!</h1>
      <p style={{ fontSize: '20px', color: '#ff4d4f' }}>{error.message}</p>
      {/* eslint-disable-next-line @eslint-react/dom/no-dangerously-set-innerhtml */}
      {!!stack && <p style={{ fontSize: '14px', color: '#ff4d4f' }} dangerouslySetInnerHTML={{ __html: stack }} />}
      <Button type='primary' onClick={refresh}>
        Try Again!
      </Button>
    </div>
  )
}
