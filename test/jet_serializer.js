var assert = require("assert"),
    Jet_Serializer = require('../bin/jet_serializer');

describe('Jet_Serializer', function(){

    it('should serialize and unserialize empty object', function() {
        var x = {};
        assert.deepEqual(x, Jet_Serializer.parse(Jet_Serializer.stringify(x)));
    });

    it('should serialize and unserialize empty array', function() {
        var x = [];
        assert.deepEqual(x, Jet_Serializer.parse(Jet_Serializer.stringify(x)));
    });

    it('should serialize and unserialize object', function() {
        var x = {number:5, string:"", subObject: {}, null_: null};
        assert.deepEqual(x, Jet_Serializer.parse(Jet_Serializer.stringify(x)));
    });

    it('should restore dates', function() {
        var x = new Date(), x2 = {x: new Date()};
        assert(x2, Jet_Serializer.parse(Jet_Serializer.stringify(x2)));
        assert(x, Jet_Serializer.parse(Jet_Serializer.stringify(x)));
    });

    it('should restore RegExp\'s', function() {
        var x = /test/i, x2 = {x: /test/m};
        assert(x2, Jet_Serializer.parse(Jet_Serializer.stringify(x2)));
        assert(x, Jet_Serializer.parse(Jet_Serializer.stringify(x)));
    });

    it('should serialize and unserialize object with recursive ref', function() {
        var x = {number:5, string:"", subObject: {}, null_: null}, xRes;
        x.x = x;
        x.x2 = x;
        xRes = Jet_Serializer.parse(Jet_Serializer.stringify(x));
        assert.equal(xRes, xRes.x);
        assert.equal(xRes.x, xRes.x2);
    });

    it('should serialize and unserialize array', function() {
        var x = [5, "", {}, null];
        assert.deepEqual(x, Jet_Serializer.parse(Jet_Serializer.stringify(x)));
    });

    it('should ignore functions in object', function() {
        var x = {fn: function (){}, x: 5};
        assert.deepEqual({x: 5}, Jet_Serializer.parse(Jet_Serializer.stringify(x)));
    });
    it('should replace functions to null in array', function() {
        var x = [5, "", {}, null, function () {}, 3];
        assert.deepEqual([5, "", {}, null, null, 3], Jet_Serializer.parse(Jet_Serializer.stringify(x)));
    });

    it('should call $serialize', function() {
        var xSer = {number: 5},
            x = {toJSON: function () {return xSer;}};
        assert.deepEqual(Jet_Serializer.stringify(xSer), Jet_Serializer.stringify(x));
    });

    it('should call toJSON for inner objects', function() {
        var xSer = {number: 5},
            x = {deep: {toJSON: function () {return xSer;}}};
        assert.deepEqual(Jet_Serializer.stringify({deep: xSer}), Jet_Serializer.stringify(x));
    });

    it('should restore classes', function() {
        function d () {
            this.x = 5;
        }

        Jet_Serializer.registerClass('d', d);

        var x = new d(),
            xRestored = Jet_Serializer.parse(Jet_Serializer.stringify(x));
        assert(xRestored instanceof d);
        it('should restore class properties', function() {
            assert.equal(xRestored.x, x.x);
        });
    });

    it('should call $wakeup for objects', function() {
        function dw () {}
        dw.prototype.$wakeup = function () {this.wakedUp = true};
        Jet_Serializer.registerClass('dw', dw);
        var x = new dw(),
            xRestored = Jet_Serializer.parse(Jet_Serializer.stringify(x));
        assert(xRestored instanceof dw);
        assert(xRestored.wakedUp, true);
    });
});
