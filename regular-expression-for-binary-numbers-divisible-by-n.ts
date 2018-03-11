// tutorial: https://www.cnblogs.com/lgp687/p/3956849.html
// book: http://www.jb51.net/books/232140.html#download

// use the idea described by the book(about page 67),
// which is similar with the 2nd one in the tutorial

interface State {
    index: number, // rest value
    preList: number[],
    postList: number[]
}

const E = 'e'; // means empty str, not impossible(empty set)

function generateReg(n: number): RegExp {
    const {states, arches} = initStatesAndArches(n);
    states.forEach((s, i) => {
        if (i == 0) return;
        reduceState(states, arches, s);
    });
    
    const R = arches[0][0];
    return new RegExp(`^(${R})+$`);
}

function initStatesAndArches(n: number): {states: State[], arches: string[][]} {
    const states = [];
    for (let i = 0; i < n; i++) {
        states.push({
            index: i,
            preList: [],
            postList: []
        });
    }
    const arches = Array(n).fill(0).map(() => Array(n));

    for (let i = 0; i < n; i++) {
        addArch(states, arches, i, i * 2 % n, '0')
        addArch(states, arches, i, (i * 2 + 1) % n, '1')
    }

    return {states, arches};
}
function addArch(states: State[], arches: string[][], from: number, to: number, str: string): void {
    if (from != to) {
        states[from].postList.push(to);
        states[to].preList.push(from);
    }
    arches[from][to] = str;
}
function deleteArch(st: State, pre: boolean, index: number): void {
    const list = pre ? st.preList : st.postList;
    const i = list.indexOf(index);
    if (i < 0) return;

    list.splice(i, 1);
}

function reduceState(states: State[], arches: string[][], st: State): void {
    st.preList.forEach((k) => {
        st.postList.forEach((m) => {
            const q = states[k]; // pre state
            const p = states[m]; // post state

            const Rkm = arches[k][m];
            const Qk = arches[k][st.index];
            const Pm = arches[st.index][m];
            const S = arches[st.index][st.index];

            // Rkm | Qk(S)*Pm
            const S_ = S ? `(${S})*` : E; 
            const str = addExp(Rkm, concatExp(Qk, S_, Pm));
            deleteArch(q, false, p.index);
            deleteArch(p, true, q.index);
            addArch(states, arches, q.index, p.index, str);

            deleteArch(q, false, st.index);
            deleteArch(p, true, st.index);

            console.log(st.index, '-', k, m, arches[k][m]);
        });
    });
}

function addExp(...args) {
    const notEnotEmpty = args.filter((x) => x && x != E);
    return cleverJoin(notEnotEmpty, '|');
}
function concatExp(...args) {
    const notE = args.filter((x) => x != E);
    const hasEmptySet = args.some((x) => !x);
    return hasEmptySet ? '' : cleverJoin(notE, '');
}
function cleverJoin(exps: string[], sep: string): string {
    if (exps.length == 1) return exps[0];
    return exps.map((s) => s.indexOf('|') > 0 ? `(${s})` : s).join(sep);
}
