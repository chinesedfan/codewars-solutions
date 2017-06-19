function solvePuzzle(clues) {
    const n = clues.length / 4;
    const ps = generatePermutations(n);

    const indexes = new Array(n).fill(-1); // index of each row in permutations
    let row = 0;
    while (1) {
        if (findIndexForRow(clues, ps, indexes, row)) {
            row++;
            // solved
            if (row >= n) break;
        } else {
            indexes[row] = -1;
            row--;
            // invalid
            if (row < 0) throw new Error('can not solve');
        }
    }

    return indexes.map((i) => ps[i]);
}

function generatePermutations(n) {
    let ps = [[1]];
    for (let i = 2; i <= n; i++) {
        const next = [];
        for (let j = 0; j < i; j++) {
            for (let k = 0; k < ps.length; k++) {
                const p = ps[k];
                next.push(p.slice(0, j).concat([i]).concat(p.slice(j)));
            }
        }
        ps = next;
    }
    return ps;
}

function findIndexForRow(clues, ps, indexes, row) {
    while (++indexes[row] < ps.length) {
        const heights = ps[indexes[row]];
        // check from left and right
        const left = clues[clues.length - 1 - row];
        if (left && left != seenFromLeft(heights)) continue;
        const right = clues[clues.length / 4 + row];
        if (right && right != seenFromRight(heights)) continue;

        // check columns
        const hasError = heights.some((h, i) => {
            const arr = [];
            const map = {};
            for (let j = 0; j <= row; j++) {
                const x = j < row ? ps[indexes[j]][i] : h;
                if (map[x]) return true;

                map[x] = 1;
                arr.push(x);
            }
            // check from top and bottom
            const top = clues[i];
            if (top && seenFromLeft(arr) > top) return true;
            if (row == clues.length / 4 - 1) {
                if (top && seenFromLeft(arr) != top) return true;
                const bottom = clues[clues.length * 3 / 4 - 1 - i];
                if (bottom && bottom != seenFromRight(arr)) return true;
            }
        });
        if (hasError) continue;

        return true;
    }
    return false;
}

function seenFromLeft(heights) {
    let h = heights[0], count = 1;
    for (let i = 1; i < heights.length; i++) {
        if (heights[i] > h) {
            h = heights[i];
            count++;
        }
    }
    return count;
}
function seenFromRight(heights) {
    let h = heights[heights.length - 1], count = 1;
    for (let i = heights.length - 2; i >= 0; i--) {
        if (heights[i] > h) {
            h = heights[i];
            count++;
        }
    }
    return count;
}
