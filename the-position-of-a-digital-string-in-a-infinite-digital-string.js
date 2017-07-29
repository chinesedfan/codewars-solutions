function findPosition(num) {
    var index = -1;
    for (var step = 1; step <= num.length; step++) {
        for (var start = 0; start < step; start++) {
            index = tryToParse(num, start, step);
            if (index >= 0) return index;
        }
    }
    return index;
}

function tryToParse(num, start, step) {
    var n = parseInt(num.substr(start, step));
    var tokens = [];
    var len = 0;

    if (start) {
        var prev = String(n - 1);
        tokens.push(prev.substr(prev.length - start));
        len += start;
    }

    var x = n;
    while (len < num.length) {
        var str = String(x);
        if (str.length + len > num.length) {
            tokens.push(str.substr(0, num.length - len));
            len += num.length - len;
        } else {
            tokens.push(str);
            len += str.length;
        }
        x++;
    }

    if (tokens.join('') == num) {
        var total = getTotalLength(n);
        return total - start;
    } else {
        return -1;
    }
}

function getTotalLength(n) {
    // not include n
    var total = 0;
    var len = 1;
    var x = 10;

    while (n > x) {
        total += len * (x - x / 10);
        x *= 10;
        len++;
    }

    total += len * (n - x / 10);
    return total;
}
