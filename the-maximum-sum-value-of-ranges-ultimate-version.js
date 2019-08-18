function maxSum(arr, ranges) {
    const r = createNode(arr, 0, arr.length - 1);

    let m = -Infinity;
    ranges.forEach(([beg, end, val]) => {
        updateNode(r, beg, val);
        m = Math.max(m, findSum(r, beg, end));
    });

    return m;
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
    if (r.left === r.right) return r.sum;

    const mid = Math.ceil((r.left + r.right) / 2);
    if (beg >= mid) {
        return findSum(r.rightChild, beg, end);
    } else if (end < mid) {
        return findSum(r.leftChild, beg, end);
    } else {
        return findSum(r.leftChild, beg, mid - 1) + findSum(r.rightChild, mid, end);
    }
}
