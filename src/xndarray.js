import ndarray from 'ndarray'

/**
 * 
 * @param {NdArray|Array<Array>|Array<TypedArray>|Array<{get,set,length}>} data
 * @param {Array<number>} [options.shape] - Array shape, not used if data is an NdArray
 * @param {Array<String>} [options.names] - Axis names
 * @param {Object|Map} [options.coords] - Coordinates for each axis. Requires options.names.
 *   Values are either an Array, TypedArray, get/set/length object, or NdArray object.
 */
export default function xndarray (data, options={}) {
  let ndarr
  if (data.shape) {
    ndarr = data
  } else {
    ndarr = ndarray(data, options.shape, options.stride, options.offset)
  }  
  let names = options.names || ndarr.shape.map((_,i) => 'dim_' + i)
  if (ndarr.dimension !== names.length) {
    throw new Error('names array length must match nd dimension ' + ndarr.dimension + ': ' + names)
  }

  let coords
  if (options.coords instanceof Map) {
    // already a Map object
    coords = options.coords
  } else if (options.coords) {
    // a plain object, transform to Map
    let coordsNames = Object.keys(options.coords)
    let coordsArr = coordsNames.map(name => !options.coords[name].shape ? ndarray(options.coords[name]) : options.coords[name])
    coords = new Map(zip(coordsNames, coordsArr))
  } else {
    coords = new Map()
  }
  
  // add missing dimension coordinates as ascending integers
  let arange = length => ndarray({get: i => i, length})
  for (let i=0; i < names.length; i++) {
    if (!coords.has(names[i])) {
      coords.set(names[i], arange(ndarr.shape[i]))
    }
  }

  return _xndarray(ndarr, names, coords)
}

/**
 * 
 * @param {NdArray} nd
 * @param {Array<String>} names - axis names
 * @param {Map<String,NdArray>} coords - coordinates
 * @returns {XNdArray}
 */
function _xndarray (nd, names, coords) {
  let wrapSimple = fnname => (...args) => {
    let newnd = nd[fnname](...args)
    let newcoords = new Map(coords)
    args.forEach((arg,i) => newcoords.set(names[i], coords.get(names[i])[fnname](arg)))
    return _xndarray(newnd, names, newcoords)
  }
  let xnd = {
    // ndarray methods
    get: nd.get.bind(nd),
    set: nd.set.bind(nd),
    index: nd.index.bind(nd),
    lo: wrapSimple('lo'),
    hi: wrapSimple('hi'),
    step: wrapSimple('step'),
    transpose: (...axes) => {
      let newndarr = nd.transpose(...axes)
      let newnames = axes.map(i => names[i])
      return _xndarray(newndarr, newnames, coords)
    },
    pick: (...indices) => {
      let newndarr = nd.pick(...indices)
      let isPicked = i => typeof indices[i] === 'number' && indices[i] >= 0
      let newnames = names.filter((_,i) => !isPicked(i))
      let newcoords = new Map(coords)
      indices.forEach((idx,i) => {
        if (isPicked(i)) {
          newcoords.set(names[i], coords.get(names[i]).pick(idx))
        }
      })
      return _xndarray(newndarr, newnames, newcoords)
    },

    // new instance members
    names,
    coords
  }
  
  // proxy ndarray properties unchanged
  for (let prop of ['data', 'shape', 'stride', 'offset', 'dtype', 'size', 'order', 'dimension']) {
    Object.defineProperty(xnd, prop, {
      get: () => nd[prop]
    })
  }
  
  extend(xnd, compileAxisNamesFunctions(nd, names, coords))
  
  xnd.toString = () => `XNdArray { shape: ${xnd.shape}, names: ${xnd.names} }`
  
  return xnd
}

/**
 * Precompiles functions that accept axis names as arguments for efficiency.
 * 
 * @param {NdArray} ndarr
 * @param {Array<String>} names - axis names
 * @param {Map<String,NdArray>} coords - 1D domain array for each axis
 * @returns {Object}
 */
function compileAxisNamesFunctions (ndarr, names, coords) {
  let fns = {}
  
  // we don't use obj['${names[i]}'] || ${defaultVal} since we need to handle null/undefined as well
  let indexArgsFn = defaultVal => names.map((_,i) => `'${names[i]}' in obj ? obj['${names[i]}'] : ${defaultVal}`).join(',')
  
  let idxArgs0 = indexArgsFn('0')
  for (let [fnname, args=''] of [['get'], ['set', ',v'], ['index']]) {
    fns['x' + fnname] = new Function('ndarr', 
        `return function x${fnname} (obj${args}) { return ndarr.${fnname}(${idxArgs0}${args}) }`)(ndarr)
  }
  
  let idxArgsNull = indexArgsFn('null')
  for (let fnname of ['lo', 'hi', 'step']) {
    let wrapLoHiStep = (newndarr, obj) => {
      let newcoords = new Map(coords)
      names.forEach(name => newcoords.set(name, coords.get(name)[fnname](obj[name])))
      return _xndarray(newndarr, names, newcoords)
    }
    fns['x' + fnname] = new Function('ndarr', 'wrap',
        `return function x${fnname} (obj) { return wrap(ndarr.${fnname}(${idxArgsNull}), obj) }`)(ndarr, wrapLoHiStep)
  }

  // xtranspose input: axis names, e.g. 'x', 'y'
  let namesMap = getNamesIndexMap(names)
  let wrapTranspose = (newndarr, newnames) => _xndarray(newndarr, newnames, coords)
  let xtransposeArgs = names.map((_,i) => `n${i}`).join(',')
  let transposeArgs = names.map((_,i) => `namesMap[n${i}]`).join(',')
  fns.xtranspose = new Function('ndarr', 'wrap', 'namesMap',
      `return function xtranspose (${xtransposeArgs}) { return wrap(ndarr.transpose(${transposeArgs}), [${xtransposeArgs}]) }`)(ndarr, wrapTranspose, namesMap)

  let wrapPick = (newndarr, obj) => {
    let isPicked = name => typeof obj[name] === 'number' && obj[name] >= 0
    let newnames = names.filter(name => !isPicked(name))
    let newcoords = new Map(coords)
    names.filter(isPicked).forEach(name => newcoords.set(name, coords.get(name).pick(obj[name])))
    return _xndarray(newndarr, newnames, newcoords)  
  }
  fns.xpick = new Function('ndarr', 'wrap', 
      `return function xpick (obj) { return wrap(ndarr.pick(${idxArgsNull}), obj) }`)(ndarr, wrapPick)

  return fns
}

/**
 * Turn ['x','y'] into {x:0, y:1}.
 */
function getNamesIndexMap (names) {
  let namesMap = {}
  for (let i=0; i < names.length; i++) {
    namesMap[names[i]] = i
  }
  return namesMap
}

function extend (obj, props) {
  for (let prop in props) {
    obj[prop] = props[prop]
  }
}

function zip (a, b) {
  let r = new Array(a.length)
  for (let i=0; i < a.length; i++) {
    r[i] = [a[i], b[i]]
  }
  return r
}
