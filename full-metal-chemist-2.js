// Number:        1      2      3...
const RADICALS    = ['meth', 'eth', 'prop', 'but',   'pent',  'hex',  'hept',  'oct',  'non',  'dec',  'undec',  'dodec',  'tridec',  'tetradec',  'pentadec',  'hexadec',  'heptadec',  'octadec',  'nonadec']
const MULTIPLIERS = [        'di',  'tri',  'tetra', 'penta', 'hexa', 'hepta', 'octa', 'nona', 'deca', 'undeca', 'dodeca', 'trideca', 'tetradeca', 'pentadeca', 'hexadeca', 'heptadeca', 'octadeca', 'nonadeca']

const SUFFIXES    = [         'ol',      'al', 'one', 'oic acid', 'carboxylic acid',                'oate',               'ether', 'amide', 'amine', 'imine', 'benzene', 'thiol',    'phosphine', 'arsine']
const PREFIXES    = ['cyclo', 'hydroxy',       'oxo',             'carboxy',         'oxycarbonyl', 'anoyloxy', 'formyl', 'oxy',   'amido', 'amino', 'imino', 'phenyl',  'mercapto', 'phosphino', 'arsino', 'fluoro', 'chloro', 'bromo', 'iodo']

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

function parse(name) {
    // Parse the name given as argument in the constructor and output the dict representing the raw formula
    const molecule = new Molecule(name)
    const reg = buildRegExps()
    const [
        _,
        before, cycloRadical, after, end,
        alk1, alk2,
        alk3, alk4,
        ramifications
    ] = reg.exec(name)
    if (cycloRadical) {
        const branch = handleAlk(molecule, cycloRadical, after)

        if (before) {
            handleRamifications(molecule, branch, before)
        }
        handleEnd(molecule, branch, end)
    } else if (alk1) {
        // ether, R1-O-R2
        const b1 = handleAlk(molecule, alk1.slice(0, -2)) // omit 'yl'
        const b2 = handleAlk(molecule, alk2.slice(0, -2)) // omit 'yl'
        const b3 = createBranch(molecule, 1)
        molecule.mutate([1, b3, 'O'])
        molecule.bounder([1, b1, 1, b3], [1, b2, 1, b3])
    } else if (alk3) {
        // ester, ...(C)O-O-R
        // FIXME: extract en/yn from alk
        const b1 = handleAlk(molecule, alk3.slice(0, -2)) // omit 'yl'
        const b2 = handleAlk(molecule, alk4.slice(0, -2)) // omit 'an'
        const b3 = createBranch(molecule, 1)
        molecule.mutate([1, b3, 'O'])

        const lastMainPos = molecule.branches[b2].length
        doubleBond(molecule, b2, lastMainPos, 'O')
        molecule.bounder([lastMainPos, b2, 1, b3], [1, b1, 1, b3])
    } else if (ramifications) {
        // benzene
        const branch = createBranch(molecule, 6)
        molecule.bounder([1, 1, 2, 1], [3, 1, 4, 1], [5, 1, 6, 1])

        handleRamifications(molecule, branch, ramifications)
    }
    molecule.closer()
    return molecule.atoms.reduce((obj, atom) => {
        obj[atom.element] = (obj[atom.element] || 0) + 1
        return obj
    }, {})
}

function handleRamifications(molecule, branch, str) {
    const rams = parseRamifications(str)
    rams.forEach(({ positions, subparts, cycloRadical, prefix }) => {
        positions.forEach(p => {
            if (prefix) {
                handlePrefix(molecule, branch, p, prefix)
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

    parseRamifications(str).forEach(({ positions, prefix }) => {
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
            molecule.add([pos, branch, PREFIX2ELT[str]])
            break
        case 'ol':  // -OH
        case 'thiol': // -SH
        case 'amine': // -NH2
        case 'phosphine': // -PH2
        case 'arsine': // -AsH2
            molecule.add([pos, branch, SUFFIX2ELT[str]])
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
        case 'oic acid':
        case 'carboxylic acid':
            newBranch = createBranch(molecule, 2)
            molecule.mutate([2, newBranch, 'O'])
            molecule.bounder([pos, branch, 1, newBranch])
            molecule.bounder([1, newBranch, 2, newBranch])

            molecule.add([1, newBranch, 'O'])
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
        default:
            throw new Error('unknown prefix: ' + str)
    }
}

function createBranch(molecule, ...branches) {
    molecule.brancher(...branches)
    return molecule.branches.length
}
function doubleBond(molecule, branch, pos, elt) {
    const newBranch = createBranch(molecule, 1)
    molecule.mutate([1, newBranch, elt])
    molecule.bounder([pos, branch, 1, newBranch])
    molecule.bounder([pos, branch, 1, newBranch])
    return newBranch
}

function parseRamifications(str) {
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

    const tokens = filtered.join('').split('-').filter(Boolean)
    if (tokens.length & 1) throw new Error('bad ramifications: ' + str)

    const rams = []
    for (let i = 0; i < tokens.length; i += 2) {
        let subparts, cycloRadical, prefix
        const positions = tokens[i].split(',').map(Number)
        const substr = tokens[i + 1]

        const tagStartIndex = substr.indexOf('[')
        const tagEndIndex = substr.indexOf(']')
        let afterTagPart
        if (tagStartIndex < 0) {
            const rMultipler = new RegExp(withFlag(MULTIPLIERS.join('|'), '?'))
            const match = rMultipler.exec(substr)
            afterTagPart = match[0].length ? substr.slice(match[0].length) : substr
        } else {
            const index = parseInt(substr.slice(tagStartIndex + 1, tagEndIndex))
            subparts = subs[index]

            afterTagPart = substr.slice(tagEndIndex + 1)
        }

        if (/yl$/.test(afterTagPart)) {
            cycloRadical = afterTagPart.slice(0, -2)
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

function parseRadical(str) {
    let isCyclo = false
    if (str.indexOf('cyclo') === 0) {
        isCyclo = true
        str = str.slice(5)
    }
    const radical = RADICALS.indexOf(str) + 1
    return { isCyclo, radical }
}
function parseMultipler(str) {
    return MULTIPLIERS.indexOf(str) + 2
}
function parseEnOrYn(str) {
    // tridec-4,10-dien-2,6,8-triyn
    const tokens = str.split('-').filter(Boolean)
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
    const eneRepeatedPart = join('-', positions, '-', withFlag(multipler, '?'), or('en', 'yn'))
    const alkenesOrAlkynes = withFlag(eneRepeatedPart, '+')

    const alk = join(cycloRadical, withFlag(eneRepeatedPart, '*'))
    const prefixes = or(join(alk, 'oxy'), ...PREFIXES)
    const suffixes = SUFFIXES.join('|')

    // FIXME: bad match when both prefix and suffix contain subparts
    const subparts = '\\[.+\\]'
    const ramification = join(
        positions, '-', withFlag(multipler, '?'), withFlag(subparts, '?'),
        or(
            join(cycloRadical, 'yl'),
            prefixes,
        ),
    )
    const ramifications = join(ramification, withFlag(join('-', ramification), '*'))

    // 3-[1-hydroxy]methylpentan-1,4-diol
    const functionSuffixes = join(withFlag(join('-', positions, '-'), '?'), withFlag(multipler, '?'), suffixes)

    const before = withFlag(ramifications, '?')
    const after = or('an', alkenesOrAlkynes)
    const end = or('e', functionSuffixes)

    const str = or(
        joinCaptured(before, cycloRadical, after, end),
        joinCaptured(alk, 'yl', 'ether'),
        joinCaptured(alk, 'yl ', alk, 'anoate'),
        joinCaptured(ramifications, 'benzene')
    )
    return new RegExp(`^${str}$`)
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
    if (!force && /^[a-z-]+$/.test(str)) return str

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
