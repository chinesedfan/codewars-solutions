const atomInfo = {
 H: [1, 1],
 B: [3, 10.8],
 C: [4, 12],
 N: [3, 14],
 O: [2, 16],
 F: [1, 19],
 Mg: [2, 24.3],
 P: [3, 31],
 S: [2, 32.1],
 Cl: [1, 35.5],
 Br: [1, 80]
}

class InvalidBond extends Error {}
class LockedMolecule extends Error {}
class UnlockedMolecule extends Error {}
class EmptyMolecule extends Error {}

class Atom {
  constructor(elt, id_) {
    this.element = elt
    this.id = id_
    this.bonded = []
  }
  bond(other) {
    if (this === other || this.bonded.length >= atomInfo[this.element][0]
        || other.bonded.length >= atomInfo[other.element][0]) {
      throw new InvalidBond
    }
    this.bonded.push(other)
    other.bonded.push(this)
  }
  toString() {
    var sorted = this.bonded.slice().sort((a, b) => {
      if (a.element === b.element) {
        return a.id - b.id
      } else {
        if (a.element === 'H') return 1
        if (b.element === 'H') return -1
        // lower is "bigger" than upper
        var aelt = 'CO'.indexOf(a.element) < 0 ? a.element.toLowerCase() : a.element
        var belt = 'CO'.indexOf(b.element) < 0 ? b.element.toLowerCase() : b.element
        return aelt < belt ? -1 : 1
      }
    })
    var bondedStr = sorted.map(at => {
      return at.element === 'H' ? at.element : at.element + at.id
    }).join(',')
    return `Atom(${this.element}.${this.id}: ${bondedStr})`
  }
}

class Molecule {
  get formula() {
    if (!this.locked) throw new UnlockedMolecule

    var count = {}
    this.atoms.forEach(at => {
      count[at.element] = (count[at.element] || 0) + 1
    })

    var {C, H, O, ...others} = count
    var keys = Object.keys(others).sort((a, b) => a < b ? -1 : 1)
    keys = ['C', 'H', 'O'].concat(keys)

    var ps = []
    for (var elt of keys) {
      if (count[elt]) ps.push(count[elt] === 1 ? elt : elt + count[elt])
    }
    return ps.join('')
  }
  get molecularWeight() {
    if (!this.locked) throw new UnlockedMolecule

    var sum = 0
    this.atoms.forEach(at => {
      sum += atomInfo[at.element][1]
    })
    return sum
  }
  
  constructor(name) {
    this.atoms = []
    this.name = name || ''

    this.branches = []

    this.locked = false
    this.lockedLength = -1
  }
  brancher(...branches) {
    if (this.locked) throw new LockedMolecule

    branches.forEach(b => {
      var cs = []
      for (var i = 0; i < b; i++) {
        cs[i] = this.newAt('C')
        if (i) cs[i - 1].bond(cs[i])
      }
      this.branches.push(cs)
    })
    return this
  }
  bounder(...bonds) {
    if (this.locked) throw new LockedMolecule

    bonds.forEach(([c1, b1, c2, b2]) => {
      c1--; b1--; c2--; b2--;
      this.branches[b1][c1].bond(this.branches[b2][c2])
    })
    return this
  }
  mutate(...ms) {
    if (this.locked) throw new LockedMolecule
    
    ms.forEach(([nc, nb, elt]) => {
      nc--; nb--;
      if (atomInfo[elt][0] < this.branches[nb][nc].bonded.length) throw new InvalidBond
      this.branches[nb][nc].element = elt
    })
    return this
  }
  add(...ms) {
    if (this.locked) throw new LockedMolecule
    
    ms.forEach(([nc, nb, elt]) => {
      nb--; nc--;
      this.branches[nb][nc].bond(this.newAt(elt))
    })
    return this
  }
  addChaining(nc, nb, ...es) {
    if (this.locked) throw new LockedMolecule
    
    nb--; nc--;
    var c = this.branches[nb][nc]
    var bonded = c.bonded.length
    var lockedLength = this.atoms.length
    try {
      var p = c
      es.forEach(elt => {
        var at = this.newAt(elt)
        p.bond(at)
        p = at
      })
    } catch (e) {
      c.bonded = c.bonded.slice(0, bonded)
      this.atoms = this.atoms.slice(0, lockedLength)
    }
    return this
  }
  closer() {
    if (this.locked) throw new LockedMolecule
  
    this.locked = true
    this.lockedLength = this.atoms.length

    this.atoms.forEach(at => {
      var val = atomInfo[at.element][0]
      while (val > at.bonded.length) {
        at.bond(this.newAt('H'))
      }
    })
    return this
  }
  unlock() {
    this.locked = false

    this.atoms = this.atoms.slice(0, this.lockedLength)
    this.atoms = this.atoms.filter(at => {
      at.bonded = at.bonded.filter(at => at.element !== 'H')
      return at.bonded.length
    })

    this.branches = this.branches
      .map(b => b.filter(at => at.element !== 'H'))
      .filter(b => b.length)
    if (!this.branches.length) throw new EmptyMolecule

    this.atoms = this.atoms.filter(at => at.element !== 'H')
    this.atoms.forEach((at, i) => at.id = i + 1)
    return this
  }

  newAt(elt) {
    var at = new Atom(elt, this.atoms.length + 1)
    this.atoms.push(at)
    return at
  }
}
