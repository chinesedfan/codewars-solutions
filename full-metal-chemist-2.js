// Number:        1      2      3...
const RADICALS    = ['meth', 'eth', 'prop', 'but',   'pent',  'hex',  'hept',  'oct',  'non',  'dec',  'undec',  'dodec',  'tridec',  'tetradec',  'pentadec',  'hexadec',  'heptadec',  'octadec',  'nonadec']
const MULTIPLIERS = [        'di',  'tri',  'tetra', 'penta', 'hexa', 'hepta', 'octa', 'nona', 'deca', 'undeca', 'dodeca', 'trideca', 'tetradeca', 'pentadeca', 'hexadeca', 'heptadeca', 'octadeca', 'nonadeca']

const SUFFIXES    = [         'ol',      'al', 'one', 'oic acid', 'carboxylic acid',                'oate',               'ether', 'amide', 'amine', 'imine', 'benzene', 'thiol',    'phosphine', 'arsine']
const PREFIXES    = ['cyclo', 'hydroxy',       'oxo',             'carboxy',         'oxycarbonyl', 'anoyloxy', 'formyl', 'oxy',   'amido', 'amino', 'imino', 'phenyl',  'mercapto', 'phosphino', 'arsino', 'fluoro', 'chloro', 'bromo', 'iodo']

// Note that alkanes, alkenes alkynes, and akyles aren't present in these lists

function parse(name) {
    // Parse the name given as argument in the constructor and output the dict representing the raw formula
}

function buildRegExps() {
    const radical = RADICALS.join('|')
    const cycloRadical = join(withFlag('cyclo', '?'), radical)

    const multipler = MULTIPLIERS.join('|')
    const positions = join('\\d+', withFlag(',\\d+', '*'))

    const prefixes = PREFIXES.join('|')
    const suffixes = SUFFIXES.join('|')

    // FIXME: bad match when both prefix and suffix contain subparts
    const subparts = '\\[.+\\]'
    const ramification = join(
        positions, '-', withFlag(multipler, '?'), withFlag(subparts, '?'),
        cycloRadical,
        or('yl', prefixes),
    )
    const ramifications = join(ramification, withFlag(join('-', ramification), '*'))

    // tridec-4,10-dien-2,6,8-triyne
    const eneRepeatedPart = join('-', positions, withFlag(multipler, '?'), or('en', 'yn'))
    const alkenesOrAlkynes = join(withFlag(eneRepeatedPart, '+'), 'e')

    // 3-[1-hydroxy]methylpentan-1,4-diol
    const functionSuffixes = join('an-', positions, withFlag(multipler, '?'), suffixes)

    const before = or(multipler, ramifications)
    const after = or('ane', alkenesOrAlkynes, functionSuffixes)

    const str = join(before, cycloRadical, after)
    return new RegExp(str)
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
function withGroup(str, capture = true) {
    if (/^[a-z\-]+$/.test(str) || str[0] === '(') return str

    return capture ? `(${str})` : `(?:${str})`
}
function withFlag(str, flag) {
    return withGroup(str) + flag
}

const reg = buildRegExps()
console.log(reg)
const tests = [
    'tridec-4,10-dien-2,6,8-triyne',
    '3-[1-hydroxy]methylpentan-1,4-diol',
]
tests.forEach(str => {
    const matches = reg.exec(str)
    console.log(matches)
})
