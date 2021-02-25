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
    if (xs.infinite) return new List(xs)

    return new List(function* () {
      let g = xs.createGenerator()
      while (1) {
        let obj = g.next()
        if (obj.done) {
          g = xs.createGenerator()
          obj = g.next()
          if (obj.done) throw new Error('no `cycle` for empty list')
        }
        yield obj.value
      }
    })
  }
  static replicate(n, x) {
    return new List(Array(n).fill(x))
  }
  static fromList(xs) {
    return new List(xs)
  }

  createGenerator() {
    const list = this.list
    const gf = this.gf || function* () {
      yield* list
    }
    return gf()
  }

  constructor(list, infinite = true) {
    if (Array.isArray(list)) {
      this.list = list
      this.infinite = false
    } else if (list instanceof List) {
      this.list = list.list
      this.gf = list.gf
      this.infinite = list.infinite
    } else { // generator function
      this.gf = list
      this.infinite = infinite
    }
  }
  head() {
    return this.get(0)
  }
  tail() {
    return this.slice(1)
  }
  init() {
    if (this.infinite) return new List(this)

    return this.slice(0, -1)
  }
  last() {
    if (this.infinite) throw new Error('no `last` for infinite list')

    return this.slice(-1).get(0)
  }
  length() {
    if (this.infinite) throw new Error('no `length` for infinite list')

    if (this.gf) {
      const g = this.createGenerator()

      let i = 0
      while (!g.next().done) i++
      return i
    }
    return this.list.length
  }
  toList() {
    if (this.infinite) throw new Error('no `toList` for infinite list')

    if (this.gf) {
      const g = this.createGenerator()
      const list = []
      while (1) {
        const obj = g.next()
        if (obj.done) break
        list[list.length] = obj.value
      }
      return list
    }
    return this.list
  }
  get(i) {
    if (i < 0) return undefined

    if (this.gf) {
      const g = this.createGenerator()
      let obj = g.next()
      while (i--) {
        if (obj.done) return undefined
        obj = g.next()
      }
      return obj.value
    }
    return this.list[i]
  }
  nil() {
    return !this.length()
  }

  take(n) {
    if (n < 0) return List.empty
    // don't keep position
    if (this.list) {
      return new List(this.list.slice(0, n))
    }

    const g = this.createGenerator()
    return new List(function* () {
      let obj = g.next()
      while (n--) {
        if (obj.done) {
          break
        } else {
          yield obj.value
          obj = g.next()
        }
      }
    }, false)
  }
  drop(n) {
    if (n < 0) return new List(this)

    return this.slice(n)
  }
  cons(x) {
    if (this.gf) {
      const g = this.createGenerator()
      return new List(function *() {
        yield x
        yield* g
      }, this.infinite)
    }
    return new List([x].concat(this.list))
  }
  append(xs) {
    if (this.infinite) return new List(this)

    if (this.list && xs.list) {
      return new List(this.list.concat(xs.toList()))
    } else {
      const g = this.createGenerator()
      return new List(function *() {
        yield* g
        yield* xs.createGenerator()
      }, xs.infinite)
    }
  }
  slice(i, j) {
    if (this.gf) {
      if (typeof i === 'undefined') i = 0
      if (typeof j === 'undefined') j = Infinity
      if (i < 0 || j < 0) {
        const length = this.length()
        if (i < 0) i += length
        if (j < 0) j += length
      }

      const g = this.createGenerator()
      const list = []
      let index = 0
      while (index < j) {
        const obj = g.next()
        if (obj.done) break
        if (index >= i) list[list.length] = obj.value
        index++
      }
      return new List(list)
    }
    return new List(this.list.slice(i, j))
  }

  map(fn) {
    if (this.gf) {
      const g = this.createGenerator()
      return new List(function* () {
        while (1) {
          const obj = g.next()
          if (obj.done) break
          yield fn(obj.value)
        }
      }, this.infinite)
    }
    return new List(this.list.map(fn))
  }
  filter(fn) {
    if (this.gf) {
      const g = this.createGenerator()
      return new List(function* () {
        while (1) {
          const obj = g.next()
          if (obj.done) break
          if (fn(obj.value)) yield obj.value
        }
      }, this.infinite)
    }
    return new List(this.list.filter(fn))
  }
  reverse() {
    if (this.infinite) throw new Error('no `reverse` for infinite list')

    const list = this.toList()
    const reversed = list.map((x, i) => list[list.length - 1 - i])
    return new List(reversed)
  }
  concat() {
    const g = this.createGenerator()
    return new List(function* () {
      while (1) {
        const obj = g.next()
        if (obj.done) break
        yield* obj.value.createGenerator()
      }
    }, this.infinite || this.any(item => item.infinite))
  }
  concatMap(fn) {
    const g = this.createGenerator()
    return new List(function* () {
      while (1) {
        const obj = g.next()
        if (obj.done) break
        yield* fn(obj.value).createGenerator()
      }
    }, this.infinite || this.any(item => item.infinite))
  }
  zipWith(fn, xs) {
    const g = this.createGenerator()
    const g2 = xs.createGenerator()
    return new List(function* () {
      while (1) {
        const obj = g.next()
        const obj2 = g2.next()
        if (obj.done && obj2.done) break
        yield fn(obj.value, obj2.value)
      }
    }, this.infinite || xs.infinite)
  }
  foldr(fn, x) {
    if (this.gf) {
      // TODO: how can we know `fn` is nullary or unary?
      throw new Error('not implemented')
    }

    let r = x
    for (let i = this.list.length - 1; i >= 0; i--) {
      r = fn(this.list[i], r)
    }
    return r
  }
  foldl(fn, x) {
    if (this.infinite) throw new Error('no `foldl` for infinite list')

    if (this.gf) {
      const g = this.createGenerator()
      let ret = x
      while (1) {
        const obj = g.next()
        if (obj.done) break
        ret = fn(ret, obj.value)
      }
      return ret
    }
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
    const r = [x]
    const g = this.createGenerator()

    let prev = x
    while (1) {
      const obj = g.next()
      if (obj.done) break
      prev = fn(prev, obj.value)
      r.push(prev)
    }
    return new List(r)
  }
  elem(x) {
    if (this.infinite) throw new Error('no `elem` for infinite list')

    return this.any(item => item === x)
  }
  elemIndex(x) {
    if (this.infinite) throw new Error('no `elemIndex` for infinite list')

    const g = this.createGenerator()
    let i = 0
    while (1) {
      const obj = g.next()
      if (obj.done) break
      if (x === obj.value) return i
      i++
    }
    return -1
  }
  find(fn) {
    if (this.infinite) throw new Error('no `find` for infinite list')

    const g = this.createGenerator()
    while (1) {
      const obj = g.next()
      if (obj.done) break
      if (fn(obj.value)) return obj.value
    }
    return undefined
  }
  findIndex(fn) {
    if (this.infinite) throw new Error('no `findIndex` for infinite list')

    const g = this.createGenerator()
    let i = 0
    while (1) {
      const obj = g.next()
      if (obj.done) break
      if (fn(obj.value)) return i
      i++
    }
    return -1
  }
  any(fn) {
    if (this.infinite) throw new Error('no `any` for infinite list')

    const g = this.createGenerator()
    while (1) {
      const obj = g.next()
      if (obj.done) break
      if (fn(obj.value)) return true
    }
    return false
  }
  all(fn) {
    if (this.infinite) throw new Error('no `all` for infinite list')

    const g = this.createGenerator()
    while (1) {
      const obj = g.next()
      if (obj.done) break
      if (!fn(obj.value)) return false
    }
    return true
  }
  the() {
    if (this.infinite) throw new Error('no `the` for infinite list')

    const x = this.head()
    return this.all(item => item === x) ? x : undefined
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
