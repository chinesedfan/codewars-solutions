var calculateOffset = function(counts, rate) {
    return counts.reduce((sum, c) => {
        if (c < rate * (1 + 3) / 2) sum += Math.abs(c - rate);
        else if (c < rate * (3 + 7) / 2) sum += Math.abs(c - rate * 3);
        else sum += Math.abs(c - rate * 7);
        return sum;
    }, 0);
};

var determinateRate = function(counts, min, max, minOffset, maxOffset) {
    while (Math.abs(max - min) > 0.0001) {
        var mid = (min + max) / 2;
        var midOffset = calculateOffset(counts, mid);
        if (minOffset < maxOffset) {
            max = mid;
            maxOffset = midOffset;
        } else {
            min = mid;
            minOffset = midOffset;
        }
    }
    return min;
};

var decodeBitsAdvanced = function(bits){
    // trim 0s
    bits = bits.replace(/^0+/, '').replace(/0+$/, '');
    // count 0s and 1s
    var map0 = {}, map1 = {};
    bits.replace(/0+|1+/g, (match) => {
        var map = match[0] == '0' ? map0 : map1;
        map[match.length] = 1;
        return match;
    });
    // dividing rates into groups(not consider only g3 and g7)
    var count0 = Object.keys(map0).sort((a, b) => a - b).map((k) => parseInt(k));
    var count1 = Object.keys(map1).sort((a, b) => a - b).map((k) => parseInt(k));
    // console.log(JSON.stringify(count0));
    // console.log(JSON.stringify(count1));
    var min = count0.length ? Math.min(count0[0], count1[0]) : count1[0];
    var max = count0.length
            ? Math.max(count0[count0.length - 1], count1[count1.length - 1])
            : count1[count1.length - 1];
    if (max >= min * (3 + 7) / 2) max /= 7;
    else if (max >= min * (1 + 3) / 2) max /= 3;

    var counts = Object.keys(Object.assign({}, map0, map1)).map((k) => parseInt(k));
    var rate = determinateRate(counts, min, max, calculateOffset(counts, min), calculateOffset(counts, max));
    // console.log(min, max, rate);

    var g1 = {}, g3 = {}, g7 = {};
    count0.concat(count1).forEach((c) => {
        if (c < rate * (1 + 3) / 2) g1[c] = 1;
        else if (c < rate * (3 + 7) / 2) g3[c] = 1;
        else g7[c] = 1;
    });
    // console.log(JSON.stringify(g1));
    // console.log(JSON.stringify(g3));
    // console.log(JSON.stringify(g7));

    return bits.replace(/0+|1+/g, (match) => {
        if (match[0] == '1') {
            return g1[match.length] ? '.' : '-';
        } else {
            if (g1[match.length]) return '';
            if (g3[match.length]) return ' ';
            return '   ';
        }
    });
};

var decodeMorse = function(morseCode){
    // Copy from previous kata
    return morseCode.trim().split('   ').map((codes) => {
        return codes.split(' ').map((c) => MORSE_CODE[c]).join('');
    }).join(' ');
};
