function findPosition(num) {
    var indexes = [];
    for (var step = 1; step <= num.length; step++) {
        for (var start = 0; start < step; start++) {
            var index = tryToParse(num, start, step);
            if (index >= 0) indexes.push(index);
        }
    }

    if (!indexes.length) {
        // special case, for all is zero
        return getTotalLength(parseInt('1' + num)) + 1;
    }

    return Math.min.apply(Math, indexes);
}

function tryToParse(num, start, step) {
    var n;
    if (start + step <= num.length) {
        n = parseInt(num.substr(start, step));
    } else {
        // |----num----|
        // |-p2-|--p1--|
        var p1 = num.substr(start);
        var p2 = num.substr(0, start);
        var common = p1.length + p2.length - step;

        // |---step----|
        // |-xx-|--p2--|, n - 1
        // |--p1--|-xx-|, n
        var chs = p2.substr(common).split('');
        if (chs.every((c) => c == '9')) {
            p1 = p1 + chs.map(() => '0').join('');
            n = parseInt(p1);
        } else {
            p1 = p1 + p2.substr(common);
            n = parseInt(p1);
            n++;
        }
        if (String(n - 1).substr(step - p2.length) != p2) return -1;
    }

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
