// https://www.cnblogs.com/lgp687/p/3956849.html

interface Item {
    rest?: number,
    str?: string
}
interface Equation {
    rest: number,
    items: Item[]
}

function generateReg(n: number): RegExp {
    const eqs = generateEquations(n);
    

    // TODO:
    return new RegExp('');
}
function generateEquations(n: number): Equation[] {
    const arr = [];
    for (let i = 0; i < n; i++) {
        arr.push({
            rest: i,
            items: []
        });
    }
    arr[0].items.push({str: '0'});
    arr[1].items.push({str: '1'});

    for (let i = 0; i < n; i++) {
        const r0 = i * 2 % n;
        const r1 = (i * 2 + 1) % n;
        arr[r0].items.push({
            rest: i,
            str: '0'
        });
        arr[r1].items.push({
            rest: i,
            str: '1'
        });
    }

    return arr;
}
