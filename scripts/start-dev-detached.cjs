const fs = require('node:fs')
const { spawn } = require('node:child_process')
const path = require('node:path')

const rootDir = path.resolve(__dirname, '..')
const stdout = fs.openSync(path.join(rootDir, '.nuxt-dev.out.log'), 'w')
const stderr = fs.openSync(path.join(rootDir, '.nuxt-dev.err.log'), 'w')

const child = spawn(
  'D:\\Program Files\\nodejs\\node.exe',
  ['node_modules\\nuxt\\bin\\nuxt.mjs', 'dev', '--host', '0.0.0.0'],
  {
    cwd: rootDir,
    detached: true,
    stdio: ['ignore', stdout, stderr],
    windowsHide: true,
  },
)

child.unref()
console.log(child.pid)
