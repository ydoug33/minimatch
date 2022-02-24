// The actual behavior of the parser is mostly tested elsewhere.
// This test just is here to produce a massive amount of snapshots
// of every conceivable combination of options and weird patterns,
// so that we can detect the ramifications of any changes in the future.
const t = require('tap')
const {
  globToRegExp,
  toRegExp,
  parse,
  matchExt,
  parseExt,
  matchClass,
  parseClass,
} = require('../lib/parse.js')

const patterns = [
  // all the posix classes
  '[c[:alpha:]b]',
  '[c[:alnum:]b]',
  '[c[:lower:]b]',
  '[c[:upper:]b]',
  '[c[:blank:]b]',
  '[c[:space:]b]',
  '[c[:digit:]b]',
  '[c[:punct:]b]',
  '[c[:xdigit:]b]',
  '[c[:graph:]b]',
  '[c[:print:]b]',
  '[c[:cntrl:]b]',
  '[c[:ascii:]b]',
  '[c[:word:]b]',
  '[^c[:word:]b]',

  // not posix classes
  '[c[:xxx:]b]',
  '[c[:xxxx:]b]',
  '[c[:xxxxx:]b]',
  '[c[:xxxxxx:]b]',
  '[c[:xxxxxxx:]b]',
  '[^c[:xxxxxxx:]b]',
  '[!c[:xxxxxxx:]b]',

  '[^xyz]',

  '[]ax]',
  '[^]ax]',
  '[!]ax]',
  '[\\!]ax]',
  '[\\!\\]ax]',
  '[\\!\\\\]ax]',
  '[\\!\\\\\\]ax]',
  'class[that doesnt close',


  '*',
  '?',

  // nested extglobs
  '!(a|b|C)def!(x|z|)i+(j|k|l)m?(n|o|)',
  '!(x@(a|b|i!(c|*(star|?(huh|)a))j)y|)z',
  '*((*.py|*.js)|!(*.json))das*(*.js|!(*.json))',

  '!(x@(a|b|i!\\(c|d)j)y|)z',
  '!(x@(a|b|i\\!(c|d)j)y|)z',
  '!(x@(a|b|i\\!\\(c|d)j)y|)z',

  '!(unclosed|extglob',

  'end on \\',
  'end on \\\\',
  'end on \\\\\\',

  'x*',
  'x**',
  '*x',
  '**x',
  '**',
  '',
]

const options = [
  undefined,
  {},
  { dot: true },
  { noglobstar: true },
  { noext: true },
  { dot: true, noext: true },
  { dot: true, noglobstar: true },
  { noext: true, noglobstar: true },
  { dot: true, noext: true, noglobstar: true },
]


t.plan(patterns.length)
for (const pattern of patterns) {
  t.test(pattern, t => {
    t.plan(options.length)
    for (const o of options) {
      t.test(JSON.stringify(o), t => {
        const ast = parse(pattern, o)
        t.matchSnapshot(ast, 'ast')
        t.matchSnapshot(toRegExp(ast, o), 'regexp from ast')
        const re = globToRegExp(pattern, o)
        t.matchSnapshot(re, 'regexp src from glob')
        t.matchSnapshot(new RegExp(re), 'regexp obj from glob')
        t.end()
      })
    }
  })
}
