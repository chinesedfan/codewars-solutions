function solvePuzzle(clues) {
    const n = clues.length / 4;
    const ps = generatePermutations(n);
    const seenMap = dividedIntoGroups(ps);

    const grid = new Array(n).fill(0).map(() => new Array(n).fill(0));
    // limit some possible values
    const mask = fillGridForX(grid, n, clues);

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

function fillGridForX(grid, x, clues) {
    const n = clues.length / 4;
    const done = n - x;

    const maskAll = Math.pow(2, n) - 1; // every bit is 1
    const maskX = 1 << x - 1;
    const mask = grid.map((row) => row.map((val) => val ? ~(1 << val - 1) & maskAll : 0));

    let i, j, indexes;
    // check by row
    for (i = 0; i < n; i++) {
        const left = getLeftClue(clues, i) - done;
        const right = getRightClue(clues, i) - done;
        for (j = 0; j < n; j++) {
            if (left == x) {
                mask[i][j] = ~(1 << j) & maskAll;
                maskTheSameLine(mask, i, j, j + 1);
            } else if (right == x) {
                mask[i][j] = ~(1 << n - j - 1) & maskAll;
                maskTheSameLine(mask, i, j, n - j);
            } else if (shouldMaskForX(j, n, left, right)) {
                mask[i][j] |= maskX;
            }
        }
    }

    // check by column
    for (j = 0; j < n; j++) {
        const top = getTopClue(clues, j) - done;
        const bottom = getBottomClue(clues, j) - done;
        for (i = 0; i < n; i++) {
            if (top == x) {
                mask[i][j] = ~(1 << i) & maskAll;
                maskTheSameLine(mask, i, j, i + 1);
            } else if (bottom == x) {
                mask[i][j] = ~(1 << n - i - 1) & maskAll;
                maskTheSameLine(mask, i, j, n - i);
            } else if (shouldMaskForX(i, n, top, bottom)) {
                mask[i][j] |= maskX;
            }
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
                if (!(mask[i][j] & maskX)) indexes.push(j);
            }
            if (indexes.length == 1) {
                j = indexes[0];
                if (grid[i][j] == x) continue;
                found = true;
                confirmed++;

                grid[i][j] = x;
                mask[i][j] = ~maskX & maskAll;
                maskTheSameLine(mask, i, j, x);
                break;
            }
        }
        if (found) continue;

        // update the corresponding row
        for (j = 0; j < n; j++) {
            indexes = [];
            for (i = 0; i < n; i++) {
                if (!(mask[i][j] & maskX)) indexes.push(i);
            }
            if (indexes.length == 1) {
                i = indexes[0];
                if (grid[i][j] == x) continue;
                found = true;
                confirmed++;

                grid[i][j] = x;
                mask[i][j] = ~maskX & maskAll;
                maskTheSameLine(mask, i, j, x);
                break;
            }
        }
        if (found) continue;
    }

    // bit x means it can not be x, and x = 1 ~ n
    return mask;
}
function shouldMaskForX(x, n, left, right) {
    return (left == 1 && !!x) || (right == 1 && x != n - 1) // only 1, should be the first
            || x < left - 1 || n - 1 - x < right - 1;       // should reserve some slots
}
function maskTheSameLine(mask, i, j, x) {
    const n = mask.length;

    let k;
    for (k = 0; k < n; k++) {
        if (k != j) mask[i][k] |= 1 << x - 1;
        if (k != i) mask[k][j] |= 1 << x - 1;
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

