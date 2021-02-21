class List {
  static iterate(fn, x) {
    return new List(function* () {
      while (1) {
        yield x
        x = fn(x)
      }
    })
  }
  static repeat(x) {
    return new List(function* () {
      while (1) {
        yield x
      }
    })
  }
  static cycle(xs) {
    return new List(function* () {
      let i = 0
      while (1) {
        yield xs.get(i % xs.length())
        i++
      }
    })
  }
  static replicate(n, x) {
    return new List(Array(n).fill(x))
  }
  static fromList(xs) {
    return new List(xs)
  }

  constructor(list) {
    if (Array.isArray(list)) {
      this.list = list
    } else {
      this.g = list()
    }
  }
  head() {
    return this.get(0)
  }
  tail() {
    return this.slice(1)
  }
  init() {
    return this.slice(0, -1)
  }
  last() {
    return this.slice(-1).get(0)
  }
  length() {
    return this.list.length
  }
  toList() {
    if (this.list) {
      return this.list
    } else {
      const list = []
      while (1) {
        const o = this.g.next()
        if (o.done) break
        list[list.length] = o.value
      }
      return list
    }
  }
  get(i) {
    return this.list[i]
  }
  nil() {
    return !this.length()
  }
  take(n) {
    // FIXME: keep position or not?
    if (this.list) {
      return this.slice(0, n)
    }

    const g = this.g
    return new List(function* () {
      while (n--) {
        const o = g.next()
        if (o.done) {
          yield undefined
        } else {
          yield o.value
        }
      }
    })
  }
  drop(n) {
    return this.slice(n)
  }
  cons(x) {
    this.list.splice(0, 0, x)
    return this
  }
  append(xs) {
    this.list = this.list.concat(xs.toList())
    return this
  }
  slice(i, j) {
    return new List(this.list.slice(i, j))
  }
  map(fn) {
    return new List(this.list.map(fn))
  }
  filter(fn) {
    return new List(this.list.filter(fn))
  }
  reverse() {
    const list = this.list.map((x, i) => this.list[this.list.length - 1 - i])
    return new List(list)
  }
  concat() {
    return this.list.reduce((lst, item) => lst.append(item), List.empty)
  }
  concatMap(fn) {
    return this.list.reduce((lst, item) => lst.append(fn(item)), List.empty)
  }
  zipWith(fn, xs) {
    const list = this.list.map((x, i) => fn(x, xs.get(i)))
    return new List(list)
  }
  foldr(fn, x) {
    let r = x
    for (let i = this.list.length - 1; i >= 0; i--) {
      r = fn(this.list[i], r)
    }
    return r
  }
  foldl(fn, x) {
    return this.list.reduce((s, item) => fn(s, item), x)
  }
  scanr(fn, x) {
    let r = []
    r[this.list.length] = x
    for (let i = this.list.length - 1; i >= 0; i--) {
      r[i] = fn(this.list[i], r[i + 1])
    }
    return new List(r)
  }
  scanl(fn, x) {
    let r = []
    r[0] = x
    for (let i = 0; i < this.list.length; i++) {
      r[i + 1] = fn(r[i], this.list[i])
    }
    return new List(r)
  }
  elem(x) {
    return this.list.includes(x)
  }
  elemIndex(x) {
    return this.list.indexOf(x)
  }
  find(fn) {
    return this.get(this.findIndex(fn))
  }
  findIndex(fn) {
    for (let i = 0; i < this.list.length; i++) {
      if (fn(this.get(i))) {
        return i
      }
    }
    return -1
  }
  any(fn) {
    return this.list.some(fn)
  }
  all(fn) {
    return this.list.every(fn)
  }
  the() {
    if (this.length()) {
      const val = this.get(0)
      const same = this.all(x => x === val)
      if (same) return this.head()
    }
    return undefined
  }
}

Object.defineProperties(List, {
  empty: {
    get() {
      return new List([])
    }
  }
  // static PRIME
  // static FIB
  // static PI
})

// const Test = {
//   describe(msg, fn) {
//     fn()
//   },
//   it(msg, fn) {
//     fn()
//   },
//   assertDeepEquals(a, b) {
//     if (JSON.stringify(a) !== JSON.stringify(b)) {
//       throw new Error('failed to assert')
//     }
//   }
// }
