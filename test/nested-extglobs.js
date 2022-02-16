// https://github.com/isaacs/minimatch/issues/71

// these patterns all have the following form:
// _(_(a)|_(b))x_(c)
// the second set are:
// _(a)x_(_(b)|_(c))
// where the four in each group _ are swapped with both ! and @
// then we test against each combination of {a,b,c}x{a,b,c}

const mm = require('../')
const t = require('tap')

const patterns = []
for (const ab of ['!', '@']) {
  for (const a of ['!', '@']) {
    for (const b of ['!', '@']) {
      for (const c of ['!', '@']) {
        patterns.push(`${ab}(${a}(a)|${b}(b))x${c}(c)`)
      }
    }
  }
}
for (const a of ['!', '@']) {
  for (const bc of ['!', '@']) {
    for (const b of ['!', '@']) {
      for (const c of ['!', '@']) {
        patterns.push(`${a}(a)x${bc}(${b}(b)|${c}(c))`)
      }
    }
  }
}
const files = []
for (const first of ['a', 'b', 'c']) {
  for (const last of ['a', 'b', 'c']) {
    files.push(`${first}x${last}`)
  }
}
for (const p of patterns) {
  t.test(p, t => {
    const m = new mm.Minimatch(p, { nonegate: true })
    t.notMatch(m.set, [[/$./]], 'should be valid: ' + p)
    t.matchSnapshot(files.filter(f => m.match(f)))
    t.end()
  })
}
