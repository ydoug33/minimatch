// parses a single path portion of a brace-expanded glob, into an AST
//
// TOKEN TYPES
//
// ['start'] start of the pattern (not included in . patterns)
// ['literal', c] the literal character c
// ['magic', c] c is ? or *
// ['globstar'] **
// ['ext', type, [...patterns]] type is one of +!?*@
// ['class', allowed, class]  [<class>] or [!<class>]
// ['end'] end of the pattern (not included in subparses)
//
// parse() returns an array of AST tokens
// toRegExp() turns an ast into a regexp
// globToRegExp() calls both of these

const extSet = new Set('!?*@+')

// not available on Safari and some other browsers
// causes makeRe to allow dots in some cases it shouldn't.
const hasLookBehind = (() => {
  try {
    new RegExp('(?<=^|/)')
    return true
  } catch (er) /* istanbul ignore next */ {
    return false
  }
})()

const qmark = '[^/]'
const star = qmark + '*?'
const twoStarNoDot = '(?:(?!(?:\\/|^)\\.).)*?'
const twoStarDot = '(?:(?!(?:\\/|^)(?:\\.{1,2})(?:$|\\/)).)*?'

const regExpEscape = s => s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
const regExpEscapeCls = s => s.replace(/[[\]{}()*+?.,\\^$|#\s]/g, '\\$&')

// NB: not covered by minimatch consumers, because we build up
// the match and regexp manually to handle globstars, but here
// for completeness.
const globToRegExp = (pattern, options = {}) =>
  toRegExp(parse(pattern, options), options)

const SUB = Symbol('sub')
const toRegExp = (ast, {
  noext = false,
  noglobstar = false,
  dot = false,
} = {}, tail = [], sub = null) => {
  const isSub = sub === SUB
  const stack = []

  for (let i = ast.length - 1; i >= 0; i--) {
    const token = ast[i]
    switch (token[0]) {
      case 'end':
        stack.unshift('(?=$|/)')
        continue

      case 'literal':
        stack.unshift(regExpEscape(token[1]))
        continue

      // NB: not covered by minimatch consumers, because we always handle
      // globstars specially, but here for completeness.
      case 'globstar':
        stack.unshift(dot ? twoStarDot : twoStarNoDot)
        continue

      case 'class':
        stack.unshift(`[${token[1] ? '' : '^'}${token[2]}]`)
        continue

      case 'magic': {
        switch (token[1]) {
          case '?':
            stack.unshift(qmark)
            continue
          case '*':
            stack.unshift(star)
            continue
          /* istanbul ignore next */ default: /* istanbul ignore next */ {
            throw new Error(`unknown magic char: ${token[1]}`)
          }
        }
      }

      case 'ext': {
        if (token[1] !== '!') {
          const p = token[2].map(ast =>
            toRegExp(ast, { dot, noext, noglobstar }, stack, SUB))
          switch (token[1]) {
            case '@': // (?:<parts>)
              stack.unshift(`(?:${p.join('|')})`)
              continue
            case '?': // (?:<parts>)?
              stack.unshift(`(?:${p.join('|')})?`)
              continue
            case '+': // (?:<parts>)+
              stack.unshift(`(?:${p.join('|')})+`)
              continue
            case '*': // (?:<parts>)*
              stack.unshift(`(?:${p.join('|')})*`)
              continue
          }
        } else {
          // (?:(?!(?:<parts>)<tail>)<consume>)
          const p = token[2].filter(p => p.length)
            .map(ast => toRegExp(ast, { dot, noext, noglobstar }, stack, SUB))
          // !(x|) must not be x or nothing, so has to be something
          // !(x) must not be x, but can be nothing
          const c = p.length === token[2].length ? '*' : '+'
          // append the parent tail to our current stack
          const t = stack.concat(tail).join('')
          stack.unshift(`(?:(?!(?:${p.join('|')})${t})[^/]${c}?)`)
          continue
        }
      }

      case 'start': {
        const notNothing = ast.length >= 3 ||
          ast.length === 2 && ast[1][0] !== 'end'
        if (notNothing) {
          stack.unshift('(?=[^/])')
        }

        // TODO: this isn't strictly necessary if the top parent pattern
        // starts with a literal.
        // Eg: "x+(*|.p)" will put the dot-nonmatch in the inner pattern,
        // resulting in /x(?:(?!(?<=^|/)\.)[^/]*?|\.p)+(?=$|/)/
        // But since there can never be a ^|/ following the x, it could
        // be simplified to /x(?:[^/]*?|\.p)+(?:$|\/)/
        // To do that, we'll have to know that the parent pattern already
        // has passed its start position.  But that's a bit challenging!
        // For example, in `@(|x)*`, the * MIGHT come after x or might not.
        //
        // If regexp look behind isn't available, then this will not always
        // be correct in the makeRe usage, because we can't anchor on what
        // came BEFORE the dot, and this anchor will come after the `/`.
        // However, in the normal mm.match() case, we test each path portion
        // individually, so the negative lookahead ^ will anchor it properly.
        //
        // This means that if it's *not* the first path portion, then the
        // returned whole regexp from `x/*` will match `x/.x` on systems
        // that do not have lookbehind.  If we always could know for certain
        // that the * is the first item in the path portion, we could use
        // (?!\.) there.  However, then we run into problems with patterns
        // like `x/@(|.x)*`, where the leading dot is buried.

        /* istanbul ignore next - always supported in test env */
        const a = hasLookBehind ? '(?<=^|/)' : '^'
        const patternStart = !dot ? `(?!${a}\\.)`
        // not (start or / followed by . or .. followed by / or end)
        : `(?!${a}\\.{1,2}(?:$|/))`
        stack.unshift(patternStart)
        continue
      }

      /* istanbul ignore next */ default: /* istanbul ignore next */ {
        throw new Error(`invalid token type: ${token[0]}`)
      }
    }
  }
  return stack.join('')
}

const addLiteral = (ast, c) => {
  if (ast.length > 0 && ast[ast.length-1][0] === 'literal') {
    ast[ast.length - 1][1] += c
  } else {
    ast.push(['literal', c])
  }
}

const parse = (pattern, {
  dot = false,
  noext = false,
  noglobstar = false,
} = {}, sub = null) => {
  const isSub = sub === SUB

  // ** is only globstar if supported, and the only thing in the path part
  // otherwise, it's the same as *
  // NB: not covered by minimatch consumers, because we always handle
  // globstars specially, but here for completeness.
  if (pattern === '**') {
    if (!noglobstar && !isSub) {
      return [['start'], ['globstar'], ['end']]
    }
    pattern = '*'
  }

  // an empty pattern is just empty
  if (pattern === '') {
    return isSub ? [] : [['start'], ['end']]
  }

  const ast = []

  // at this point, we know globstar is not possible
  const o = { dot, noext, noglobstar: true }

  let escaping = false
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern.charAt(i)
    if (escaping) {
      ast.push(['literal', c])
      escaping = false
      continue
    }
    if (c === '\\') {
      escaping = true
      continue
    }

    const extEnd = matchExt(pattern, c, i, o)
    if (extEnd !== false) {
      ast.push(parseExt(pattern.slice(i, extEnd + 1), o))
      i = extEnd
      continue
    }

    const classEnd = matchClass(pattern, c, i)
    if (classEnd !== false) {
      ast.push(parseClass(pattern.slice(i, classEnd), o))
      i = classEnd
      continue
    }

    // single-char glob magics
    if (c === '?' || c === '*') {
      ast.push(['magic', c])
      continue
    }

    // anything else is a literal
    addLiteral(ast, c)
  }

  // if we ended while escaping, we need to include that \ char as a literal
  if (escaping) {
    addLiteral(ast, '\\')
  }

  if (!isSub) {
    ast.push(['end'])
  }

  // if the first entry is a magic or class, then we have to prevent
  // a leading dot from matching.  Literals and exts don't have to be
  // protected, since they can't match . unless they start with it.
  // Eg, @(.p|x) is a valid pattern that will match .p, but *@(.p|x)
  // will not .p.  [.x]p will not match .p
  // TODO: this is unnecessary if a subparse where the parent either
  // already has a 'start' token or starts with a literal, but at this
  // point we don't know that, and the leading dot pattern is harmless,
  // just extra regexp characters to be optimized out someday.
  if (ast[0][0] === 'magic' || ast[0][0] === 'class') {
    ast.unshift(['start'])
  }
  return ast
}

// given a string with an extglob starting at i, find the matching )
// and return the index, or null if no match is found.
const matchExt = (pattern, c, i, { dot, noext, noglobstar }) => {
  const maybeExt = !noext &&
    extSet.has(c) &&
    i < pattern.length - 2 &&
    pattern.charAt(i + 1) === '('
  if (!maybeExt) {
    return false
  }

  let j = i + 2
  let level = 1
  let escaping = false
  for (; j < pattern.length; j++) {
    if (escaping) {
      escaping = false
      continue
    }

    const d = pattern.charAt(j)
    if (d === '\\') {
      escaping = true
      continue
    }

    const maybeSub = extSet.has(d) &&
      j < pattern.length - 2 &&
      pattern.charAt(j + 1) === '('
    if (maybeSub) {
      level += 1
      j += 1 // skip past the (
      continue
    }

    if (d === ')') {
      level -= 1
      if (level === 0) {
        return j
      }
    }
  }

  return false
}

const parseExt = (ext, { dot, noext, noglobstar }) => {
  // no globstars within extglobs
  const o = { dot, noext, noglobstar: true }
  let escaping = false
  const parts = []
  const ast = ['ext', ext.charAt(0), parts]
  // string is something like @(...)
  //  0: [@+?!*]
  //  1: (
  // -1: )
  let partStart = 2
  for (let i = 2; i < ext.length - 1; i++) {
    if (escaping) {
      escaping = false
      continue
    }

    const c = ext.charAt(i)
    if (c === '\\') {
      escaping = true
      continue
    }

    if (c === '|') {
      const part = ext.slice(partStart, i)
      parts.push(parse(part, o, SUB))
      partStart = i + 1
      continue
    }

    // check to see if it's a nested extglob
    const extEnd = matchExt(ext, c, i, o)
    if (extEnd !== false) {
      i = extEnd
      continue
    }
  }

  // get the last part
  parts.push(parse(ext.slice(partStart, -1), o, SUB))
  return ast
}

const punct = regExpEscape('"!#$%&\'()*+,-./:;<=>?@\\[]^_`{|}~')
const posixClasses = {
  '[:alpha:]': 'A-Za-z',
  '[:alnum:]': 'A-Za-z0-9',
  '[:lower:]': 'a-z',
  '[:upper:]': 'A-Z',
  '[:blank:]': ' \\t',
  '[:space:]': ' \\t\\n\\r\\f\\v',
  '[:digit:]': '0-9',
  '[:punct:]': punct,
  '[:xdigit:]': 'a-fA-F0-9',
  '[:graph:]': 'A-Za-z0-9' + punct,
  '[:print:]': ' A-Za-z0-9' + punct,
  '[:cntrl:]': '\\x00-\\x1f\\x7f',
  '[:ascii:]': '\\x01-\\x7f',
  '[:word:]': 'A-Za-z0-9_',
}

const matchClass = (pattern, c, i) => {
  const maybeClass = c === '[' &&
    i < pattern.length - 2 // [] isn't a valid class
  if (!maybeClass) {
    return false
  }

  let escaping = false
  const f = pattern.charAt(i + 1)
  const not = f === '!' || f === '^'
  const start = i + (not ? 2 : 1)
  OUTER: for (let end = start; end < pattern.length; end++) {
    if (escaping) {
      escaping = false
      continue
    }
    const d = pattern.charAt(end)
    if (d === '\\') {
      escaping = true
      continue
    }

    if (end < pattern.length - 8) {
      if (d === '[' && pattern.charAt(end + 1) === ':') {
        for (const s of [9, 8, 10]) {
          const c = pattern.slice(end, end + s)
          if (posixClasses[c]) {
            end += s - 1
            continue OUTER
          }
        }
      }
    }

    if (d !== ']' || end === start) {
      continue
    }
    return end
  }
  return false
}

// From `man bash`:
//
// Matches any one of the  enclosed  characters.   A  pair  of
// characters  separated  by  a hyphen denotes a range expres-
// sion; any character that sorts between  those  two  charac-
// ters,  inclusive,  using  the  current  locale's  collating
// sequence and character set, is matched.  If the first char-
// acter following the [ is a !  or a ^ then any character not
// enclosed is matched.  The sorting order  of  characters  in
// range  expressions  is determined by the current locale and
// the value of the LC_COLLATE shell variable, if  set.   A  -
// may be matched by including it as the first or last charac-
// ter in the set.  A ] may be matched by including it as  the
// first character in the set.
//
// Within  [  and  ], character classes can be specified using
// the syntax [:class:], where class is one of  the  following
// classes defined in the POSIX standard:
// alnum alpha ascii blank cntrl digit graph lower print punct
// space upper word xdigit
// A character class matches any character belonging  to  that
// class.   The  word character class matches letters, digits,
// and the character _.
//
// Within [ and ], an equivalence class can be specified using
// the  syntax  [=c=],  which  matches all characters with the
// same collation weight (as defined by the current locale) as
// the character c.
//
// Within [ and ], the syntax [.symbol.] matches the collating
// symbol symbol.

// Collation symbols and collation equivalence is not supported
// Character classes are, but not locale-aware.
const parseClass = cls => {
  const f = cls.charAt(1)
  const not = f === '!' || f === '^'
  let body = ''
  let escaping = false
  OUTER: for (let i = not ? 2 : 1; i < cls.length; i++) {
    const c = cls.charAt(i)
    if (escaping || c === ']' || c === '^') {
      body += regExpEscapeCls(c)
      escaping = false
      continue
    }
    if (c === '\\') {
      escaping = true
      continue
    }
    if (c === '[' && cls.charAt(i + 1) === ':' && i < cls.length - 8) {
      // most of them are 9 chars
      for (const s of [9, 8, 10]) {
        const c = cls.slice(i, i + s)
        if (posixClasses[c]) {
          body += posixClasses[c]
          i += s - 1
          continue OUTER
        }
      }
    }
    body += regExpEscapeCls(c)
  }
  return ['class', !not, body]
}

module.exports = {
  globToRegExp,
  toRegExp,
  parse,
  matchExt,
  parseExt,
  matchClass,
  parseClass,
}
