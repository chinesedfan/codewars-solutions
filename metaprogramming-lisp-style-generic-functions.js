function callNextMethod(methodInfo) {
    var args = Array.prototype.slice.call(arguments, 1);
    // call the next method or throw an error
    // TODO:
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
        var key = getCacheKey(args);
        if (cache[key]) return cache[key];

        var around = filterByArgs(methods.around, args).sort(sortByMostSpecific).map((item) => item.fn);
        if (around.length) {
            return cache[key] = () => {
                return around[0].apply(this, args);
            };
        }

        var before = filterByArgs(methods.before, args).sort(sortByMostSpecific).map((item) => item.fn);
        var primary = filterByArgs(methods.primary, args).sort(sortByMostSpecific).map((item) => item.fn);
        var after = filterByArgs(methods.after, args).sort(sortByLeastSpecific).map((item) => item.fn);

        return cache[key] = () => {
            before.forEach((fn) => fn.apply(this, args));

            var result;
            if (primary.length) {
                result = primary[0].apply(this, args);
            } else {
                throw new Error('No around and primary methods');
            }
            after.forEach((fn) => fn.apply(this, args));
            return result;
        };
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
    return 0;
}

function getCacheKey(args) {
    return args.map((a) => {
        if (a instanceof Object) {
            return a.constructor.name;
        } else if (a === null) {
            return 'null';
        } else {
            return typeof a;
        }
    }).join('-');
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