var util = require('util'), serializer;

module.exports = serializer = {
    classes: {},
    stringify: function (a, space) {
        var prep = a, allObjects = [], refs = [], duplicates = [], tmp;
        // collect double objects
        function avoidRecursion(current, key, parent) {
            var i, iDup, propName, res;
            if ((i = allObjects.indexOf(current)) !== -1) {
                if ((iDup = duplicates.indexOf(current)) === -1) {
                    iDup = duplicates.length;
                    duplicates.push(current);
                    parent[key] = {$ref: iDup};
                    refs[i][0][refs[i][1]] = {$ref: iDup};
                } else {
                    parent[key] = {$ref: iDup};
                }
            } else {
                if (util.isArray(current)) {
                    allObjects.push(current);
                    refs.push([parent, key]);
                    for (i = 0; i < current.length; i++) {
                        res = avoidRecursion(current[i], i, current);
                    }
                } else if (typeof current === 'object') {
                    allObjects.push(current);
                    refs.push([parent, key]);
                    for (propName in current) {
                        if (current.hasOwnProperty(propName)) {
                            res = avoidRecursion(current[propName], propName, current);
                        }
                    }
                }
            }
        }
        tmp = [prep];
        avoidRecursion(prep, 0 , tmp);
        return JSON.stringify({
            $meta: {
                serialize: {
                    me: tmp[0],
                    duplicates: duplicates.length ? duplicates : undefined
                }
            }
        }, function (k, v) {
            var className;
            if (v && typeof v.$serialize === 'function') {
                return v.$serialize();
            }
            if (className = serializer.registeredClassName(v)) {
                var data = util._extend({}, v);
                data.$className = className;
                return data;
            }
            return v;
        }, space);
    },
    parse: function (str) {
        // console.log(str);
        var first = JSON.parse(str), me, duplicates, tmp;
        if (!first.$meta && !first.$meta.serialize) {
            throw new Error('Invalid argument passed');
        }
        me = first.$meta.serialize.me;
        duplicates = first.$meta.serialize.duplicates || [];
        function resolveRecursion(current, key, parent) {
            var i, propName;
            if (current && current.hasOwnProperty('$ref')) {
                parent[key] = duplicates[current.$ref];
            } else {
                if (util.isArray(current)) {
                    for (i = 0; i < current.length; i++) {
                        resolveRecursion(current[i], i, current);
                    }
                } else if (typeof current == 'object' && current !== null) {
                    if (current.$className) {
                        var className = current.$className,
                            ctor = serializer.getConstructorByName(className);
                        delete current.$className;
                        current = parent[key] = util._extend(Object.create(ctor.prototype, {
                            constructor: {
                                value: ctor,
                                enumerable: false,
                                writable: true,
                                configurable: true
                            }
                        }), current);
                    }
                    for (propName in current) {
                        if (current.hasOwnProperty(propName)) {
                            resolveRecursion(current[propName], propName, current);
                        }
                    }
                    if (typeof current.$wakeup === 'function') {
                        current.$wakeup();
                    }
                }
            }
        }
        resolveRecursion(duplicates);
        tmp = [me];
        resolveRecursion(me, 0, tmp);
        return tmp[0];
    },

    registerClass: function (name, constructor) {
        this.classes[name] = constructor;
    },
    registeredClassName: function (instance) {
        for (var name in this.classes) {
            if (instance instanceof this.classes[name]) {
                return name;
            }
        }
        return;
    },
    getConstructorByName: function (name) {
        return this.classes[name];
    }
};
