const { basename } = require('path')
module.exports = t => {
  switch (basename(t)) {
    case 'path.js': return ['lib/path.js']
    case 'parse.js': return ['lib/parse.js']
    default: return ['minimatch.js']
  }
}
