const t = require('tap')
t.test('test that it works without a process object', t => {
  // wait just a sec so nyc has time to transform the file
  // and doesn't get upset that there's no process.platform
  const proc = process
  global.process = null
  const mm = t.mock('../minimatch.js')
  global.process = proc
  t.equal(mm.sep, '/')
  t.end()
})
