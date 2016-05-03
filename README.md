# xndarray

Multidimensional arrays with semantics in JavaScript.

## Get started

xndarray works on node.js and browsers.

A minified browser version of this library is available in the [GitHub releases](https://github.com/neothemachine/xndarray/releases) and can be included like that:
```html
<script src="xndarray.min.js"></script>
<script>
var arr = xndarray(...)
</script>
```

## Usage

### Creation
```js
var arr = xndarray(new Uint8Array([1, 2, 3, 4, 5, 6]), {shape: [2,3], names: ['y','x']})

// arr = 1 2 3
//       4 5 6
```

If the `names` option is given, then a number of additional `x`-prefixed methods are available that work directly with axis names.

### Element access
```js
// arr.get(0, 1)
var v = arr.xget({y: 0, x: 1}) // 2

// arr.set(1, 1, 8)
arr.xset({y: 1, x: 1}, 8)

// arr = 1 2 3
//       4 8 6

// arr.index(1, 0)
var idx = arr.xindex({y: 1, x: 0}) // 3
```

### Slicing
```js
// arr.lo(null, 1)
var s1 = arr.xlo({x: 1})

// s1 == 2 3
//       8 6

// arr.hi(null, 2)
var s2 = arr.xhi({x: 2})

// s2 == 1 2
//       4 8

// arr.step(null, 2)
var s3 = arr.xstep({x: 2})

// s3 == 1 3
//       4 6

// arr.transpose(1, 0)
var s4 = arr.xtranspose(['x','y'])

// s4 == 1 4
//       2 8
//       3 6
// 
// s4.names == ['x','y']

// arr.pick(null, 1)
var s5 = arr.xpick({x: 1})

// s5 == 2 8
// s5.dimension == 1
// s5.names == ['y']
``` 

