function callNextMethod(methodInfo) {
    var args = Array.prototype.slice.call(arguments, 1);
    // call the next method or throw an error
    var methods = methodInfo.methods[methodInfo.combination];
    if (++methodInfo.index < methods.length) {
        return methods[methodInfo.index].apply(methodInfo, args);
    } else if (methodInfo.combination == 'around') {
        if (!methodInfo.methods.primary.length) {
            // FIXME: not mentioned requirement
            throw (`No next method found for ${methodInfo.name} in ${methodInfo.combination}`);
        }
        methodInfo.combination = 'primary';
        return methodInfo.primaryMethod.apply(methodInfo, args);
    } else if (methodInfo.combination == 'primary') {
        throw (`No next method found for ${methodInfo.name} in ${methodInfo.combination}`);
    }
}

function defgeneric(name) {
    var methods = {
        before: [],
        primary: [],
        after: [],
        around: []
    };
    var cache = {};

    var generic = function() {
        // One possible implementation of the generic function
        var args = Array.prototype.slice.call(arguments, 0);
        var method = generic.findMethod.apply(this, args);
        return method.apply(this, args);
    };

    generic.defmethod = function(discriminator, fn, combination) {
        combination = combination || 'primary';
        // XXX: assign the new method
        cache = {};
        methods[combination].push({discriminator, fn});
        return generic;
    };

    generic.removeMethod = function(discriminator, combination) {
        combination = combination || 'primary';
        // XXX: remove the method
        cache = {};
        var index = methods[combination].find((item) => item.discriminator == discriminator);
        methods[combination].splice(index, 1);
        return generic;
    };

    generic.findMethod = function() {
        // XXX: return the function that this generic would invoke
        // given the Arguments list at the time of invocation.
        var args = Array.prototype.slice.call(arguments, 0);
        var types = getTypes(args);
        var key = types.join('-');
        if (cache[key]) return cache[key];

        var around = filterByArgs(methods.around, args).sort(sortByMostSpecific).map((item) => item.fn);
        var before = filterByArgs(methods.before, args).sort(sortByMostSpecific).map((item) => item.fn);
        var primary = filterByArgs(methods.primary, args).sort(sortByMostSpecific).map((item) => item.fn);
        var after = filterByArgs(methods.after, args).sort(sortByLeastSpecific).map((item) => item.fn);
        if (!(around.length || before.length || primary.length || after.length)) {
            throw ('No method found for append with args: ' + types.join(','));
        }

        var methodInfo = {
            context: this,
            name: name,
            methods: {primary, around},
            index: 0
        };
        methodInfo.primaryMethod = function() {
            var args = Array.prototype.slice.call(arguments, 0);
            before.forEach((fn) => fn.apply(this, args));

            var result;
            if (primary.length) {
                methodInfo.combination = 'primary';
                methodInfo.index = 0;
                result = primary[0].apply(this, args);
            } else {
                throw new Error('No around and primary methods');
            }
            after.forEach((fn) => fn.apply(this, args));
            return result;
        };

        if (around.length) {
            return cache[key] = () => {
                // FIXME: wired to use it as context
                methodInfo.combination = 'around';
                methodInfo.index = 0;
                return around[0].apply(methodInfo, args);
            };
        } else {
            return cache[key] = methodInfo.primaryMethod.bind(methodInfo);
        }
    };

    return generic;
}

function filterByArgs(methods, args) {
    return methods.map((item) => {
        var types = item.discriminator.split(',');
        var rules = args.map((a, i) => getMatchedRule(a, types[i]));
        return Object.assign({rules}, item);
    }).filter((item) => item.rules.every((r) => r >= 0));
}

function sortByMostSpecific(a, b) {
    return iterateeByRules(a.rules, b.rules);
}
function sortByLeastSpecific(a, b) {
    return -sortByMostSpecific(a, b);
}
function iterateeByRules(rules1, rules2) {
    for (var i = 0; i < rules1.length; i++) {
        if (rules1[i] == rules2[i]) continue;

        return rules1[i] - rules2[i];
    }
    return 1; // wired, if the same, swap
}

function getTypes(args) {
    return args.map((a) => {
        if (a instanceof Object) {
            return a.constructor.name;
        } else if (a === null) {
            return 'null';
        } else {
            return typeof a;
        }
    });
}
function getMatchedRule(a, t) {
    if (a instanceof Object) {
        if (a.constructor.name === t) return 1;

        if (a.__proto__ !== a) {
            var rule = getMatchedRule(a.__proto__, t);
            if (rule == 1 || rule == 2) return 2;
        }
    }
    if (a === null && t === 'null') return 3;
    if (typeof a === t) return 4;
    if (t === '*') return 5;

    return -1;
}
