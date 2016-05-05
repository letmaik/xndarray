(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.xndarray = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

exports.default = xndarray;

var _ndarray = require('ndarray');

var _ndarray2 = _interopRequireDefault(_ndarray);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * 
 * @param {NdArray|Array<Array>|Array<TypedArray>|Array<{get,set,length}>} data
 * @param {Array<number>} [options.shape] - Array shape, not used if data is an NdArray
 * @param {Array<String>} [options.names] - Axis names
 * @param {Object|Map} [options.coords] - Coordinates for each axis. Requires options.names.
 *   Values are either an Array, TypedArray, get/set/length object, or NdArray object.
 */
function xndarray(data) {
  var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

  var ndarr = void 0;
  if (data.shape) {
    ndarr = data;
  } else {
    ndarr = (0, _ndarray2.default)(data, options.shape, options.stride, options.offset);
  }
  var names = options.names || ndarr.shape.map(function (_, i) {
    return 'dim_' + i;
  });
  if (ndarr.dimension !== names.length) {
    throw new Error('names array length must match nd dimension ' + ndarr.dimension + ': ' + names);
  }

  var coords = void 0;
  if (options.coords instanceof Map) {
    // already a Map object
    coords = options.coords;
  } else if (options.coords) {
    // a plain object, transform to Map
    coords = new Map(Object.keys(options.coords).map(function (name) {
      return [name, options.coords[name]];
    }));
  } else {
    coords = new Map();
  }
  coords.forEach(function (arr, name) {
    if (!arr.shape) {
      coords.set(name, (0, _ndarray2.default)(arr));
    } else {
      if (arr.dimension !== 1) {
        throw new Error('coordinate arrays must be 1D');
      }
    }
  });

  // add missing dimension coordinates as ascending integers
  var arange = function arange(length) {
    return (0, _ndarray2.default)({ get: function get(i) {
        return i;
      }, length: length });
  };
  zip(names, ndarr.shape).filter(function (_ref) {
    var _ref2 = _slicedToArray(_ref, 1);

    var name = _ref2[0];
    return !coords.has(name);
  }).forEach(function (_ref3) {
    var _ref4 = _slicedToArray(_ref3, 2);

    var name = _ref4[0];
    var size = _ref4[1];
    return coords.set(name, arange(size));
  });

  return new XNdArray(ndarr, names, coords);
}

/**
 * 
 * @param {NdArray} nd
 * @param {Array<String>} names - axis names
 * @param {Map<String,NdArray>} coords - coordinates
 * @returns {XNdArray}
 */

var XNdArray = function () {
  function XNdArray(nd, names, coords) {
    var _this = this;

    _classCallCheck(this, XNdArray);

    this.names = names;
    this.coords = coords;

    var wrapSimple = function wrapSimple(fnname) {
      return function () {
        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        var newnd = nd[fnname].apply(nd, args);
        var newcoords = new Map(coords);
        args.forEach(function (arg, i) {
          return newcoords.set(names[i], coords.get(names[i])[fnname](arg));
        });
        return new XNdArray(newnd, names, newcoords);
      };
    };

    // ndarray methods
    this.get = nd.get.bind(nd);
    this.set = nd.set.bind(nd);
    this.index = nd.index.bind(nd);
    this.lo = wrapSimple('lo');
    this.hi = wrapSimple('hi');
    this.step = wrapSimple('step');
    this.transpose = function () {
      for (var _len2 = arguments.length, axes = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        axes[_key2] = arguments[_key2];
      }

      var newndarr = nd.transpose.apply(nd, axes);
      var newnames = axes.map(function (i) {
        return names[i];
      });
      return new XNdArray(newndarr, newnames, coords);
    };
    this.pick = function () {
      for (var _len3 = arguments.length, indices = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
        indices[_key3] = arguments[_key3];
      }

      var newndarr = nd.pick.apply(nd, indices);
      var isPicked = function isPicked(i) {
        return typeof indices[i] === 'number' && indices[i] >= 0;
      };
      var newnames = names.filter(function (_, i) {
        return !isPicked(i);
      });
      if (newnames.length === 0) {
        // no support for degenerate arrays yet
        return newndarr;
      }
      var newcoords = new Map(coords);
      indices.forEach(function (idx, i) {
        if (isPicked(i)) {
          newcoords.set(names[i], coords.get(names[i]).pick(idx));
        }
      });
      return new XNdArray(newndarr, newnames, newcoords);
    };

    // proxy ndarray properties unchanged
    var _arr = ['data', 'shape', 'stride', 'offset', 'dtype', 'size', 'order', 'dimension'];

    var _loop = function _loop() {
      var prop = _arr[_i];
      Object.defineProperty(_this, prop, {
        get: function get() {
          return nd[prop];
        }
      });
    };

    for (var _i = 0; _i < _arr.length; _i++) {
      _loop();
    }

    extend(this, compileAxisNamesFunctions(nd, names, coords));
  }

  _createClass(XNdArray, [{
    key: 'coordsToString',
    value: function coordsToString(pad) {
      var s = '';
      var maxCoordNameLen = 0;
      this.coords.forEach(function (coordName) {
        return maxCoordNameLen = Math.max(maxCoordNameLen, coordName.length);
      });
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = this.coords[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var _step$value = _slicedToArray(_step.value, 2);

          var coordName = _step$value[0];
          var coordArr = _step$value[1];

          var isDim = this.names.indexOf(coordName) !== -1;
          var coordNamePad = ' '.repeat(maxCoordNameLen - coordName.length);
          var vals = '';
          var maxVals = 10;
          for (var i = 0; i < Math.min(coordArr.size, maxVals); i++) {
            vals += coordArr.get(i) + ' ';
          }
          if (coordArr.size > maxVals) {
            vals += '...';
          }
          s += pad + (isDim ? '*' : ' ') + ' ' + coordName + coordNamePad + '  ' + vals + '\n';
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      return s;
    }
  }, {
    key: 'toString',
    value: function toString() {
      var _this2 = this;

      var dims = this.names.map(function (name, i) {
        return name + ': ' + _this2.shape[i];
      }).join(', ');
      return 'XNdArray (' + dims + ')\n  Coordinates:\n' + this.coordsToString('    ');
    }

    // for console output in chrome/nodejs

  }, {
    key: 'inspect',
    value: function inspect() {
      return this.toString();
    }
  }]);

  return XNdArray;
}();

/**
 * Precompiles functions that accept axis names as arguments for efficiency.
 * 
 * @param {NdArray} ndarr
 * @param {Array<String>} names - axis names
 * @param {Map<String,NdArray>} coords - 1D domain array for each axis
 * @returns {Object}
 */


function compileAxisNamesFunctions(ndarr, names, coords) {
  var fns = {};

  // we don't use obj['${names[i]}'] || ${defaultVal} since we need to handle null/undefined as well
  var indexArgsFn = function indexArgsFn(defaultVal) {
    return names.map(function (_, i) {
      return '\'' + names[i] + '\' in obj ? obj[\'' + names[i] + '\'] : ' + defaultVal;
    }).join(',');
  };

  var idxArgs0 = indexArgsFn('0');
  var _arr2 = [['get'], ['set', ',v'], ['index']];
  for (var _i2 = 0; _i2 < _arr2.length; _i2++) {
    var _arr2$_i = _slicedToArray(_arr2[_i2], 2);

    var fnname = _arr2$_i[0];
    var _arr2$_i$ = _arr2$_i[1];
    var args = _arr2$_i$ === undefined ? '' : _arr2$_i$;

    fns['x' + fnname] = new Function('ndarr', 'return function x' + fnname + ' (obj' + args + ') { return ndarr.' + fnname + '(' + idxArgs0 + args + ') }')(ndarr);
  }

  var idxArgsNull = indexArgsFn('null');
  var _arr3 = ['lo', 'hi', 'step'];

  var _loop2 = function _loop2() {
    var fnname = _arr3[_i3];
    var wrapLoHiStep = function wrapLoHiStep(newndarr, obj) {
      var newcoords = new Map(coords);
      names.forEach(function (name) {
        return newcoords.set(name, coords.get(name)[fnname](obj[name]));
      });
      return new XNdArray(newndarr, names, newcoords);
    };
    fns['x' + fnname] = new Function('ndarr', 'wrap', 'return function x' + fnname + ' (obj) { return wrap(ndarr.' + fnname + '(' + idxArgsNull + '), obj) }')(ndarr, wrapLoHiStep);
  };

  for (var _i3 = 0; _i3 < _arr3.length; _i3++) {
    _loop2();
  }

  // xtranspose input: axis names, e.g. 'x', 'y'
  var namesMap = getNamesIndexMap(names);
  var wrapTranspose = function wrapTranspose(newndarr, newnames) {
    return new XNdArray(newndarr, newnames, coords);
  };
  var xtransposeArgs = names.map(function (_, i) {
    return 'n' + i;
  }).join(',');
  var transposeArgs = names.map(function (_, i) {
    return 'namesMap[n' + i + ']';
  }).join(',');
  fns.xtranspose = new Function('ndarr', 'wrap', 'namesMap', 'return function xtranspose (' + xtransposeArgs + ') { return wrap(ndarr.transpose(' + transposeArgs + '), [' + xtransposeArgs + ']) }')(ndarr, wrapTranspose, namesMap);

  var wrapPick = function wrapPick(newndarr, obj) {
    var isPicked = function isPicked(name) {
      return typeof obj[name] === 'number' && obj[name] >= 0;
    };
    var newnames = names.filter(function (name) {
      return !isPicked(name);
    });
    if (newnames.length === 0) {
      // no support for degenerate arrays yet
      return newndarr;
    }
    var newcoords = new Map(coords);
    names.filter(isPicked).forEach(function (name) {
      return newcoords.set(name, coords.get(name).pick(obj[name]));
    });
    return new XNdArray(newndarr, newnames, newcoords);
  };
  fns.xpick = new Function('ndarr', 'wrap', 'return function xpick (obj) { return wrap(ndarr.pick(' + idxArgsNull + '), obj) }')(ndarr, wrapPick);

  return fns;
}

/**
 * Turn ['x','y'] into {x:0, y:1}.
 */
function getNamesIndexMap(names) {
  var namesMap = {};
  for (var i = 0; i < names.length; i++) {
    namesMap[names[i]] = i;
  }
  return namesMap;
}

function extend(obj, props) {
  for (var _prop in props) {
    obj[_prop] = props[_prop];
  }
}

function zip(a, b) {
  var r = new Array(a.length);
  for (var i = 0; i < a.length; i++) {
    r[i] = [a[i], b[i]];
  }
  return r;
}
module.exports = exports['default'];
},{"ndarray":2}],2:[function(require,module,exports){
var iota = require("iota-array")
var isBuffer = require("is-buffer")

var hasTypedArrays  = ((typeof Float64Array) !== "undefined")

function compare1st(a, b) {
  return a[0] - b[0]
}

function order() {
  var stride = this.stride
  var terms = new Array(stride.length)
  var i
  for(i=0; i<terms.length; ++i) {
    terms[i] = [Math.abs(stride[i]), i]
  }
  terms.sort(compare1st)
  var result = new Array(terms.length)
  for(i=0; i<result.length; ++i) {
    result[i] = terms[i][1]
  }
  return result
}

function compileConstructor(dtype, dimension) {
  var className = ["View", dimension, "d", dtype].join("")
  if(dimension < 0) {
    className = "View_Nil" + dtype
  }
  var useGetters = (dtype === "generic")

  if(dimension === -1) {
    //Special case for trivial arrays
    var code =
      "function "+className+"(a){this.data=a;};\
var proto="+className+".prototype;\
proto.dtype='"+dtype+"';\
proto.index=function(){return -1};\
proto.size=0;\
proto.dimension=-1;\
proto.shape=proto.stride=proto.order=[];\
proto.lo=proto.hi=proto.transpose=proto.step=\
function(){return new "+className+"(this.data);};\
proto.get=proto.set=function(){};\
proto.pick=function(){return null};\
return function construct_"+className+"(a){return new "+className+"(a);}"
    var procedure = new Function(code)
    return procedure()
  } else if(dimension === 0) {
    //Special case for 0d arrays
    var code =
      "function "+className+"(a,d) {\
this.data = a;\
this.offset = d\
};\
var proto="+className+".prototype;\
proto.dtype='"+dtype+"';\
proto.index=function(){return this.offset};\
proto.dimension=0;\
proto.size=1;\
proto.shape=\
proto.stride=\
proto.order=[];\
proto.lo=\
proto.hi=\
proto.transpose=\
proto.step=function "+className+"_copy() {\
return new "+className+"(this.data,this.offset)\
};\
proto.pick=function "+className+"_pick(){\
return TrivialArray(this.data);\
};\
proto.valueOf=proto.get=function "+className+"_get(){\
return "+(useGetters ? "this.data.get(this.offset)" : "this.data[this.offset]")+
"};\
proto.set=function "+className+"_set(v){\
return "+(useGetters ? "this.data.set(this.offset,v)" : "this.data[this.offset]=v")+"\
};\
return function construct_"+className+"(a,b,c,d){return new "+className+"(a,d)}"
    var procedure = new Function("TrivialArray", code)
    return procedure(CACHED_CONSTRUCTORS[dtype][0])
  }

  var code = ["'use strict'"]

  //Create constructor for view
  var indices = iota(dimension)
  var args = indices.map(function(i) { return "i"+i })
  var index_str = "this.offset+" + indices.map(function(i) {
        return "this.stride[" + i + "]*i" + i
      }).join("+")
  var shapeArg = indices.map(function(i) {
      return "b"+i
    }).join(",")
  var strideArg = indices.map(function(i) {
      return "c"+i
    }).join(",")
  code.push(
    "function "+className+"(a," + shapeArg + "," + strideArg + ",d){this.data=a",
      "this.shape=[" + shapeArg + "]",
      "this.stride=[" + strideArg + "]",
      "this.offset=d|0}",
    "var proto="+className+".prototype",
    "proto.dtype='"+dtype+"'",
    "proto.dimension="+dimension)

  //view.size:
  code.push("Object.defineProperty(proto,'size',{get:function "+className+"_size(){\
return "+indices.map(function(i) { return "this.shape["+i+"]" }).join("*"),
"}})")

  //view.order:
  if(dimension === 1) {
    code.push("proto.order=[0]")
  } else {
    code.push("Object.defineProperty(proto,'order',{get:")
    if(dimension < 4) {
      code.push("function "+className+"_order(){")
      if(dimension === 2) {
        code.push("return (Math.abs(this.stride[0])>Math.abs(this.stride[1]))?[1,0]:[0,1]}})")
      } else if(dimension === 3) {
        code.push(
"var s0=Math.abs(this.stride[0]),s1=Math.abs(this.stride[1]),s2=Math.abs(this.stride[2]);\
if(s0>s1){\
if(s1>s2){\
return [2,1,0];\
}else if(s0>s2){\
return [1,2,0];\
}else{\
return [1,0,2];\
}\
}else if(s0>s2){\
return [2,0,1];\
}else if(s2>s1){\
return [0,1,2];\
}else{\
return [0,2,1];\
}}})")
      }
    } else {
      code.push("ORDER})")
    }
  }

  //view.set(i0, ..., v):
  code.push(
"proto.set=function "+className+"_set("+args.join(",")+",v){")
  if(useGetters) {
    code.push("return this.data.set("+index_str+",v)}")
  } else {
    code.push("return this.data["+index_str+"]=v}")
  }

  //view.get(i0, ...):
  code.push("proto.get=function "+className+"_get("+args.join(",")+"){")
  if(useGetters) {
    code.push("return this.data.get("+index_str+")}")
  } else {
    code.push("return this.data["+index_str+"]}")
  }

  //view.index:
  code.push(
    "proto.index=function "+className+"_index(", args.join(), "){return "+index_str+"}")

  //view.hi():
  code.push("proto.hi=function "+className+"_hi("+args.join(",")+"){return new "+className+"(this.data,"+
    indices.map(function(i) {
      return ["(typeof i",i,"!=='number'||i",i,"<0)?this.shape[", i, "]:i", i,"|0"].join("")
    }).join(",")+","+
    indices.map(function(i) {
      return "this.stride["+i + "]"
    }).join(",")+",this.offset)}")

  //view.lo():
  var a_vars = indices.map(function(i) { return "a"+i+"=this.shape["+i+"]" })
  var c_vars = indices.map(function(i) { return "c"+i+"=this.stride["+i+"]" })
  code.push("proto.lo=function "+className+"_lo("+args.join(",")+"){var b=this.offset,d=0,"+a_vars.join(",")+","+c_vars.join(","))
  for(var i=0; i<dimension; ++i) {
    code.push(
"if(typeof i"+i+"==='number'&&i"+i+">=0){\
d=i"+i+"|0;\
b+=c"+i+"*d;\
a"+i+"-=d}")
  }
  code.push("return new "+className+"(this.data,"+
    indices.map(function(i) {
      return "a"+i
    }).join(",")+","+
    indices.map(function(i) {
      return "c"+i
    }).join(",")+",b)}")

  //view.step():
  code.push("proto.step=function "+className+"_step("+args.join(",")+"){var "+
    indices.map(function(i) {
      return "a"+i+"=this.shape["+i+"]"
    }).join(",")+","+
    indices.map(function(i) {
      return "b"+i+"=this.stride["+i+"]"
    }).join(",")+",c=this.offset,d=0,ceil=Math.ceil")
  for(var i=0; i<dimension; ++i) {
    code.push(
"if(typeof i"+i+"==='number'){\
d=i"+i+"|0;\
if(d<0){\
c+=b"+i+"*(a"+i+"-1);\
a"+i+"=ceil(-a"+i+"/d)\
}else{\
a"+i+"=ceil(a"+i+"/d)\
}\
b"+i+"*=d\
}")
  }
  code.push("return new "+className+"(this.data,"+
    indices.map(function(i) {
      return "a" + i
    }).join(",")+","+
    indices.map(function(i) {
      return "b" + i
    }).join(",")+",c)}")

  //view.transpose():
  var tShape = new Array(dimension)
  var tStride = new Array(dimension)
  for(var i=0; i<dimension; ++i) {
    tShape[i] = "a[i"+i+"]"
    tStride[i] = "b[i"+i+"]"
  }
  code.push("proto.transpose=function "+className+"_transpose("+args+"){"+
    args.map(function(n,idx) { return n + "=(" + n + "===undefined?" + idx + ":" + n + "|0)"}).join(";"),
    "var a=this.shape,b=this.stride;return new "+className+"(this.data,"+tShape.join(",")+","+tStride.join(",")+",this.offset)}")

  //view.pick():
  code.push("proto.pick=function "+className+"_pick("+args+"){var a=[],b=[],c=this.offset")
  for(var i=0; i<dimension; ++i) {
    code.push("if(typeof i"+i+"==='number'&&i"+i+">=0){c=(c+this.stride["+i+"]*i"+i+")|0}else{a.push(this.shape["+i+"]);b.push(this.stride["+i+"])}")
  }
  code.push("var ctor=CTOR_LIST[a.length+1];return ctor(this.data,a,b,c)}")

  //Add return statement
  code.push("return function construct_"+className+"(data,shape,stride,offset){return new "+className+"(data,"+
    indices.map(function(i) {
      return "shape["+i+"]"
    }).join(",")+","+
    indices.map(function(i) {
      return "stride["+i+"]"
    }).join(",")+",offset)}")

  //Compile procedure
  var procedure = new Function("CTOR_LIST", "ORDER", code.join("\n"))
  return procedure(CACHED_CONSTRUCTORS[dtype], order)
}

function arrayDType(data) {
  if(isBuffer(data)) {
    return "buffer"
  }
  if(hasTypedArrays) {
    switch(Object.prototype.toString.call(data)) {
      case "[object Float64Array]":
        return "float64"
      case "[object Float32Array]":
        return "float32"
      case "[object Int8Array]":
        return "int8"
      case "[object Int16Array]":
        return "int16"
      case "[object Int32Array]":
        return "int32"
      case "[object Uint8Array]":
        return "uint8"
      case "[object Uint16Array]":
        return "uint16"
      case "[object Uint32Array]":
        return "uint32"
      case "[object Uint8ClampedArray]":
        return "uint8_clamped"
    }
  }
  if(Array.isArray(data)) {
    return "array"
  }
  return "generic"
}

var CACHED_CONSTRUCTORS = {
  "float32":[],
  "float64":[],
  "int8":[],
  "int16":[],
  "int32":[],
  "uint8":[],
  "uint16":[],
  "uint32":[],
  "array":[],
  "uint8_clamped":[],
  "buffer":[],
  "generic":[]
}

;(function() {
  for(var id in CACHED_CONSTRUCTORS) {
    CACHED_CONSTRUCTORS[id].push(compileConstructor(id, -1))
  }
});

function wrappedNDArrayCtor(data, shape, stride, offset) {
  if(data === undefined) {
    var ctor = CACHED_CONSTRUCTORS.array[0]
    return ctor([])
  } else if(typeof data === "number") {
    data = [data]
  }
  if(shape === undefined) {
    shape = [ data.length ]
  }
  var d = shape.length
  if(stride === undefined) {
    stride = new Array(d)
    for(var i=d-1, sz=1; i>=0; --i) {
      stride[i] = sz
      sz *= shape[i]
    }
  }
  if(offset === undefined) {
    offset = 0
    for(var i=0; i<d; ++i) {
      if(stride[i] < 0) {
        offset -= (shape[i]-1)*stride[i]
      }
    }
  }
  var dtype = arrayDType(data)
  var ctor_list = CACHED_CONSTRUCTORS[dtype]
  while(ctor_list.length <= d+1) {
    ctor_list.push(compileConstructor(dtype, ctor_list.length-1))
  }
  var ctor = ctor_list[d+1]
  return ctor(data, shape, stride, offset)
}

module.exports = wrappedNDArrayCtor

},{"iota-array":3,"is-buffer":4}],3:[function(require,module,exports){
"use strict"

function iota(n) {
  var result = new Array(n)
  for(var i=0; i<n; ++i) {
    result[i] = i
  }
  return result
}

module.exports = iota
},{}],4:[function(require,module,exports){
/**
 * Determine if an object is Buffer
 *
 * Author:   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * License:  MIT
 *
 * `npm install is-buffer`
 */

module.exports = function (obj) {
  return !!(obj != null &&
    (obj._isBuffer || // For Safari 5-7 (missing Object.prototype.constructor)
      (obj.constructor &&
      typeof obj.constructor.isBuffer === 'function' &&
      obj.constructor.isBuffer(obj))
    ))
}

},{}]},{},[1])(1)
});