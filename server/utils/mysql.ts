import mysql from 'mysql2/promise'

let pool: mysql.Pool | undefined

export function useMysqlPool(): mysql.Pool {
  if (pool) return pool

  const config = useRuntimeConfig()
  if (!config.mysqlDatabase || !config.mysqlUser) {
    throw createError({
      statusCode: 503,
      statusMessage: 'MySQL is not configured',
    })
  }

  pool = mysql.createPool({
    host: config.mysqlHost,
    port: config.mysqlPort,
    database: config.mysqlDatabase,
    user: config.mysqlUser,
    password: config.mysqlPassword,
    waitForConnections: true,
    connectionLimit: 10,
    charset: 'utf8mb4',
  })

  return pool
}

export async function closeMysqlPool(): Promise<void> {
  if (!pool) return

  const activePool = pool
  pool = undefined
  await activePool.end()
}

export async function queryMysql<T extends mysql.QueryResult>(
  operation: string,
  sql: string,
  values: unknown[] = [],
): Promise<[T, mysql.FieldPacket[]]> {
  const startedAt = performance.now()

  try {
    return await useMysqlPool().query<T>(sql, values)
  } finally {
    const durationMs = Math.round((performance.now() - startedAt) * 100) / 100
    const thresholdMs = Number(useRuntimeConfig().mysqlSlowQueryMs) || 200

    if (durationMs >= thresholdMs) {
      console.warn(JSON.stringify({
        type: 'mysql_slow_query',
        operation,
        durationMs,
        thresholdMs,
        timestamp: new Date().toISOString(),
      }))
    }
  }
}
