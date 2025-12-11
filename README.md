# webrtc-demo

## 子项目

- `apps/frontend`: 网页客户端
- `apps/backend`: 服务端

## websocket 鉴权

浏览器无法像其他 ws 客户端环境可以自定义 headers，鉴权可采取的方式有以下几种。

1. 在 url 中拼接查询参数传递鉴权信息.

```typescript
const token = 'your_token_here'
const socket = new WebSocket(`ws://example.com/socket?token=${token}`)
```

> 这种方式简单直接。

2. 在 ws 连接建立后，通过发送消息传递鉴权信息

```typescript
const token = 'your_token_here'
const socket = new WebSocket('ws://example.com/socket')
socket.onopen = () => {
  socket.send(JSON.stringify({ token }))
}
```

> 这种方式下，服务端无法在握手阶段拒绝请求，只能待连接建立后才能进行鉴权认证，这会增加服务器资源消耗和处理负担。

3. 将鉴权信息作为 websocket 子协议传递

```typescript
const token = 'your_token_here'
const socket = new WebSocket('ws://example.com/socket', [token])
```

> 浏览器可以在 ws 握手阶段时，通过设置 `Set-WebSocket-Protocol` headers 头发送鉴权信息。服务端接收后，检查 headers 是否包含子协议鉴权信息，如果包含则进行鉴权认证，否则拒绝连接。**一般情况下，不推荐这个方式发送敏感信息，比如鉴权信息。**

在实际应用中，子协议包括以下几个主要用途：

- 协商数据传递形式：服务端可以在连接建立后，选择自己支持的传输形式，比如 json 文本、protobuf 二进制数据等。

- 功能区分：同一条 ws 连接上，可以通过不同的子协议区分包涵不同的功能，比如 chat（聊天室）、signal（webrtc 信令）等。

> 对于大多数场景，默认采用 json 文本传输即可，不需要额外指定子协议。对于数据保密性或者传输效率要求较高的场景，可统一采用 protobuf 二进制数据传输，但需要额外实现相应的序列化和反序列化逻辑。新项目建议‌从 json 开始‌，当遇到性能瓶颈或特殊安全需求时，再考虑迁移到 protobuf。

综上，更常见的做法还是通过拼接 url 查询参数来进行鉴权认证。本项目也采用这种方式，具体流程如下：

1. xxx
2. xxx

## git commit

项目采用 conventional commits 规范。

- `feat`: 新功能（feature）
- `fix`: 修复错误（bug fix）
- `docs`: 文档更新
- `dx`: 开发体验改进
- `style`: 代码格式调整（不影响逻辑）
- `refactor`: 重构代码
- `perf`: 性能优化
- `test`: 测试相关
- `workflow`: 工作流相关
- `build`: 构建系统或外部依赖变更
- `ci`: 持续集成配置更改
- `chore`: 日常维护任务
- `types`: 类型定义文件修改
- `wip`: 正在进行中的工作（Work In Progress）
- `release`: 发布新版本

## TODO

- websocket 功能分离：将通话和信令功能分离，交由不同的 ws 连接处理。
- websocket 连接支持 protobuf 二进制数据的序列化和反序列化，需要兼容现有的 json 字符串传输。后续可由子协议 `protocols` 指定数据传输格式，默认采用 json 字符串。
- 尝试用 rxjs 重构事件驱动，现在项目整体采用事件驱动处理 websocket 消息。
- 尝试用 getRTCServers 的形式封装 call/call-answer, offer-answer websocket 消息。
- websocket 通用功能迁移到 ws 包。
- 通用函数和工具类迁移到 shared 包。
- webrtc 流程封装，业务封装，并迁移到 rtc 包。
- 错误日志上报？

## 参考

- [Support for custom headers for handshake](https://github.com/whatwg/websockets/issues/16)
- [how to add header authorization in websocket](https://apifox.com/apiskills/how-to-add-header-authorization-in-websocket/)
- [mdn WebSocket](https://developer.mozilla.org/zh-CN/docs/Web/API/WebSocket/WebSocket)
- [浏览器中WebSocket如何自定义请求头](https://juejin.cn/post/7405152755819233331)
