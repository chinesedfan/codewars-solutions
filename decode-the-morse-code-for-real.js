var divideIntoGroups = function(items, centers) {
    var maps = centers.map((c) => {
        return {}; // length -> count
    });
    var sum = items.reduce((result, item) => {
        var n = item.size;
        var index = centers.findIndex((c, i) => i == centers.length - 1 || n <= (centers[i] + centers[i + 1]) / 2);
        // no 1s whose length is 7
        if (index == 2 && item.ch == '1') {
            index = 1;
        }
        var delta = Math.abs(n - centers[index]);
        maps[index][n] = maps[index][n] ? maps[index][n] + 1 : 1;
        return result + delta * delta;
    }, 0);
    return {maps: maps, sum: sum};
};
var getNewCenter = function(map) {
    var sum = 0, count = 0;
    for (var s in map) {
        var c = map[s];
        sum += s * c;
        count += c;
    }
    return count ? sum / count : 0;
};

var kmeans = function(items, centers) {
    var oldState = divideIntoGroups(items, centers);

    var limit = 100;
    while (limit--) {
        centers = oldState.maps.map(getNewCenter);

        var newState = divideIntoGroups(items, centers);
        if (Math.abs(oldState.sum - newState.sum) < 0.01) break;
        oldState = newState;
    }
    return newState.maps;
};

var decodeBitsAdvanced = function(bits){
    // trim 0s
    bits = bits.replace(/^0+/, '').replace(/0+$/, '');
    if (!bits) return '';

    // count 0s and 1s
    var items = bits.match(/([01])\1*/g).map((match) => {
        return {
            ch: match[0],
            size: match.length
        };
    });

    // k-means
    var centers = [1, 3, 7];
    var sizeMaps = kmeans(items, centers);

    // real centers should in the middle
    var avgs = sizeMaps.map((m) => {
        var keys = Object.keys(m).map((s) => parseInt(s));
        return (Math.min.apply(Math, keys) + Math.max.apply(Math, keys)) / 2;
    });
    var valid = avgs.filter((val) => val).length;

    // 2 limits to separate into 3 groups
    var limit1, limit2;
    if (valid == 3) {
        limit1 = (avgs[0] + avgs[1]) / 2;
        limit2 = (avgs[1] + avgs[2]) / 2;
    } else if (valid == 2) {
        var min = avgs[0] || avgs[1];
        var max = avgs[2] || avgs[1];
        if (max >= min * (3 + 7) / 2) {
            // 1 and 7
            var avg3 = (min + max) * 3 / (1 + 7);
            limit1 = (min + avg3) / 2;
            limit2 = (avg3 + max) / 2;
        } else if (max >= min * (1 + 3) / 2) {
            // 1 and 3
            limit1 = (min + max) / 2;
            limit2 = max;
        } else {
            // 3 and 7
            limit1 = min;
            limit2 = (min + max) / 2;
        }
    } else if (valid == 1) {
        limit1 = avgs[0] || avgs[1] || avgs[2];
    }

    return bits.replace(/0+|1+/g, (match) => {
        if (match[0] == '1') {
            return match.length <= limit1 ? '.' : '-';
        } else {
            if (match.length <= limit1) return '';
            if (match.length <= limit2) return ' ';
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
