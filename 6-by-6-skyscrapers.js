function solvePuzzle(clues) {
    const n = clues.length / 4;
    const ps = generatePermutations(n);
    const seenMap = dividedIntoGroups(ps);

    const grid = new Array(n).fill(0).map(() => new Array(n));
    fillGridForX(grid, n, clues);
    // determine columns of the highest
    seenMap.confirmed = grid.map((row) => {
        let j = -1;
        row.forEach((x, k) => {
            if (x) j = k;
        });
        return j;
    });

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

    return indexes.map((i, r) => getCandidatesForRow(clues, ps, seenMap, r)[i]);
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
        leftMap[left].push(ps[i]);

        const right = seenFromRight(ps[i]);
        if (!rightMap[right]) rightMap[right] = [];
        rightMap[right].push(ps[i]);

        if (!totalMap[left]) totalMap[left] = {};
        if (!totalMap[left][right]) totalMap[left][right] = [];
        totalMap[left][right].push(ps[i]);
    }
    return {
        left: leftMap,
        right: rightMap,
        total: totalMap
    };
}
function getCandidatesForRow(clues, ps, seenMap, row) {
    const left = getLeftClue(clues, row);
    const right = getRightClue(clues, row);

    let candidates;
    if (left && right) {
        candidates = seenMap.total[left][right];
    } else if (left) {
        candidates = seenMap.left[left];
    } else if (right) {
        candidates = seenMap.right[right];
    } else {
        candidates = ps;
    }
    return candidates;
}

function findIndexForRow(clues, ps, seenMap, indexes, row) {
    // candidate indexes
    const candidates = getCandidatesForRow(clues, ps, seenMap, row);
    const column = seenMap.confirmed[row];

    while (++indexes[row] < candidates.length) {
        const heights = candidates[indexes[row]];
        if (column >= 0 && heights[column] != clues.length / 4) continue;
        // check columns
        const hasError = heights.some((h, i) => {
            const arr = [];
            const map = {};
            for (let j = 0; j <= row; j++) {
                const x = j < row ? getCandidatesForRow(clues, ps, seenMap, j)[indexes[j]][i] : h;
                if (map[x]) return true;

                map[x] = 1;
                arr.push(x);
            }
            // check from top and bottom
            const top = getTopClue(clues, i);
            if (top && seenFromLeft(arr) > top) return true;
            if (row == clues.length / 4 - 1) {
                if (top && seenFromLeft(arr) != top) return true;
                const bottom = getBottomClue(clues, i);
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

function fillGridForX(grid, x, clues) {
    const n = clues.length / 4;
    const mask = grid.map((row) => new Array(row.length));
    const done = n - x;
    let i, j, k, indexes;
    // check by row
    for (i = 0; i < n; i++) {
        const left = getLeftClue(clues, i);
        const right = getRightClue(clues, i);
        for (j = 0; j < n; j++) {
            mask[i][j] = grid[i][j] || (left == 1 && j) || (right == 1 && j != n - 1)
                    || j < left - done - 1 || n - 1 - j < right - done - 1;
        }
    }

    // check by column
    for (j = 0; j < n; j++) {
        const top = getTopClue(clues, j);
        const bottom = getBottomClue(clues, j);
        for (i = 0; i < n; i++) {
            mask[i][j] = mask[i][j] || (top == 1 && i) || (bottom == 1 && i != n - 1)
                    || i < top - done - 1 || n - 1 - i < bottom - done - 1;
        }
    }

    let confirmed = 0;
    let found = true;
    while (confirmed < n && found) {
        found = false;

        // update the corresponding column
        for (i = 0; i < n; i++) {
            indexes = [];
            for (j = 0; j < n; j++) {
                if (!mask[i][j]) indexes.push(j);
            }
            if (indexes.length == 1) {
                found = true;
                confirmed++;

                j = indexes[0];
                grid[i][j] = x;
                for (k = 0; k < n; k++) {
                    mask[k][j] = true;
                }
                break;
            }
        }
        if (found) continue;

        // update the corresponding row
        for (j = 0; j < n; j++) {
            indexes = [];
            for (i = 0; i < n; i++) {
                if (!mask[i][j]) indexes.push(i);
            }
            if (indexes.length == 1) {
                found = true;
                confirmed++;

                i = indexes[0];
                grid[i][j] = x;
                for (k = 0; k < n; k++) {
                    mask[i][k] = true;
                }
                break;
            }
        }
        if (found) continue;
    }
}
function getLeftClue(clues, row) {
    return clues[clues.length - 1 - row];
}
function getRightClue(clues, row) {
    return clues[clues.length / 4 + row];
}
function getTopClue(clues, col) {
    return clues[col];
}
function getBottomClue(clues, col) {
    return clues[clues.length * 3 / 4 - 1 - col];
}

