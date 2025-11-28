# Frontend

webrtc-demo 前端项目。

## 使用

### 安装

```shell
pnpm install
```

### 本地开发

```shell
cp apps/frontend/.env.example apps/frontend/.env.local
pnpm --filter frontend dev
```

### 构建

```shell
pnpm --filter frontend build
```

## 实现功能

- 登录注册功能
- 主页展示用户信息
- WebRTC 视频通话功能（TODO）

## 路由配置

项目包含以下路由：

- `/login` - 登录页面
- `/register` - 注册页面
- `/home` - 主页（需认证）
- `/connect` - WebRTC连接页面（需认证）
- `/404` - 404页面

未匹配的路由自动重定向到 404 页面。未认证的路由自动重定向到登录页面。

## 项目结构

- `assets`: 存放所有静态资源文件。
- `components`: 存放通用的、可复用的 UI 组件。这些组件通常不包含业务逻辑，可以在项目的任何地方使用。
- `configs`: 存放应用的全局配置常量和设置。
- `utils`: 存放通用的、与业务逻辑无关的工具函数和基类。理想情况下，这里的内容是纯函数或抽象实现。
- `services`: 存放负责与外部服务通信的核心逻辑。这里负责配置网络请求（如 Axios 实例、WebSocket 连接），是数据获取的执行层。
- `stores`: 存放所有应用状态管理相关的代码（使用 Redux、Zustand、Context API 等）。
- `hooks`: 存放自定义 React Hooks，用于封装通用视图逻辑。
- `pages`: 存放应用中的页面级组件。这些组件通常较大，包含特定页面的布局和逻辑。

## 鉴权认证

该项目使用 jwt token 进行用户认证和授权。用户在登录后，服务端会返回一个 jwt token，前端将其存储在 localStorage 里面。对于 http 请求，前端会自动在请求头字段 `Authorization` 中携带 token，而对于 WebSocket 连接，则拼接在查询参数上传递。以下是例子：

```shell
# GET /api/user/profile
curl -s -X GET http://localhost:3000/api/user/profile -H "Content-Type: application/json" -H "Authorization: Bearer <token>"

# connect to websocket
ws -s ws://localhost:3000/api/ws/connect?token=<token>
```

## 环境变量

vite 根据运行模式（mode）使用 dotenv 自动加载环境变量文件，包括本地环境变量文件。mode 在开发时默认是 `development`，构建时为 `production`，可以在命令行启动通过 mode 参数指定。以下是加载顺序，同名变量后者覆盖前者。

1. `.env` - 默认环境变量文件
2. `.env.local` - 本地环境变量文件（除 test 外的所有情况都会加载）
3. `.env.[mode]` - 特定模式下的环境变量文件（如 `.env.development` 或 `.env.production`）
4. `.env.[mode].local` - 特定模式下的本地环境变量文件（如 `.env.development.local`）

**项目中环境变量集中管理在 `src/configs/env.ts` 文件中。如果需要 ts 智能提示，则需要在 `src/vite-env.d.ts` 文件中自己声明 `ImportMetaEnv` 类型。**

**项目中可以通过 `import.meta.env` 直接访问环境变量，而在 vite 配置文件（如 `vite.config.ts`）中则必须调用 `loadEnv` 函数才能读取。**

以下是项目中使用的环境变量：

- `VITE_APP_API_TARGET` - 开发服务器接口转发地址，默认值为 `http://localhost:3000`。
- `VITE_APP_API_PREFIX` - 接口前缀，只有接口以该前缀开头时才会被开发服务器转发到 `VITE_APP_API_TARGET`，默认值为 `/api`。
- `VITE_APP_WS_ENDPOINT` - WebSocket 基础 URL，默认值为 `ws://localhost:3000/api/ws/connect`。

**注意：所有环境变量都必须以 `VITE_` 为前缀，才能在项目中使用。**

## websocket 封装实现

项目对 websocket 连接进行了封装，封装在 `src/services/websocket-client.ts` 文件中。该封装类 `WebSocketClient` 提供了以下功能：

1. **自动重连机制**：当连接断开时，会自动尝试重新连接，默认最多重试 3 次。
2. **心跳检测**：定期发送心跳包以维持连接活跃状态。
3. **消息缓存**：在网络不稳定时缓存消息，待连接恢复后重新发送。

## 参考

- [Vite 环境变量文档](https://cn.vite.dev/guide/env-and-mode#env-files)
