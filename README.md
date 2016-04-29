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

Creation:
```js
var arr = xndarray(new Uint8Array([1, 2, 3, 4], {shape: [2,2], names: ['y','x']})

// arr = 1 2
//       3 4
```

If the `names` option is given, then a number of additional methods are available for working directly with axis names.

Element access:
```js
var v1 = arr.get(0,0) // 1
var v2 = arr.xget({y: 0, x: 1}) // 2

arr.set(0,0,9)
arr.xset({y: 1, x: 1}, 5)

// arr = 9 2
//       3 5
```

Slicing:
```js
var s1 = arr.xlo({x: 1, y: 0})

// s1 = 1
//      3

var s2 = arr.xhi({x: 1, y: 0})

// s2 = 9 2
``` 

