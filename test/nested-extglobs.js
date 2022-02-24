// https://github.com/isaacs/minimatch/issues/71

// these patterns all have the following form:
// _(_(a)|_(b))x_(c)
// the second set are:
// _(a)x_(_(b)|_(c))
// where the four in each group _ are swapped with both ! and @
// then we test against each combination of {a,b,c}x{a,b,c}

const mm = require('../')
const t = require('tap')

const files = []
for (const first of ['a', 'b', 'c', 'd']) {
  for (const last of ['a', 'b', 'c', 'd']) {
    files.push(`${first}x${last}`)
  }
}

const patterns = {}
for (const ab of ['@', '!']) {
  for (const a of ['@', '!']) {
    for (const b of ['@', '!']) {
      for (const c of ['@', '!']) {
        const pattern = `${ab}(${a}(a)|${b}(b))x${c}(c)`
        patterns[pattern] = files.filter(file => {
          const f = file.slice(0, 1)
          const l = file.slice(-1)
          const ap = a === '!' ? f !== 'a' : f === 'a'
          const bp = b === '!' ? f !== 'b' : f === 'b'
          const abp = ab === '!' ? (!ap && !bp) : (ap || bp)
          const cp = c === '!' ? l !== 'c' : l === 'c'
          return abp && cp
        })
      }
    }
  }
}

for (const a of ['@', '!']) {
  for (const bc of ['@', '!']) {
    for (const b of ['@', '!']) {
      for (const c of ['@', '!']) {
        const pattern = `${a}(a)x${bc}(${b}(b)|${c}(c))`
        patterns[pattern] = files.filter(file => {
          const f = file.slice(0, 1)
          const l = file.slice(-1)
          const ap = a === '!' ? f !== 'a' : f === 'a'
          const bp = b === '!' ? l !== 'b' : l === 'b'
          const cp = c === '!' ? l !== 'c' : l === 'c'
          const bcp = bc === '!' ? (!bp && !cp) : (bp || cp)
          return ap && bcp
        })
      }
    }
  }
}

for (const [p, expect] of Object.entries(patterns)) {
  t.test(p, t => {
    const m = new mm.Minimatch(p, { nonegate: true })
    if (t.notMatch(m.set, [[/$./]], `valid ${p}`)) {
      const actual = files.filter(f => m.match(f))
      t.same(actual, expect, `results ${p}`)
    }
    t.end()
  })
}
