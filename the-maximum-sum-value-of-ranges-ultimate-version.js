function maxSum(arr, ranges) {
    const sum = [];
    arr.forEach((val, i) => {
        if (i == 0) {
            sum[i] = val;
        } else {
            sum[i] = sum[i - 1] + val;
        }
    });

    const bs = [...new Set(
        ranges.map(([b, e, v]) => b)
    )].sort((a, b) => a - b);
    const bvs = bs.map(() => 0);
    const r = createNode(bvs, 0, bs.length - 1);

    let m = -Infinity;
    ranges.forEach(([b, e, v]) => {
        const ib = binarySearch(bs, 0, bs.length - 1, (x) => bs[x] < b) + 1;
        const ie = binarySearch(bs, 0, bs.length - 1, (x) => bs[x] <= e);

        updateNode(r, ib, v - arr[bs[ib]]);

        let s = sum[e] - (sum[b - 1] || 0);
        s += findSum(r, ib, ie);

        m = Math.max(m, s);
    });

    return m;
}

function binarySearch(arr, beg, end, fn) {
    while (beg <= end) {
        const mid = Math.floor((beg + end) / 2);
        if (fn(mid)) {
            beg = mid + 1;
        } else {
            end = mid - 1;
        }
    }
    return end;
}
function createNode(arr, left, right) {
    const node = {left, right, sum: arr[left]};
    if (left === right) return node;

    const mid = Math.ceil((left + right) / 2);
    node.leftChild = createNode(arr, left, mid - 1);
    node.rightChild = createNode(arr, mid, right);
    node.sum = node.leftChild.sum + node.rightChild.sum;
    return node;
}
function updateNode(node, idx, val) {
    if (node.left === node.right) {
        node.sum = val;
        return;
    }

    const mid = Math.ceil((node.left + node.right) / 2);
    if (idx < mid) {
        updateNode(node.leftChild, idx, val);
    } else {
        updateNode(node.rightChild, idx, val);
    }
    node.sum = node.leftChild.sum + node.rightChild.sum;
}
function findSum(r, beg, end) {
    if (r.left === beg && r.right === end) return r.sum;

    const mid = Math.ceil((r.left + r.right) / 2);
    if (beg >= mid) {
        return findSum(r.rightChild, beg, end);
    } else if (end < mid) {
        return findSum(r.leftChild, beg, end);
    } else {
        return findSum(r.leftChild, beg, mid - 1) + findSum(r.rightChild, mid, end);
    }
}
