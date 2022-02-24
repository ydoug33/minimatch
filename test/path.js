const t = require('tap')
const proc = global.process

t.test('win32', t => {
  global.process = { ...process, platform: 'win32' }
  const p = t.mock('../lib/path.js')
  global.process = proc
  t.strictSame(p, { sep: '\\' })
  t.end()
})

t.test('no process obj', t => {
  global.process = null
  const p = t.mock('../lib/path.js')
  global.process = proc
  t.strictSame(p, { sep: '/' })
  t.end()
})

t.test('not windows', t => {
  global.process = { ...process, platform: 'posix' }
  const p = t.mock('../lib/path.js')
  global.process = proc
  t.strictSame(p, { sep: '/' })
  t.end()
})
