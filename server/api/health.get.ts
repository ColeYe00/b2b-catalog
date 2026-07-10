import type { RowDataPacket } from 'mysql2'

interface HealthRow extends RowDataPacket {
  ok: number
}

export default defineEventHandler(async event => {
  setResponseHeader(event, 'Cache-Control', 'no-store')
  const startedAt = performance.now()

  try {
    const [rows] = await queryMysql<HealthRow[]>(
      'health.database',
      'SELECT 1 AS ok',
    )

    if (rows[0]?.ok !== 1) throw new Error('Unexpected database response')

    return {
      status: 'ok',
      database: 'connected',
      databaseLatencyMs: Math.round((performance.now() - startedAt) * 100) / 100,
      timestamp: new Date().toISOString(),
    }
  } catch {
    setResponseStatus(event, 503)
    return {
      status: 'unavailable',
      database: 'disconnected',
      timestamp: new Date().toISOString(),
    }
  }
})
