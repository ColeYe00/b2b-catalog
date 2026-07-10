import { mkdir, writeFile } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'
import { createConnection, type RowDataPacket } from 'mysql2/promise'

interface TableRow extends RowDataPacket {
  tableName: string
}

interface CreateTableRow extends RowDataPacket {
  'Create Table': string
}

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`缺少环境变量 ${name}`)
  return value
}

function safeName(value: string): string {
  if (!/^[a-zA-Z0-9_]+$/.test(value)) {
    throw new Error(`不安全的数据库标识符：${value}`)
  }
  return value
}

async function main(): Promise<void> {
  const database = safeName(requiredEnv('MYSQL_DATABASE'))
  const connection = await createConnection({
    host: requiredEnv('MYSQL_HOST'),
    port: Number(process.env.MYSQL_PORT ?? 3306),
    user: requiredEnv('MYSQL_USER'),
    password: process.env.MYSQL_PASSWORD ?? '',
    database,
    charset: 'utf8mb4',
  })

  try {
    const [tableRows] = await connection.query<TableRow[]>(
      `SELECT TABLE_NAME AS tableName
         FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = ?
        ORDER BY TABLE_NAME`,
      [database],
    )
    const tables: Record<string, { createSql: string, rows: RowDataPacket[] }> = {}

    for (const { tableName: rawTableName } of tableRows) {
      const tableName = safeName(rawTableName)
      const [createRows] = await connection.query<CreateTableRow[]>(
        `SHOW CREATE TABLE \`${tableName}\``,
      )
      const [rows] = await connection.query<RowDataPacket[]>(
        `SELECT * FROM \`${tableName}\``,
      )

      tables[tableName] = {
        createSql: createRows[0]?.['Create Table'] ?? '',
        rows,
      }
    }

    const createdAt = new Date().toISOString()
    const stamp = createdAt.replace(/[:.]/g, '-')
    const outputDir = 'backups'
    const outputFile = `${outputDir}/${database}-${stamp}.json.gz`
    const payload = JSON.stringify({
      format: 'b2b-catalog-mysql-backup',
      version: 1,
      database,
      createdAt,
      tables,
    })

    await mkdir(outputDir, { recursive: true })
    await writeFile(outputFile, gzipSync(payload, { level: 9 }))

    const rowCount = Object.values(tables)
      .reduce((total, table) => total + table.rows.length, 0)
    console.log(`备份完成：${outputFile}（${Object.keys(tables).length} 张表，${rowCount} 行）`)
  } finally {
    await connection.end()
  }
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
