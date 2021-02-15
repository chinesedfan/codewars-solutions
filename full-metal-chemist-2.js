// Number:        1      2      3...
const RADICALS    = ['meth', 'eth', 'prop', 'but',   'pent',  'hex',  'hept',  'oct',  'non',  'dec',  'undec',  'dodec',  'tridec',  'tetradec',  'pentadec',  'hexadec',  'heptadec',  'octadec',  'nonadec']
const MULTIPLIERS = [        'di',  'tri',  'tetra', 'penta', 'hexa', 'hepta', 'octa', 'nona', 'deca', 'undeca', 'dodeca', 'trideca', 'tetradeca', 'pentadeca', 'hexadeca', 'heptadeca', 'octadeca', 'nonadeca']

const SUFFIXES    = [         'ol',      'al', 'one', 'oic acid', 'carboxylic acid',                'oate',               'ether', 'amide', 'amine', 'imine', 'benzene', 'thiol',    'phosphine', 'arsine']
const PREFIXES    = ['hydroxy',       'oxo',             'carboxy',         'oxycarbonyl', 'oyloxy', 'formyl', 'oxy',   'amido', 'amino', 'imino', 'phenyl',  'mercapto', 'phosphino', 'arsino', 'fluoro', 'chloro', 'bromo', 'iodo']

const PREFIX2ELT = {
    fluoro: 'F',
    chloro: 'Cl',
    bromo: 'Br',
    iodo: 'I',
    hydroxy: 'O',
    mercapto: 'S',
    amino: 'N',
    phosphino: 'P',
    arsino: 'As',
}
const SUFFIX2ELT = {
    ol: 'O',
    thiol: 'S',
    amine: 'N',
    phosphine: 'P',
    arsine: 'As',
}

// Note that alkanes, alkenes alkynes, and akyles aren't present in these lists

const { reg, rAlk } = buildRegExps()
function parse(name) {
    // Parse the name given as argument in the constructor and output the dict representing the raw formula
    const molecule = new Molecule(name)
    try {
        handle(molecule, name)
    } catch (e) {
        console.log(name)
        throw e
    }
    molecule.closer()
    return molecule.atoms.reduce((obj, atom) => {
        obj[atom.element] = (obj[atom.element] || 0) + 1
        return obj
    }, {})
}
function handle(molecule, str, fakeEnd) {
    if (fakeEnd) {
        if (/(an|en|yn)$/.test(str)) {
            str += 'e'
        } else {
            str += 'ane'
        }
    }
    const [
        _,
        before, cycloRadical, after, end,
        before2, suffix,
        alk1,
        alk3, alk4,
        ramifications
    ] = reg.exec(str)
    if (cycloRadical) {
        const branch = handleAlk(molecule, cycloRadical, after)

        if (before) {
            handleRamifications(molecule, branch, before)
        }
        handleEnd(molecule, branch, end)
        return branch
    } else if (suffix) {
        // special amine, phosphine, arsine
        const branch = createBranch(molecule, 1)
        molecule.mutate([1, branch, SUFFIX2ELT[suffix]])

        if (before2) {
            handleRamifications(molecule, branch, before2)
        }
        return branch
    } else if (alk1) {
        // ether, R1-O-R2
        let sameAlk
        let alkPart1, alkPart2
        if (/^di/.test(alk1)) {
            sameAlk = alk1.slice(2) // omit 'di'
            if (sameAlk[0] === '[') {
                const tagEndIndex = sameAlk.lastIndexOf(']')
                sameAlk = sameAlk.slice(1, tagEndIndex) + sameAlk.slice(tagEndIndex + 1)
            }
        } else {
            const index = findFirstYl(alk1)
            alkPart1 = alk1.slice(0, index)
            alkPart2 = alk1.slice(index + 2) // 'yl'
        }
        const b1 = handle(molecule, alkPart1 || sameAlk, true) // add a fake end
        const b2 = handle(molecule, alkPart2 || sameAlk, true)
        const b3 = createBranch(molecule, 1)
        molecule.mutate([1, b3, 'O'])
        molecule.bounder([1, b1, 1, b3], [1, b2, 1, b3])
        return b1
    } else if (alk3) {
        // ester, ...(C)O-O-R
        let mainAlk = alk4
        let positions = [1]
        if (alk4.endsWith('di')) {
            const tokens = alk4.split('-')
            if (tokens.length === 1) {
                mainAlk = alk4.slice(0, -2) // omit 'di'
                positions = [] // fill later
            } else if (tokens.length >= 3) {
                // butyl ethan-1,2-dioate
                mainAlk = tokens.slice(0, -2).join('-')
                positions = tokens[tokens.length - 2].split(',').map(Number)
            } else {
                throw new Error('bad tokens: ' + alk4)
            }
        } else if (alk4.endsWith('-')) {
            // propan-1-oate
            mainAlk = alk4.slice(0, -3) // omit '-1-'
        }

        const mainBranch = handle(molecule, mainAlk, true)
        const lastMainPos = molecule.branches[mainBranch - 1].length
        if (!positions.length) {
            positions = [1, lastMainPos]
        }
        positions.forEach(p => {
            const auxBranch = handle(molecule, alk3, true)
            const oBranch = createBranch(molecule, 1)
            molecule.mutate([1, oBranch, 'O'])

            doubleBond(molecule, mainBranch, p, 'O')
            molecule.bounder([p, mainBranch, 1, oBranch], [1, auxBranch, 1, oBranch])
        })
        return mainBranch
    } else if (ramifications) {
        // benzene
        const branch = createBenzene(molecule)
        handleRamifications(molecule, branch, ramifications)
        return branch
    }
}

function findFirstYl(str) {
    const stack = []
    for (let i = 0; i < str.length; i++) {
        const ch = str[i]
        if (ch === '[') {
            stack.push(i)
        } else if (ch === ']') {
            stack.pop()
        } else if (ch === 'y') {
            if (!stack.length && str[i + 1] === 'l') return i
        }
    }
    return -1
}
function handleRamifications(molecule, branch, str) {
    const rams = parseRamifications(str, 1)
    rams.forEach(({ positions, subparts, cycloRadical, prefix }) => {
        positions.forEach(p => {
            if (prefix) {
                const newBranch = handlePrefix(molecule, branch, p, prefix)
                if (subparts) {
                    handleRamifications(molecule, newBranch, subparts)
                }
            } else {
                const newBranch = handleAlk(molecule, cycloRadical)
                if (subparts) {
                    handleRamifications(molecule, newBranch, subparts)
                }
                molecule.bounder([p, branch, 1, newBranch])
            }
        })
    })
}
function handleAlk(molecule, cycloRadical, after) {
    // extract en/yn from alk
    if (!after) {
        const matches = rAlk.exec(cycloRadical)
        cycloRadical = matches[1]
        after = matches[2]
    }
    const { isCyclo, radical } = parseRadical(cycloRadical)

    molecule.brancher(radical)
    const branch = molecule.branches.length
    if (isCyclo) {
        molecule.bounder([1, branch, radical, branch])
    }

    if (!after || after === 'an') {
        // ignore
    } else {
        parseEnOrYn(after).forEach(c => molecule.bounder([c, branch, c + 1, branch]))
    }
    return branch
}
function handleEnd(molecule, branch, str) {
    if (str === 'e') {
       return
    }

    parseRamifications(str, molecule.branches[branch - 1].length, true).forEach(({ positions, prefix }) => {
        positions.forEach(p => {
            handlePrefix(molecule, branch, p, prefix)
        })
    })
}
function handlePrefix(molecule, branch, pos, str) {
    let newBranch
    switch (str) {
        case 'fluoro': // -F
        case 'chloro': // -Cl
        case 'bromo':  // -Br
        case 'iodo':   // -I
        case 'hydroxy':  // -OH
        case 'mercapto': // -SH
        case 'amino': // -NH2
        case 'phosphino': // -PH2
        case 'arsino': // -AsH2
            newBranch = createBranch(molecule, 1)
            molecule.mutate([1, newBranch, PREFIX2ELT[str]])
            molecule.bounder([pos, branch, 1, newBranch])
            break
        case 'ol':  // -OH
        case 'thiol': // -SH
        case 'amine': // -NH2
        case 'phosphine': // -PH2
        case 'arsine': // -AsH2
            newBranch = createBranch(molecule, 1)
            molecule.mutate([1, newBranch, SUFFIX2ELT[str]])
            molecule.bounder([pos, branch, 1, newBranch])
            break
        case 'oxo': // =O
        case 'one': // =O
        case 'al':
            doubleBond(molecule, branch, pos, 'O')
            break
        case 'formyl': // -CH=O
            newBranch = createBranch(molecule, 2)
            molecule.mutate([2, newBranch, 'O'])
            molecule.bounder([pos, branch, 1, newBranch])
            molecule.bounder([1, newBranch, 2, newBranch])
            break
        case 'carboxy': // -CO-OH
        case 'carboxylic acid':
            newBranch = createBranch(molecule, 2)
            molecule.mutate([2, newBranch, 'O'])
            molecule.bounder([pos, branch, 1, newBranch])
            molecule.bounder([1, newBranch, 2, newBranch])

            molecule.add([1, newBranch, 'O'])
            break
        case 'oic acid':
            // the carbon is in the chain
            doubleBond(molecule, branch, pos, 'O')
            molecule.add([pos, branch, 'O'])
            break
        case 'amido': // (C)O-NH2
        case 'amide':
            doubleBond(molecule, branch, pos, 'O')

            molecule.add([pos, branch, 'N'])
            break
        case 'imino': // (C)=NH
        case 'imine': // (C)=NH
            doubleBond(molecule, branch, pos, 'N')
            break
        case 'phenyl': // -C6H5
            newBranch = createBenzene(molecule)
            molecule.bounder([pos, branch, 1, newBranch])
            break
        default:
            if (/oxycarbonyl$/.test(str)) { // ...(C)-CO-O-R
                str = str.slice(0, -('oxycarbonyl'.length))
                const auxBranch = handle(molecule, str, true)

                newBranch = createBranch(molecule, 2)
                molecule.mutate([2, newBranch, 'O'])
                doubleBond(molecule, newBranch, 1, 'O')

                molecule.bounder([pos, branch, 1, newBranch], [2, newBranch, 1, auxBranch])
                return auxBranch
            } else if (/oyloxy$/.test(str)) { // ...(C)-O-OR
                str = str.slice(0, -('oyloxy'.length))
                const auxBranch = handle(molecule, str, true)
                doubleBond(molecule, auxBranch, 1, 'O')

                newBranch = createBranch(molecule, 1)
                molecule.mutate([1, newBranch, 'O'])

                molecule.bounder([pos, branch, 1, newBranch], [1, newBranch, 1, auxBranch])
                return auxBranch
            } else if (/oxy$/.test(str)) { // R1-O-R2
                str = str.slice(0, -('oxy'.length))
                const auxBranch = handle(molecule, str, true)

                newBranch = createBranch(molecule, 1)
                molecule.mutate([1, newBranch, 'O'])

                molecule.bounder([pos, branch, 1, newBranch], [1, newBranch, 1, auxBranch])
                return auxBranch
            } else {
                throw new Error('unknown prefix: ' + str)
            }
    }
    return newBranch
}

function createBranch(molecule, ...branches) {
    molecule.brancher(...branches)
    return molecule.branches.length
}
function createBenzene(molecule) {
    const branch = createBranch(molecule, 6)
    molecule.bounder(
        [1, branch, 2, branch],
        [3, branch, 4, branch],
        [5, branch, 6, branch],
        [1, branch, 6, branch]
    )
    return branch
}
function doubleBond(molecule, branch, pos, elt) {
    const newBranch = createBranch(molecule, 1)
    molecule.mutate([1, newBranch, elt])
    molecule.bounder([pos, branch, 1, newBranch])
    molecule.bounder([pos, branch, 1, newBranch])
    return newBranch
}

function parseRamifications(str, lastMainPos, isSuffix) {
    if (str[0] === '[' && str.endsWith(']')) {
        str = str.slice(1, -1)
    }

    const stack = []
    const filtered = []
    const subs = []
    for (let i = 0; i < str.length; i++) {
        const ch = str[i]
        if (ch === '[') {
            stack.push(i)
        } else if (ch === ']') {
            const sub = str.slice(stack.pop() + 1, i) // exclude [ and ]
            if (!stack.length) {
                filtered.push(`[${subs.length}]`)
                subs.push(sub)
            }
        } else if (!stack.length) {
            filtered.push(ch)
        }
    }

    let tokens = filtered.join('').split('-').filter(Boolean)
    if (tokens.length & 1) {
        const positions = getOmittedPositions(tokens[0], lastMainPos)
        tokens.unshift(positions)
    }
    for (let i = 0; i < tokens.length; i += 2) {
        if (isSuffix) break

        const cut = {}
        const skipped = {}
        const substr = tokens[i + 1]
        // make sure longer prefixes be checked before than shorter ones
        ;[...PREFIXES, 'yl'].forEach(p => {
            let pos = 0
            while ((pos = substr.indexOf(p, pos)) >= 0) {
                const k = pos + p.length
                if (!skipped[k]) {
                    cut[k] = 1
                    for (let j = 1; j < p.length; j++) {
                        skipped[k - j] = 1
                    }
                }
                pos++
            }
        })

        const cuts = [...new Set(
            Object.keys(cut).map(Number)
        )].sort((a, b) => a - b)
        if (!cuts.length) continue

        const parts = []
        cuts.map((pos, j, list) => substr.slice(j ? list[j - 1] : 0, pos))
            .forEach((part, j) => {
                // skip the first one, as its multipler has been added before
                if (j) {
                    parts.push(getOmittedPositions(part, lastMainPos), part)
                } else {
                    parts.push(part)
                }
            })
        tokens[i + 1] = parts
    }
    tokens = tokens.reduce((list, item) => list.concat(item), [])

    const rams = []
    for (let i = 0; i < tokens.length; i += 2) {
        let subparts, cycloRadical, prefix
        const positions = tokens[i].split(',').map(Number)
        let substr = tokens[i + 1]
        if (positions.length === 1) {
            // ignore
        } else {
            const multipler = MULTIPLIERS[positions.length - 2]
            if (substr.indexOf(multipler) === 0) {
                substr = substr.slice(multipler.length)
            } else {
                throw new Error('bad multipler: ' + substr)
            }
        }

        const tagStartIndex = substr.indexOf('[')
        const tagEndIndex = substr.indexOf(']')
        let afterTagPart
        if (tagStartIndex < 0) {
            afterTagPart = substr
        } else {
            const index = parseInt(substr.slice(tagStartIndex + 1, tagEndIndex))
            subparts = subs[index]

            afterTagPart = substr.slice(tagEndIndex + 1)
        }

        if (/yl$/.test(afterTagPart)
                && ['formyl', 'phenyl'].indexOf(afterTagPart) < 0
                && !/oxycarbonyl$/.test(afterTagPart)) {
            cycloRadical = afterTagPart.slice(0, -2)
        } else if (['en', 'yn', ...RADICALS].some(r => substr.endsWith(r))) {
            let found
            let pos = i + 2
            while (pos + 1 < tokens.length) {
                const matches = /(en|yn)(yl|oxycarbonyl|oyloxy|oxy)?$/.exec(tokens[pos + 1])
                if (!matches) break

                found = matches[2]
                pos += 2
            }

            if (found) {
                cycloRadical = [afterTagPart, ...tokens.slice(i + 2, pos)].join('-')
                if (found === 'yl') {
                    cycloRadical = cycloRadical.slice(0, -found.length) // omit 'yl'
                } else {
                    // give to `handlePrefix`
                    prefix = cycloRadical
                    cycloRadical = ''
                }
                i = pos - 2
            } else {
                throw new Error('bad ramification part: ' + tokens[i + 1])
            }
        } else {
            prefix = afterTagPart
        }

        rams.push({
            positions,
            subparts,
            cycloRadical,
            prefix,
        })
    }
    return rams
}
function getOmittedPositions(str, lastMainPos) {
    const rMultipler = new RegExp(withFlag(MULTIPLIERS.join('|'), '?'))
    const match = rMultipler.exec(str)
    if (match[0].length) {
        const multipler = parseMultipler(match[0])
        if (multipler === 2) {
            return [1, lastMainPos].join(',')
        } else if (multipler === 3) {
            return [1, 1, 1].join(',')
        } else {
            // heptadecyl
            return '1'
        }
    } else {
        return '1'
    }
}

function parseRadical(str) {
    let isCyclo = false
    if (str.indexOf('cyclo') === 0) {
        isCyclo = true
        str = str.slice(5)
    }
    const radical = RADICALS.indexOf(str) + 1
    if (!radical) throw new Error('invalid radical: ' + str)
    return { isCyclo, radical }
}
function parseMultipler(str) {
    return MULTIPLIERS.indexOf(str) + 2
}
function parseEnOrYn(str) {
    if (str.endsWith('an')) {
        // FIXME: bad fix for propenanoyloxy
        str = str.slice(0, -2)
    }
    // tridec-4,10-dien-2,6,8-triyn
    const tokens = str.split('-').filter(Boolean)
    if (tokens.length & 1) {
        tokens.unshift('1')
    }
    if (tokens.length & 1) throw new Error('bad en or yn: ' + str)

    const bonders = [] // start positions
    for (let i = 0; i < tokens.length; i += 2) {
        const positions = tokens[i].split(',').map(Number)
        const isYn = /yn$/.test(tokens[i + 1])
        bonders.push(...positions)

        if (isYn) {
            bonders.push(...positions)
        }
    }
    return bonders
}

function buildRegExps() {
    const radical = RADICALS.join('|')
    const cycloRadical = join(withFlag('cyclo', '?'), radical)

    const multipler = MULTIPLIERS.join('|')
    const positions = join('\\d+', withFlag(',\\d+', '*'))

    // tridec-4,10-dien-2,6,8-triyne
    const eneRepeatedPart = join(withFlag(join('-', positions, '-'), '?'), withFlag(multipler, '?'), or('en', 'yn'))
    const alkenesOrAlkynes = withFlag(eneRepeatedPart, '+')

    const alkHolder = '.+'
    const prefixes = or(join(alkHolder, or('oxycarbonyl', 'oyloxy', 'oxy')), ...PREFIXES)
    const suffixes = SUFFIXES.join('|')

    // FIXME: bad match when both prefix and suffix contain subparts
    const subparts = '\\[.+\\]'
    const ramification = join(
        withFlag(join(positions, '-'), '?'), withFlag(multipler, '?'), withFlag(subparts, '?'),
        or(
            join(cycloRadical, withFlag(alkenesOrAlkynes, '?'), 'yl'),
            prefixes,
        ),
    )
    const ramifications = join('\\[?', ramification, withFlag(join(withFlag('-', '?'), ramification), '*'), '\\]?')

    // 3-[1-hydroxy]methylpentan-1,4-diol
    const functionSuffixes = join(withFlag(join('-', positions, '-'), '?'), withFlag(multipler, '?'), suffixes)

    const before = withFlag(ramifications, '?')
    const after = or(
        withFlag('an', '?'), // FIXME: not sure `an` can be omitted
        join(alkenesOrAlkynes, withFlag('an', '?')), // FIXME: not sure extra `an` is allowed
    )
    const end = or('e', functionSuffixes)

    const str = or(
        joinCaptured(before, cycloRadical, after, end),
        joinCaptured(before, ['amine', 'phosphine', 'arsine'].join('|')),
        joinCaptured(alkHolder, 'yl', 'ether'),
        joinCaptured(alkHolder, 'yl ', alkHolder, 'oate'),
        joinCaptured(ramifications, 'benzene')
    )

    const obj = {
        reg: withGroup(str),
        rAlk: joinCaptured(cycloRadical, withFlag(eneRepeatedPart, '*')),
    }
    return Object.keys(obj).reduce((o, k) => {
        o[k] = new RegExp(`^${obj[k]}$`)
        return o
    }, {})
}

function joinCaptured(...parts) {
    return parts
        .map(p => withGroup(p, { capture: true }))
        .join('')
}
function join(...parts) {
    return parts
        .map(p => withGroup(p))
        .join('')
}
function or(...parts) {
    return parts
        .map(p => withGroup(p))
        .join('|')
}
function withGroup(str, opts = {}) {
    const { force, capture = false } = opts
    if (!force && /^[a-z -]+$/.test(str)) return str

    return capture ? `(${str})` : `(?:${str})`
}
function withFlag(str, flag) {
    return withGroup(str, { force: true }) + flag
}

const tests = [
    'methane', // c1h4
    'hex-1,4-diene', // c6h10
    'hex-2-yne', // c6h10
    '3-ethyl-2,5-dimethylhexane',
    '1,2-di[1-ethyl-3-[2-methyl]propyl]heptylcyclobutane',
    'tridec-4,10-dien-2,6,8-triyne',
    '3-[1-hydroxy]methylpentan-1,4-diol',
    '4-[1-oxo]ethylheptan-2,6-dione',
    'pent-3-enamide',
    'methan-1-phosphine',
    '1-amino-6-[diethyl]arsinohexan-3-ol',
    'methylprop-1-enylether',
    '3-prop-2-enoxypropan-1-ol',
    'methyl butanoate',
    '2-ethyl-1-formylbenzene',
    'cyclobutandiol',
]
tests.forEach(str => {
    console.log(parse(str))
})
