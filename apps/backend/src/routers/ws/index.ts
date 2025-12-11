import Router from '@koa/router'

const router = new Router({ prefix: '/ws' })
// router.use(jwt(), session())

// 获取 ws 连接临时 token
// GET /ws/token
router.get('/test', (ctx) => {
  ctx.body = `
    <script>
      const socket = new WebSocket('ws://localhost:3000/api/ws/.?token=123456')
      socket.onopen = () => {
        console.log('open')
      }
      socket.onmessage = (e) => {
        console.log('message', e.data)
      }
      socket.onclose = (e) => {
        console.log('close', e)
      }
      socket.onerror = (e) => {
        console.log('error', e)
      }
    </script>
  `
})

export default router
