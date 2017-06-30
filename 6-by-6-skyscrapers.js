function solvePuzzle(clues) {
    const n = clues.length / 4;
    const ps = generatePermutations(n);
    const seenMap = dividedIntoGroups(ps);

    const grid = new Array(n).fill(0).map(() => new Array(n).fill(0));
    // limit some possible values
    const mask = fillGrid(grid, clues);

    const indexes = new Array(n).fill(-1); // index of each row in permutations
    let row = 0;
    while (1) {
        if (findIndexForRow(clues, ps, indexes, row, seenMap, grid, mask)) {
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

function findIndexForRow(clues, ps, indexes, row, /* preset info */ seenMap, grid, mask) {
    const n = clues.length / 4;
    // candidate indexes
    const candidates = getCandidatesForRow(clues, ps, seenMap, row);
    const column = grid[row].indexOf(n);

    while (++indexes[row] < candidates.length) {
        const heights = candidates[indexes[row]];
        if (column >= 0 && heights[column] != n) continue;
        // check columns
        const hasError = heights.some((h, i) => {
            // conflict with the mask
            if (mask[row][i] & (1 << h - 1)) return true;

            const arr = [];
            const map = {};
            for (let j = 0; j <= row; j++) {
                const x = j < row ? getCandidatesForRow(clues, ps, seenMap, j)[indexes[j]][i] : h;
                if (map[x]) return true; // TODO: optimize to check duplicated

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

function fillGrid(grid, clues) {
    const n = clues.length / 4;
    // bit x means it can not be x, and x = 1 ~ n
    const mask = new Array(n).fill(0).map(() => new Array(n).fill(0));

    let i, j, k;
    // check by row
    for (i = 0; i < n; i++) {
        const left = getLeftClue(clues, i);
        const right = getRightClue(clues, i);
        for (j = 0; j < n; j++) {
            if ((left == 1 && !j) || (right == 1 && j == n - 1)) {
                maskTheSameLine(mask, i, j, n);
                continue;
            }

            for (k = 1; k <= n; k++) {
                const behind = n - k + 1;
                if (j + behind < left || n - 1 - j + behind < right) mask[i][j] |= 1 << k - 1;
            }
        }
    }

    // check by column
    for (j = 0; j < n; j++) {
        const top = getTopClue(clues, j);
        const bottom = getBottomClue(clues, j);
        for (i = 0; i < n; i++) {
            if ((top == 1 && !i) || (bottom == 1 && i == n - 1)) {
                maskTheSameLine(mask, i, j, n);
                continue;
            }

            for (k = 1; k <= n; k++) {
                const behind = n - k + 1;
                if (i + behind < top || n - 1 - i + behind < bottom) mask[i][j] |= 1 << k - 1;
            }
        }
    }

    // try to find unique possible
    while (1) {
        if (findUniqueBit(grid, mask, n)) continue;
        if (findUniqueCol(grid, mask, n)) continue;
        if (findUniqueRow(grid, mask, n)) continue;
        break;
    }

    return mask;
}

function findUniqueBit(grid, mask, n) {
    let i, j, k;
    for (i = 0; i < n; i++) {
        for (j = 0; j < n; j++) {
            if (grid[i][j]) continue;

            k = findUniqueIndex(n, (bit) => !(mask[i][j] & (1 << bit)));
            if (k >= 0) {
                grid[i][j] = k + 1;
                maskTheSameLine(mask, i, j, k + 1);
                return true;
            }
        }
    }
    return false;
}
function findUniqueCol(grid, mask, n) {
    let i, j, k;
    for (i = 0; i < n; i++) {
        for (k = 0; k < n; k++) {
            j = findUniqueIndex(n, (col) => !grid[i][col] && !(mask[i][col] & (1 << k)));
            if (j >= 0) {
                grid[i][j] = k + 1;
                maskTheSameLine(mask, i, j, k + 1);
                return true;
            }
        }
    }
    return false;
}
function findUniqueRow(grid, mask, n) {
    let i, j, k;
    for (j = 0; j < n; j++) {
        for (k = 0; k < n; k++) {
            i = findUniqueIndex(n, (row) => !grid[row][j] && !(mask[row][j] & (1 << k)));
            if (i >= 0) {
                grid[i][j] = k + 1;
                maskTheSameLine(mask, i, j, k + 1);
                return true;
            }
        }
    }
    return false;
}
function findUniqueIndex(n, fn) {
    const indexes = [];
    for (let i = 0; i < n; i++) {
        if (fn(i)) indexes.push(i);
    }
    return indexes.length == 1 ? indexes[0] : -1;
}
function maskTheSameLine(mask, i, j, x) {
    const n = mask.length;
    const maskAll = Math.pow(2, n) - 1; // every bit is 1

    let k;
    for (k = 0; k < n; k++) {
        if (k != j) mask[i][k] |= 1 << x - 1;
        if (k != i) mask[k][j] |= 1 << x - 1;
    }
    mask[i][j] = ~(1 << x - 1) & maskAll;
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
