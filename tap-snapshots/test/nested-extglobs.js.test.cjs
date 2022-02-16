/* IMPORTANT
 * This snapshot file is auto-generated, but designed for humans.
 * It should be checked into source control and tracked carefully.
 * Re-generate by setting TAP_SNAPSHOT=1 and running tests.
 * Make sure to inspect the output below.  Do not ignore changes!
 */
'use strict'
exports[`test/nested-extglobs.js TAP !(!(a)|!(b))x!(c) > must match snapshot 1`] = `
Array []
`

exports[`test/nested-extglobs.js TAP !(!(a)|!(b))x@(c) > must match snapshot 1`] = `
Array []
`

exports[`test/nested-extglobs.js TAP !(!(a)|@(b))x!(c) > must match snapshot 1`] = `
Array [
  "axa",
  "axb",
]
`

exports[`test/nested-extglobs.js TAP !(!(a)|@(b))x@(c) > must match snapshot 1`] = `
Array [
  "axc",
]
`

exports[`test/nested-extglobs.js TAP !(@(a)|!(b))x!(c) > must match snapshot 1`] = `
Array []
`

exports[`test/nested-extglobs.js TAP !(@(a)|!(b))x@(c) > must match snapshot 1`] = `
Array []
`

exports[`test/nested-extglobs.js TAP !(@(a)|@(b))x!(c) > must match snapshot 1`] = `
Array [
  "cxa",
  "cxb",
]
`

exports[`test/nested-extglobs.js TAP !(@(a)|@(b))x@(c) > must match snapshot 1`] = `
Array [
  "cxc",
]
`

exports[`test/nested-extglobs.js TAP !(a)x!(!(b)|!(c)) > must match snapshot 1`] = `
Array []
`

exports[`test/nested-extglobs.js TAP !(a)x!(!(b)|@(c)) > must match snapshot 1`] = `
Array []
`

exports[`test/nested-extglobs.js TAP !(a)x!(@(b)|!(c)) > must match snapshot 1`] = `
Array [
  "bxc",
  "cxc",
]
`

exports[`test/nested-extglobs.js TAP !(a)x!(@(b)|@(c)) > must match snapshot 1`] = `
Array [
  "bxa",
  "cxa",
]
`

exports[`test/nested-extglobs.js TAP !(a)x@(!(b)|!(c)) > must match snapshot 1`] = `
Array []
`

exports[`test/nested-extglobs.js TAP !(a)x@(!(b)|@(c)) > must match snapshot 1`] = `
Array []
`

exports[`test/nested-extglobs.js TAP !(a)x@(@(b)|!(c)) > must match snapshot 1`] = `
Array [
  "bxa",
  "bxb",
  "cxa",
  "cxb",
]
`

exports[`test/nested-extglobs.js TAP !(a)x@(@(b)|@(c)) > must match snapshot 1`] = `
Array [
  "bxb",
  "bxc",
  "cxb",
  "cxc",
]
`

exports[`test/nested-extglobs.js TAP @(!(a)|!(b))x!(c) > must match snapshot 1`] = `
Array []
`

exports[`test/nested-extglobs.js TAP @(!(a)|!(b))x@(c) > must match snapshot 1`] = `
Array []
`

exports[`test/nested-extglobs.js TAP @(!(a)|@(b))x!(c) > must match snapshot 1`] = `
Array [
  "bxa",
  "bxb",
  "cxa",
  "cxb",
]
`

exports[`test/nested-extglobs.js TAP @(!(a)|@(b))x@(c) > must match snapshot 1`] = `
Array [
  "bxc",
  "cxc",
]
`

exports[`test/nested-extglobs.js TAP @(@(a)|!(b))x!(c) > must match snapshot 1`] = `
Array []
`

exports[`test/nested-extglobs.js TAP @(@(a)|!(b))x@(c) > must match snapshot 1`] = `
Array []
`

exports[`test/nested-extglobs.js TAP @(@(a)|@(b))x!(c) > must match snapshot 1`] = `
Array [
  "axa",
  "axb",
  "bxa",
  "bxb",
]
`

exports[`test/nested-extglobs.js TAP @(@(a)|@(b))x@(c) > must match snapshot 1`] = `
Array [
  "axc",
  "bxc",
]
`

exports[`test/nested-extglobs.js TAP @(a)x!(!(b)|!(c)) > must match snapshot 1`] = `
Array []
`

exports[`test/nested-extglobs.js TAP @(a)x!(!(b)|@(c)) > must match snapshot 1`] = `
Array []
`

exports[`test/nested-extglobs.js TAP @(a)x!(@(b)|!(c)) > must match snapshot 1`] = `
Array [
  "axc",
]
`

exports[`test/nested-extglobs.js TAP @(a)x!(@(b)|@(c)) > must match snapshot 1`] = `
Array [
  "axa",
]
`

exports[`test/nested-extglobs.js TAP @(a)x@(!(b)|!(c)) > must match snapshot 1`] = `
Array []
`

exports[`test/nested-extglobs.js TAP @(a)x@(!(b)|@(c)) > must match snapshot 1`] = `
Array []
`

exports[`test/nested-extglobs.js TAP @(a)x@(@(b)|!(c)) > must match snapshot 1`] = `
Array [
  "axa",
  "axb",
]
`

exports[`test/nested-extglobs.js TAP @(a)x@(@(b)|@(c)) > must match snapshot 1`] = `
Array [
  "axb",
  "axc",
]
`
