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
