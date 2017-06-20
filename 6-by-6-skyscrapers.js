function solvePuzzle(clues) {
    const n = clues.length / 4;
    const ps = generatePermutations(n);
    const seenMap = dividedIntoGroups(ps);

    const indexes = new Array(n).fill(-1); // index of each row in permutations
    let row = 0;
    while (1) {
        if (findIndexForRow(clues, ps, seenMap, indexes, row)) {
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
function dividedIntoGroups(ps) {
    // seen -> index
    const leftMap = {}, rightMap = {}, totalMap = {};
    for (let i = 0; i < ps.length; i++) {
        const left = seenFromLeft(ps[i]);
        if (!leftMap[left]) leftMap[left] = [];
        leftMap[left].push(i);

        const right = seenFromRight(ps[i]);
        if (!rightMap[right]) rightMap[right] = [];
        rightMap[right].push(i);

        if (!totalMap[left]) totalMap[left] = {};
        if (!totalMap[left][right]) totalMap[left][right] = [];
        totalMap[left][right].push(i);
    }
    return {
        left: leftMap,
        right: rightMap,
        total: totalMap
    };
}

function findIndexForRow(clues, ps, seenMap, indexes, row) {
    const left = clues[clues.length - 1 - row];
    const right = clues[clues.length / 4 + row];
    // candidate indexes
    let candidates;
    if (left && right) {
        candidates = seenMap.total[left][right];
    } else if (left) {
        candidates = seenMap.left[left];
    } else if (right) {
        candidates = seenMap.right[right];
    } else {
        candidates = new Array(ps.length - 1 - indexes[row]).fill(0).map((x, i) => indexes[row] + 1 + i);
    }

    for (let ci = 0; ci < candidates.length; ci++) {
        if (indexes[row] >= candidates[ci]) continue;

        const heights = ps[candidates[ci]];
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

        indexes[row] = candidates[ci];
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
