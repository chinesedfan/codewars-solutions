class SQL {
    constructor() {
        this.filters = [];
        this.groupedFilters = [];

        this.executed = false;
        this.identical = (x) => x;
    }

    select(fn) {
        if (this.selectFn) throw new Error('Duplicate SELECT');

        this.selectFn = fn || this.identical;
        return this;
    }
    from() {
        if (this.input) throw new Error('Duplicate FROM');

        const inputs = Array.prototype.slice.call(arguments, 0);
        this.input = inputs.length <= 1 ? inputs[0].map(this.identical) : inputs.reverse().reduce((result, input, i) => {
            if (!i) return input.map((item) => [item]);

            let newResult = [];
            input.forEach((item) => {
                newResult = newResult.concat(result.map((arr) => [item].concat(arr)));
            });
            return newResult;
        }, []);
        return this;
    }
    where() {
        const filters = Array.prototype.slice.call(arguments, 0);
        this.filters.push(this.createOrFunction(filters));
        return this;
    }
    orderBy(fn) {
        if (this.orderByFn) throw new Error('Duplicate ORDERBY');

        this.orderByFn = fn;
        return this;
    }
    groupBy() {
        if (this.groupByFnList) throw new Error('Duplicate GROUPBY');

        this.groupByFnList = Array.prototype.slice.call(arguments, 0);
        return this;
    }
    having() {
        const filters = Array.prototype.slice.call(arguments, 0);
        this.groupedFilters.push(this.createOrFunction(filters));
        return this;
    }
    execute() {
        if (this.executed) return this.result;

        let result;
        // from
        result = this.input || [];
        // where
        result = this.doFilter(result, this.filters);
        // groupby
        if (this.groupByFnList) {
            result = this.doGroupBy(result, 0);
        } else {
            // orderby
            if (this.orderByFn) {
                result.sort(this.orderByFn);
            }
            // select
            if (this.selectFn) {
                result = result.map(this.selectFn);
            }
        }

        // done
        this.executed = true;
        this.result = result;
        return this.result;
    }

    createOrFunction(fns) {
        if (fns.length == 1) return fns[0];

        return (item) => fns.some((f) => f(item));
    }
    doFilter(result, filters) {
        filters.forEach((fn) => {
            result = result.filter(fn);
        });
        return result;
    }
    doGroupBy(result, i) {
        const last = i == this.groupByFnList.length - 1;

        const map = {};
        result.forEach((item) => {
            const key = this.groupByFnList[i](item);
            map[key] = map[key] || [key, []];
            map[key][1].push(item);
        });

        result = [];
        for (let key in map) {
            result.push([map[key][0], last ? map[key][1] : this.doGroupBy(map[key][1], i + 1)]);
        }

        if (last) {
            // having
            result = this.doFilter(result, this.groupedFilters);
            // orderby
            if (this.orderByFn) {
                result.sort(this.orderByFn);
            }
            // select
            if (this.selectFn) {
                result = result.map(this.selectFn);
            }
        }
        return result;
    }
}

var query = function() {
    return new SQL();
};
