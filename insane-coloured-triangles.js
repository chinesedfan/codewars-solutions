function triangle(row) {
  let cur = row.split('');
  while (row.length >= 4) {
    let step = 4;
    while (step * 3 - 2 <= row.length) step = step * 3 - 2;

    cur = [];
    for (let i = 0; i + step - 1 < row.length; i++) {
      cur[i] = getNext(row[i] + row[i + step - 1]);
    }

    row = cur;
  }

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
