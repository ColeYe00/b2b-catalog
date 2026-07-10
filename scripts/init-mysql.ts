import { createConnection } from 'mysql2/promise'

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim()

  if (!value) {
    throw new Error(`缺少环境变量 ${name}`)
  }

  return value
}

function envPort(): number {
  const port = Number(process.env.MYSQL_PORT ?? 3306)

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error('MYSQL_PORT 必须是有效端口号')
  }

  return port
}

function databaseName(): string {
  const name = requiredEnv('MYSQL_DATABASE')

  if (!/^[a-zA-Z0-9_]+$/.test(name)) {
    throw new Error('MYSQL_DATABASE 只能包含字母、数字和下划线')
  }

  return name
}

async function main(): Promise<void> {
  const database = databaseName()
  const connection = await createConnection({
    host: requiredEnv('MYSQL_HOST'),
    port: envPort(),
    user: requiredEnv('MYSQL_USER'),
    password: process.env.MYSQL_PASSWORD ?? '',
    charset: 'utf8mb4',
  })

  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${database}\`
       CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    )
    await connection.query(`USE \`${database}\``)

    await connection.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        slug VARCHAR(120) NOT NULL,
        name_en VARCHAR(255) NOT NULL,
        name_cn VARCHAR(255) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uk_categories_slug (slug)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await connection.query(`
      CREATE TABLE IF NOT EXISTS products (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        sku VARCHAR(191) NOT NULL,
        name_en VARCHAR(255) NOT NULL,
        name_cn TEXT NULL,
        specs JSON NULL,
        price DECIMAL(12, 2) NULL,
        currency CHAR(3) NOT NULL DEFAULT 'CNY',
        moq INT UNSIGNED NOT NULL DEFAULT 1,
        category VARCHAR(120) NOT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'active',
        alibaba_url TEXT NULL,
        images JSON NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uk_products_sku (sku),
        KEY idx_products_category_status (category, status),
        KEY idx_products_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    console.log(`MySQL 数据库及数据表已就绪：${database}`)
  } finally {
    await connection.end()
  }
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
