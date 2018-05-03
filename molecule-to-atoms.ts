enum TokenType {
    Element,
    Number,
    Group
}
interface Token {
    type: TokenType,
    raw: string,
    value?: {[key: string]: number}
}

function parseAsTokens(formula) {
    const tokens: Token[] = [];
    const stack: number[] = [];

    formula.split('').forEach((c, i) => {
        if (/[([{]/.test(c)) {
            stack.push(i);
        } else if (/[)\]}]/.test(c)) {
            const beg = stack.pop();
            if (!stack.length) {
                tokens.push({
                    type: TokenType.Group,
                    raw: formula.substring(beg + 1, i)
                });
            }
        } else if (stack.length) {
            // in group
            return;
        }

        if (/[A-Z]/.test(c)) {
            tokens.push({
                type: TokenType.Element,
                raw: c
            });
        } else if (/[a-z]/.test(c)) {
            // the last token must be an element
            tokens[tokens.length - 1].raw += c;
        } else if (/[0-9]/.test(c)) {
            // there must be a token
            const last = tokens[tokens.length - 1];
            if (last.type === TokenType.Number) {
                last.raw += c;
            } else {
                tokens.push({
                    type: TokenType.Number,
                    raw: c
                });
            }
        }
    });

    return tokens;
}

export function parseMolecule(formula) {
    const tokens = parseAsTokens(formula);
    tokens.forEach((t, i) => {
        switch (t.type) {
        case TokenType.Element:
            t.value = {};
            t.value[t.raw] = 1;
            break;
        case TokenType.Number:
            const n = parseInt(t.raw);
            const prev = tokens[i - 1];
            for (let k in prev.value) {
                prev.value[k] *= n;
            }
            break;
        case TokenType.Group:
            t.value = parseMolecule(t.raw);
        default:
            break;
        }
    });

    const atoms = {};
    tokens.forEach((t) => {
        if (!t.value) return;

        for (let k in t.value) {
            if (!atoms[k]) atoms[k] = 0;

            atoms[k] += t.value[k];
        }
    });

    return atoms;
}

