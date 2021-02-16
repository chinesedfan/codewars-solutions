function triangle(str) {
  return helper(str, str.length, 0);
}

// R  - 2,0
// GB - 1,0 1,1
function helper(str, row, col) {
  if (row < 4) return triangleSimple(str.slice(col, col + row));

  let step = 4;
  while (step * 3 - 2 <= row) step = step * 3 - 2;

  const left = helper(str, row - step + 1, col);
  const right = helper(str, row - step + 1, col + step - 1);
  return getNext(left + right);
}
function triangleSimple(str) {
  let cur = str.split('');
  let next;
  while (cur.length > 1) {
    next = cur.map((c, i) => {
      if (i == cur.length - 1) return '';
      if (c == cur[i + 1]) return c;
      
      return getNext(c + cur[i + 1]);
    }); 
    next.pop();
    cur = next;
  }
  return cur[0];
}
function getNext(temp) {
  if (temp == 'RG' || temp == 'GR' || temp == 'BB') return 'B';
  if (temp == 'RB' || temp == 'BR' || temp == 'GG') return 'G';
  if (temp == 'BG' || temp == 'GB' || temp == 'RR') return 'R';
  throw new Error('never happen');
}

// Discover that if length = 4, the result will only depend on the first and last value
//
// function list(n) {
//   const base = 'RGB'.split('');
//   if (n === 1) return base;

//   const prev = list(n - 1);
//   return base.reduce((ret, ch) => ret.concat(prev.map(p => [ch].concat(p))), [])
// }

// const total = {R: [], G: [], B: []};
// list(4).forEach(x => {
//   const r = triangle(x.join(''));
//   total[r].push(x);
// });
// console.log(total);
