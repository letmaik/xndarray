# xndarray

Multidimensional arrays with semantics in JavaScript.

## Introduction



## Install

xndarray works on browsers and any tool following the CommonJS/node module conventions.

A minified browser version of this library is available in the [GitHub releases](https://github.com/neothemachine/xndarray/releases) as well as on the [jsDelivr CDN](http://www.jsdelivr.com/projects/xndarray). It can be included like that:
```html
<script src="//cdn.jsdelivr.net/xndarray/0.3/xndarray.min.js"></script>
<script>
var arr = xndarray(...)
</script>
```

## API

If you use xndarray within a CommonJS/node environment, then import the constructor as follows:
```js
var xndarray = require('xndarray')
```
When using the minified browser version, then this constructor is made available globally under the same name.

### Constructor

#### `xndarray(data, {shape, names, coords, stride, offset})`

- `data` is a 1D array storage. It is either an instance of `Array`, a typed array, or an object that implements `get()`, `set()`, `.length`
- `shape` is the shape of the view as an array of integers (Default: `[data.length]`)
- `names` is an array of dimension names (Default: `['dim_0','dim_1',...]`)
- `coords` is a coordinates map of 1D array storages. Each key is a (dimension) name and each value is either an instance of `Array`, a typed array, an [ndarray][ndarray], or an object that implements `get()`, `set()`, `.length` (Default: `{dim_0: [0,1,2,...], dim_1: [0,1,2,...],...}`)
- `stride` is the resulting stride of the view. (Default: row major)
- `offset` is the offset to start the view (Default: 0)

```js
var arr = xndarray([1,2,3,4,5,6], {
  shape: [2,3],
  names: ['y','x'],
  coords: {
    y: [10,12,14],
    x: [100,101,102],
    t: [new Date('2001-01-01')]
  }
})

// arr == 1 2 3
//        4 5 6
```

In the example, there are coordinates for the `y` and `x` dimensions plus an extra coordinate named `t`.
Extra coordinates are ignored in operations like slicing and carried over unchanged.

##### 0D arrays

You can construct 0D arrays by defining an empty shape without dimension names:
```js
var arr = xndarray([5], {shape: [], coords: {time: [new Date('2001-01-01')]})
```

#### `xndarray(ndarr, {names, coords})`

This constructor variant wraps existing [ndarray][ndarray] objects.

- `ndarr` is an [ndarray][ndarray] object.
- `names` is an array of dimension names (Default: `['dim_0','dim_1',...]`)
- `coords` is a coordinates map of 1D array storages. Each key is a (dimension) name and each value is either an instance of `Array`, a typed array, an [ndarray][ndarray], or an object that implements `get()`, `set()`, `.length` (Default: `{dim_0: [0,1,2,...], dim_1: [0,1,2,...],...}`)

xndarray is fully compatible with [ndarray][ndarray] and can directly wrap such objects:
```js
var nd = ndarray([1,2,3,4], [2,2])
var xnd = xndarray(nd, {
  names: ['y','x'],
  coords: {
    y: [10,12,14],
    x: [100,101,102],
    t: [new Date('2001-01-01')]
  }
})
```

All [ndarray modules](http://scijs.net/packages/) can directly be used on xndarray objects:
```js
var unpack = require('ndarray-unpack')
var nd2 = unpack(xnd) // [[1,2],[3,4]]
```
[ndarray][ndarray] functions that return a new [ndarray][ndarray] object will not have any xndarray functionality and have to be wrapped again.

### Members

Members originating from [ndarray][ndarray]:
- `array.data` - The underlying 1D storage for the multidimensional array
- `array.shape` - The shape of the array
- `array.dimension` - Dimension of the array as an integer (equals `array.shape.length`)
- `array.size` - Size of the array in logical elements (equals `array.shape[0]*array.shape[1]*...`)
- `array.stride` - The layout of the array in memory
- `array.offset` - The starting offset of the array in memory
- `array.dtype` - String representing the underlying data type
- `array.order` - Order of the stride of the array, sorted in ascending length

Additional members:
- `array.names` - The dimension names. A string array of length `array.dimension`.
- `array.coords` - The coordinates. A Map from (dimension) name to 1D [ndarrays][ndarray].

### Element access

#### `array.get(i,j,...)` / `array.xget({x: i, y: j, ...})`

```js
var arr = xndarray([1,2,3,4,5,6], {shape: [2,3], names: ['y','x']})

// arr.get(0, 1)
var v = arr.xget({y: 0, x: 1}) 

// v == 2
```

#### `array.set(i,j,...,v)` / `array.xset({x: i, y: j, ...}, v)`

```js
var arr = xndarray([1,2,3,4,5,6], {shape: [2,3], names: ['y','x']})

// arr.set(1, 1, 8)
arr.xset({y: 1, x: 1}, 8)

// arr == 1 2 3
//        4 8 6
```

#### `array.index(i,j,...)` / `array.xindex({x: i, y: j, ...})`

```js
var arr = xndarray([1,2,3,4,5,6], {shape: [2,3], names: ['y','x']})

// arr.index(1, 0)
var idx = arr.xindex({y: 1, x: 0})

// idx == 3
```

### Slicing

#### `array.lo(i,j,...)` / `array.xlo({x: i, y: j, ...})`

```js
var arr = xndarray([1,2,3,4,5,6], {
  shape: [2,3],
  names: ['y','x'],
  coords: {
    y: [10,12,14],
    x: [100,101,102]
  }
})

// arr == 1 2 3
//        4 5 6

// arr.lo(null, 1)
var a = arr.xlo({x: 1})

// a == 2 3
//      5 6
// a.coords.get('y') == 10 12 14
// a.coords.get('x') == 101 102
```

#### `array.hi(i,j,...)` / `array.xhi({x: i, y: j, ...})`

```js
var arr = xndarray([1,2,3,4,5,6], {
  shape: [2,3],
  names: ['y','x'],
  coords: {
    y: [10,12,14],
    x: [100,101,102]
  }
})

// arr.hi(null, 2)
var a = arr.xhi({x: 2})

// a == 1 2
//      4 5
// a.coords.get('y') == 10 12 14
// a.coords.get('x') == 100 101
```

#### `array.step(i,j,...)` / `array.xstep({x: i, y: j, ...})`

```js
var arr = xndarray([1,2,3,4,5,6], {
  shape: [2,3],
  names: ['y','x'],
  coords: {
    y: [10,12,14],
    x: [100,101,102]
  }
})

// arr.step(null, 2)
var a = arr.xstep({x: 2})

// a == 1 3
//      4 6
// a.coords.get('y') == 10 12 14
// a.coords.get('x') == 100 102
```

#### `array.transpose(p0, p1, ...)` / `array.xtranspose('x','y',...)`

The transpose/xtranspose functions change the axis order.
This has no relevance if you only work with x-prefixed functions since they
work directly on axis names.

```js
var arr = xndarray([1,2,3,4,5,6], {shape: [2,3], names: ['y','x']})

// arr.transpose(1, 0)
var a = arr.xtranspose('x', 'y')

// a == 1 4
//      2 5
//      3 6
// 
// a.names == ['x','y']
```

#### `array.pick(i,j,...)` / `array.xpick({x: i, y: j, ...})`

```js
var arr = xndarray([1,2,3,4,5,6], {
  shape: [2,3],
  names: ['y','x'],
  coords: {
    y: [10,12,14],
    x: [100,101,102]
  }
})

// arr.pick(null, 1)
var a = arr.xpick({x: 1})

// a == 2 5
// a.dimension == 1
// a.names == ['y']
// a.coords.get('y') == 10 12 14
// a.coords.get('x') == 101
```

Note that the `x` coordinates get reduced to a single value in the example. 

## Acknowledgments

This library is inspired by the Python packages [PyHRF](http://pyhrf.org) (see [pyhrf.ndarray.xndarray class](http://pyhrf.org/autodoc/pyhrf.ndarray.html#pyhrf.ndarray.xndarray)) and [xarray](http://xarray.pydata.org).
It is based on and compatible with the [ndarray][ndarray] JavaScript library.


[ndarray]: https://github.com/scijs/ndarray "ndarray"
