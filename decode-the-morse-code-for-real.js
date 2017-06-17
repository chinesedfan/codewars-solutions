var divideIntoGroups = function(nums, centers) {
    var gs = centers.map((c) => {
        return {};
    });
    var sum = nums.reduce((sum, n) => {
        var delta;
        centers.some((c, i) => {
            if (i == centers.length - 1 || n < (centers[i] + centers[i + 1]) / 2) {
                delta = Math.abs(n - c);
                gs[i][n] = 1;
                return true;
            }
        });
        return sum + delta * delta;
    }, 0);
    return {gs: gs, sum: sum};
};
var getNewCenter = function(nums) {
    if (!nums.length) return -1;
    return nums.map((s) => parseInt(s)).reduce((sum, n) => sum + n, 0) / nums.length;
};

var kmeans = function(nums, centers) {
    var oldState = divideIntoGroups(nums, centers);

    while (1) {
        centers = oldState.gs.map((group) => getNewCenter(Object.keys(group)))
                .map((c, i, list) => {
                    // fix empty groups have no center
                    return c < 0 ? (list[i - 1] + list[i + 1]) / 2 : c;
                });

        var newState = divideIntoGroups(nums, centers);
        if (Math.abs(oldState.sum - newState.sum) < 0.01) break;
        oldState = newState;
    }
    return newState.gs;
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
    var count0 = Object.keys(map0).sort((a, b) => a - b).map((k) => parseInt(k));
    var count1 = Object.keys(map1).sort((a, b) => a - b).map((k) => parseInt(k));

    // determinate how many centers(ignore only 3 & 7)
    var min = count0.length ? Math.min(count0[0], count1[0]) : count1[0];
    var max = count0.length
            ? Math.max(count0[count0.length - 1], count1[count1.length - 1])
            : count1[count1.length - 1];
    var centers;
    if (max >= min * (3 + 7) / 2) {
        min = max / 7;
        centers = [min, min * 3, min * 7];
    } else if (max >= min * (1 + 3) / 2) {
        min = max / 3;
        centers = [min, min * 3];
    } else {
        centers = [min];
    }

    // k-means
    var counts = Object.keys(Object.assign({}, map0, map1)).map((k) => parseInt(k));
    var gs = kmeans(counts, centers);

    return bits.replace(/0+|1+/g, (match) => {
        if (match[0] == '1') {
            return gs[0][match.length] ? '.' : '-';
        } else {
            if (gs[0][match.length]) return '';
            if (gs[1][match.length]) return ' ';
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
