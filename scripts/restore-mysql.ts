import { readFile } from 'node:fs/promises'
import { gunzipSync } from 'node:zlib'
import { createConnection, type RowDataPacket } from 'mysql2/promise'

interface BackupTable {
  createSql: string
  rows: RowDataPacket[]
}

interface BackupPayload {
  format: string
  version: number
  database: string
  tables: Record<string, BackupTable>
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
  const backupFile = process.argv[2]
  const confirmed = process.argv.includes('--confirm')

  if (!backupFile || !confirmed) {
    throw new Error('用法：npm run mysql:restore -- <备份文件.json.gz> --confirm')
  }

  const backup = JSON.parse(
    gunzipSync(await readFile(backupFile)).toString('utf8'),
  ) as BackupPayload

  if (backup.format !== 'b2b-catalog-mysql-backup' || backup.version !== 1) {
    throw new Error('不支持的备份文件格式')
  }

  const database = safeName(requiredEnv('MYSQL_DATABASE'))
  const tableEntries = Object.entries(backup.tables)
    .map(([name, table]) => [safeName(name), table] as const)
  const connection = await createConnection({
    host: requiredEnv('MYSQL_HOST'),
    port: Number(process.env.MYSQL_PORT ?? 3306),
    user: requiredEnv('MYSQL_USER'),
    password: process.env.MYSQL_PASSWORD ?? '',
    database,
    charset: 'utf8mb4',
  })

  try {
    for (const [, table] of tableEntries) {
      await connection.query(
        table.createSql.replace(/^CREATE TABLE /i, 'CREATE TABLE IF NOT EXISTS '),
      )
    }

    await connection.beginTransaction()
    await connection.query('SET FOREIGN_KEY_CHECKS = 0')

    for (const [tableName] of [...tableEntries].reverse()) {
      await connection.query(`DELETE FROM \`${tableName}\``)
    }

    for (const [tableName, table] of tableEntries) {
      if (!table.rows.length) continue
      const columns = Object.keys(table.rows[0] ?? {}).map(safeName)
      const columnSql = columns.map(column => `\`${column}\``).join(', ')

      for (let offset = 0; offset < table.rows.length; offset += 200) {
        const rows = table.rows.slice(offset, offset + 200)
        const placeholders = rows
          .map(() => `(${columns.map(() => '?').join(', ')})`)
          .join(', ')
        const values = rows.flatMap(row => columns.map(column => row[column]))
        await connection.query(
          `INSERT INTO \`${tableName}\` (${columnSql}) VALUES ${placeholders}`,
          values,
        )
      }
    }

    await connection.query('SET FOREIGN_KEY_CHECKS = 1')
    await connection.commit()
    console.log(`恢复完成：${tableEntries.length} 张表已写入数据库 ${database}`)
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    await connection.end()
  }
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
