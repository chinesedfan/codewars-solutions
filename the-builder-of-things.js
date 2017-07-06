const handler = {
    get: function(target, key, receiver) {
        switch (key) {
        case 'is_a':
            target.is_a_flag = true;
            return target.proxy;
        default:
            if (target.is_a_flag) {
                target.is_a_flag = false;
                target.is_a_keys.push('is_a_' + key);
                return target;
            } else if (target.is_a_keys.indexOf(key) >= 0) {
                return true;
            } else {
                return Reflect.get(target, key, receiver);
            }
        }
    }
};

class RealThing {
    constructor(name) {
        this.name = name;
        this.proxy = new Proxy(this, handler);

        this.is_a_flag = false;
        this.is_a_keys = [];
    }
}

function Thing(name) {
    return new RealThing(name).proxy;
}
