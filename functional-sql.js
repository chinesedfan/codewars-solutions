class SQL {
    constructor() {
        this.filters = [];
        this.groupedFilters = [];

        this.executed = false;
    }

    select(fn) {
        if (this.selectFn) throw new Error('Duplicate SELECT');

        this.selectFn = fn;
        return this;
    }
    from() {
        if (this.input) throw new Error('Duplicate FROM');

        const inputs = Array.prototype.slice.call(arguments, 0);
        if (inputs.length > 1) {
            this.input = inputs.map((_, i) => inputs.map((input) => input[i]));
        } else {
            this.input = inputs[0] || [];
        }
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
        result = this.input;
        // where
        this.filters.forEach((filter) => {
            result = result.filter(filter);
        });
        // groupby
        // having
        // orderby

        // select
        if (this.selectFn) {
            result = result.map(this.selectFn);
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
}

var query = function() {
    return new SQL();
};
