import { type PropsWithChildren } from 'react'
import { Routes, Route, Navigate, BrowserRouter } from 'react-router'
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary'
import { ConfigProvider, App as AntdApp, Button, Flex, Typography, Space } from 'antd'
import { globalAntdConf, RoutePath, type RouteConf, inLayoutRoutes, outLayoutRoutes } from './configs'
import { Layout, RouteAuthGuarder } from './layout'
import './reset.css'

const { Title, Text } = Typography

function Wrapper({ children }: PropsWithChildren) {
  return (
    <ConfigProvider {...globalAntdConf}>
      <AntdApp message={{ maxCount: 1 }}>
        <ErrorBoundary fallbackRender={Fallback}>{children}</ErrorBoundary>
      </AntdApp>
    </ConfigProvider>
  )
}

const renderRoute = ({ path, component: Comp, auth }: RouteConf) => {
  let element = <Comp />
  if (auth) element = <RouteAuthGuarder>{element}</RouteAuthGuarder>
  return <Route key={path} path={path} element={element} />
}

export default function App() {
  return (
    <Wrapper>
      <BrowserRouter>
        <Routes>
          <Route path={RoutePath.Root} element={<Navigate replace to={RoutePath.Home} />} />
          {outLayoutRoutes.map(renderRoute)}
          <Route element={<Layout />}>{inLayoutRoutes.map(renderRoute)}</Route>
          <Route path={RoutePath.Other} element={<Navigate replace to={RoutePath.NotFound} />} />
        </Routes>
      </BrowserRouter>
    </Wrapper>
  )
}

function Fallback({ error }: FallbackProps) {
  // 根据换行分割，并去掉空格
  const stacks: string[] = error?.stack?.toString()?.split(/\s*\n\s*/m) ?? []

  const refresh = () => {
    window.location.reload()
  }

  return (
    <Flex style={{ margin: '0 auto', paddingTop: 80, width: 900 }} vertical align='start' gap={8}>
      <Title style={{ margin: 0 }} level={2}>
        Something went wrong!
      </Title>
      <Title style={{ margin: 0 }} level={4} type='danger'>
        {error.message}
      </Title>
      <Space direction='vertical' style={{ width: 900 }} align='start' size={0}>
        {stacks.length > 0 &&
          stacks.map((stack) => (
            <Text key={stack} type='danger'>
              {stack}
            </Text>
          ))}
      </Space>
      <Button type='primary' onClick={refresh}>
        Try Again!
      </Button>
    </Flex>
  )
}
