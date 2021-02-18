function elderAge(m, n, l, t) {
  if (m === 0 || n === 0) return 0
  if (m < n) return elderAge(n, m, l, t)
  if (m < 4 || n < 4) return simple(n, m, l, t)

  const p1 = findPower(m)
  const p2 = findPower(n)
  if (p1 > p2) {
    const r1 = special(p1, n, l, t)
    const r2 = sub(p1, m - p1, n, l, t)
    return add(t, r1, r2)
  }

  // p1 === p2
  const r1 = special(p1, p2, l, t)
  const r2 = sub(p2, p1, n - p2, l, t)
  const r3 = sub(p1, m - p1, p2, l, t)
  const r4 = sub(p1 ^ p2, m - p1, n - p2, l, t)
  return add(t, r1, r2, r3, r4)
}
function sub(base, m, n, l, t) {
  if (base >= l) {
    base -= l
    l = 0
  } else {
    l -= base
    base = 0
  }
  return add(t,
    mul(t, m, n, base),
    elderAge(m, n, l, t)
  )
}
function simple(m, n, l, t) {
  let res = 0
  for (let r = 0; r < m; r++) {
    for (let c = 0; c < n; c++) {
      const val = r ^ c
      res += val >= l ? val - l : 0
      if (res >= t) res %= t
    }
  }
  return res
}
function findPower(n) {
  let p = 4
  while (p * 2 <= n) p *= 2
  return p
}

// requires m >= n, and m (>=4) is pow of 2
function special(m, n, l, t) {
  // 0 ~ m-1, x n
  // 0 ~ m - 1 - l, x n
  if (m - 1 <= l) return 0

  // (m - 1 - l) * (m - l) * n / 2
  if ((m - l) & 1) {
    return mul(t, (m - 1 - l) / 2, m - l, n)
  } else {
    return mul(t, m - 1 - l, (m - l) / 2, n)
  }
}
function mul(t, ...args) {
  return args.reduce((s, x) => safeMul(s, x, t), 1)
}
function add(t, ...args) {
  return args.reduce((s, x) => (s + x) % t, 0)
}

// https://github.com/chinesedfan/adventofcode/blob/master/lib/2019/day22.js
function ones(n) {
    const ret = [];
    while (n) {
        ret.unshift(n & 1);
        n -= (n & 1);
        n /= 2;
    }
    return ret;
}
function safeMul(a, b, n) {
    // a * b mod n
    const os = ones(b < 0 ? b + n : b);

    let r = 0;
    for (let i = 0; i < os.length; i++) {
        if (os[i] & 1) {
            r = (r + r + a) % n;
        } else {
            r = (r + r) % n;
        }
    }
    return r;
}
