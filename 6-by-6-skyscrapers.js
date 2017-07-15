function solvePuzzle(clues) {
    const n = clues.length / 4;
    const ps = generatePermutations(n);

    // group by seen
    const seenMap = dividedIntoGroups(ps);
    // init grid/mask
    const grid = new Array(n).fill(0).map(() => new Array(n).fill(0));
    const mask = fillGrid(grid, clues);
    // filter candidates and update grid/mask
    const rowCandidatesList = new Array(n).fill(0).map((_, r) => getCandidatesForRow(r, clues, ps, seenMap));
    const colCandidatesList = new Array(n).fill(0).map((_, c) => getCandidatesForCol(c, clues, ps, seenMap));
    while (1) {
        const updated = filterCandidatesListByMask(rowCandidatesList, colCandidatesList, grid, mask);
        if (!updated) break;

        updateMask(mask, rowCandidatesList, colCandidatesList);
        pruneGridAndMask(grid, mask);
    }

    let state = {
        mask: mask,
        tops: new Array(n).fill(0),
        maxs: new Array(n).fill(0)
    };
    const stateList = [cloneState(state)];

    const indexes = new Array(n).fill(-1); // index of each row in permutations
    let row = 0;
    while (1) {
        if (findIndexForRow(row, indexes, clues, ps, rowCandidatesList, state)) {
            row++;
            stateList[row] = cloneState(state);
            // solved
            if (row >= n) break;
        } else {
            indexes[row] = -1;
            row--;
            state = cloneState(stateList[row]);
            // invalid
            if (row < 0) throw new Error('can not solve');
        }
    }

    return indexes.map((i, r) => rowCandidatesList[r][i]);
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
function getCandidatesForRow(row, clues, ps, seenMap) {
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
function getCandidatesForCol(col, clues, ps, seenMap) {
    const top = getTopClue(clues, col);
    const bottom = getBottomClue(clues, col);

    let candidates;
    if (top && bottom) {
        candidates = seenMap.total[top][bottom];
    } else if (top) {
        candidates = seenMap.left[top];
    } else if (bottom) {
        candidates = seenMap.right[bottom];
    } else {
        candidates = ps;
    }

    return candidates;
}
function filterCandidatesListByMask(rowCandidatesList, colCandidatesList, grid, mask) {
    let updated = false;
    rowCandidatesList.map((candidates, row) => {
        const result = candidates.filter((heights) => {
            return heights.every((h, column) => {
                return !(mask[row][column] & (1 << h - 1));
            });
        });
        if (result.length < candidates.length) updated = true;
        if (result.length == 1) {
            const heights = result[0];
            heights.forEach((h, column) => {
                grid[row][column] = h;
                maskTheSameLine(mask, row, column, h);
            });
        }
        rowCandidatesList[row] = result;
    });
    colCandidatesList.forEach((candidates, column) => {
        const result = candidates.filter((heights) => {
            return heights.every((h, row) => {
                return !(mask[row][column] & (1 << h - 1));
            });
        });
        if (result.length < candidates.length) updated = true;
        if (result.length == 1) {
            const heights = result[0];
            heights.forEach((h, row) => {
                grid[row][column] = h;
                maskTheSameLine(mask, row, column, h);
            });
        }
        colCandidatesList[column] = result;
    });
    return updated;
}

function updateMask(mask, rowCandidatesList, colCandidatesList) {
    const n = mask.length;
    const maskAll = Math.pow(2, n) - 1; // every bit is 1

    const rowBits = new Array(n).fill(0).map(() => new Array(n).fill(0)); // 1 means possible
    rowCandidatesList.forEach((candidates, row) => {
        candidates.forEach((heights) => {
            heights.forEach((h, column) => {
                rowBits[row][column] |= 1 << h - 1;
            });
        });
    });
    const colBits = new Array(n).fill(0).map(() => new Array(n).fill(0)); // 1 means possible
    colCandidatesList.forEach((candidates, column) => {
        candidates.forEach((heights) => {
            heights.forEach((h, row) => {
                colBits[row][column] |= 1 << h - 1;
            });
        });
    });

    mask.forEach((row, r) => {
        // key point, must be possiable in both
        mask[r] = row.map((val, c) => maskAll & ~(rowBits[r][c] & colBits[r][c]));
    });
}

function findIndexForRow(row, indexes, /* info */ clues, ps, candidatesList, state) {
    const candidates = candidatesList[row];

    while (++indexes[row] < candidates.length) {
        const heights = candidates[indexes[row]];
        const otherState = cloneState(state);
        const mask = otherState.mask;
        const tops = otherState.tops;
        const maxs = otherState.maxs;
        // check columns
        const hasError = heights.some((h, column) => {
            // check duplicated
            if (mask[row][column] & (1 << h - 1)) return true;
            maskTheSameLine(mask, row, column, h);
            // check top
            if (h > maxs[column]) {
                maxs[column] = h;
                tops[column]++;

                const top = getTopClue(clues, column);
                if (top && tops[column] > top) return true;
            }
            // check bottom
            if (row == clues.length / 4 - 1) {
                const bottom = getBottomClue(clues, column);
                if (!bottom) return false;

                const arr = [];
                for (let j = 0; j <= row; j++) {
                    const x = j < row ? candidatesList[j][indexes[j]][column] : h;
                    arr.push(x);
                }
                if (bottom && bottom != seenFromRight(arr)) return true;
            }
        });
        if (hasError) continue;

        state.mask = mask;
        state.tops = tops;
        state.maxs = maxs;
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
    pruneGridAndMask(grid, mask, n);

    return mask;
}
function cloneState(state) {
    return {
        mask: state.mask.map((row) => row.concat([])),
        tops: state.tops.concat([]),
        maxs: state.maxs.concat([])
    };
}

function pruneGridAndMask(grid, mask, n) {
    while (1) {
        if (findUniqueBit(grid, mask, n)) continue;
        if (findUniqueCol(grid, mask, n)) continue;
        if (findUniqueRow(grid, mask, n)) continue;
        break;
    }
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
