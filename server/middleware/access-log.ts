import { randomUUID } from 'node:crypto'

export default defineEventHandler(event => {
  const startedAt = performance.now()
  const requestId = getHeader(event, 'x-request-id')?.slice(0, 100) || randomUUID()
  const method = event.method
  const path = getRequestURL(event).pathname

  if (!path.startsWith('/api/')) return

  event.context.requestId = requestId
  setResponseHeader(event, 'X-Request-Id', requestId)

  event.node.res.once('finish', () => {
    console.info(JSON.stringify({
      type: 'http_request',
      requestId,
      method,
      path,
      status: event.node.res.statusCode,
      durationMs: Math.round((performance.now() - startedAt) * 100) / 100,
      timestamp: new Date().toISOString(),
    }))
  })
})
