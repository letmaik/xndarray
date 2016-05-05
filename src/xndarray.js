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
    coords = new Map(
      Object.keys(options.coords)
        .map(name => [name, options.coords[name]]))
  } else {
    coords = new Map()
  }
  coords.forEach((arr, name) => {
    if (!arr.shape) {
      coords.set(name, ndarray(arr))
    } else {
      if (arr.dimension !== 1) {
        throw new Error('coordinate arrays must be 1D')
      }
    }
  })
  
  // add missing dimension coordinates as ascending integers
  let arange = length => ndarray({get: i => i, length})
  zip(names, ndarr.shape)
    .filter(([name]) => !coords.has(name))
    .forEach(([name,size]) => coords.set(name, arange(size)))

  return new XNdArray(ndarr, names, coords)
}

/**
 * 
 * @param {NdArray} nd
 * @param {Array<String>} names - axis names
 * @param {Map<String,NdArray>} coords - coordinates
 * @returns {XNdArray}
 */
class XNdArray {
  constructor (nd, names, coords) {
    this.names = names
    this.coords = coords
    
    let wrapSimple = fnname => (...args) => {
      let newnd = nd[fnname](...args)
      let newcoords = new Map(coords)
      args.forEach((arg,i) => newcoords.set(names[i], coords.get(names[i])[fnname](arg)))
      return new XNdArray(newnd, names, newcoords)
    }
    
    // ndarray methods
    this.get = nd.get.bind(nd)
    this.set = nd.set.bind(nd)
    this.index = nd.index.bind(nd)
    this.lo = wrapSimple('lo')
    this.hi = wrapSimple('hi')
    this.step = wrapSimple('step')
    this.transpose = (...axes) => {
      let newndarr = nd.transpose(...axes)
      let newnames = axes.map(i => names[i])
      return new XNdArray(newndarr, newnames, coords)
    }
    this.pick = (...indices) => {
      let newndarr = nd.pick(...indices)
      let isPicked = i => typeof indices[i] === 'number' && indices[i] >= 0
      let newnames = names.filter((_,i) => !isPicked(i))
      if (newnames.length === 0) {
        // no support for degenerate arrays yet
        return newndarr
      }
      let newcoords = new Map(coords)
      indices.forEach((idx,i) => {
        if (isPicked(i)) {
          newcoords.set(names[i], coords.get(names[i]).pick(idx))
        }
      })
      return new XNdArray(newndarr, newnames, newcoords)
    }
    
    // proxy ndarray properties unchanged
    for (let prop of ['data', 'shape', 'stride', 'offset', 'dtype', 'size', 'order', 'dimension']) {
      Object.defineProperty(this, prop, {
        get: () => nd[prop]
      })
    }
    
    extend(this, compileAxisNamesFunctions(nd, names, coords))
  }
  
  coordsToString (pad) {
    let s = ''
    let maxCoordNameLen = 0
    this.coords.forEach(coordName => maxCoordNameLen = Math.max(maxCoordNameLen, coordName.length))
    for (let [coordName, coordArr] of this.coords) {
      let isDim = this.names.indexOf(coordName) !== -1
      let coordNamePad = ' '.repeat(maxCoordNameLen - coordName.length)
      let vals = ''
      let maxVals = 10
      for (let i=0; i < Math.min(coordArr.size, maxVals); i++) {
        vals += coordArr.get(i) + ' '
      }
      if (coordArr.size > maxVals) {
        vals += '...'
      }
      s += pad + (isDim ? '*' : ' ') + ' ' + coordName + coordNamePad + '  ' + vals + '\n'
    }
    return s
  }
  
  toString () {
    let dims = this.names.map((name,i) => name + ': ' + this.shape[i]).join(', ')
    return `XNdArray (${dims})
  Coordinates:
${this.coordsToString('    ')}`
  }
  
  // for console output in chrome/nodejs
  inspect () {
    return this.toString()
  }
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
      return new XNdArray(newndarr, names, newcoords)
    }
    fns['x' + fnname] = new Function('ndarr', 'wrap',
        `return function x${fnname} (obj) { return wrap(ndarr.${fnname}(${idxArgsNull}), obj) }`)(ndarr, wrapLoHiStep)
  }

  // xtranspose input: axis names, e.g. 'x', 'y'
  let namesMap = getNamesIndexMap(names)
  let wrapTranspose = (newndarr, newnames) => new XNdArray(newndarr, newnames, coords)
  let xtransposeArgs = names.map((_,i) => `n${i}`).join(',')
  let transposeArgs = names.map((_,i) => `namesMap[n${i}]`).join(',')
  fns.xtranspose = new Function('ndarr', 'wrap', 'namesMap',
      `return function xtranspose (${xtransposeArgs}) { return wrap(ndarr.transpose(${transposeArgs}), [${xtransposeArgs}]) }`)(ndarr, wrapTranspose, namesMap)

  let wrapPick = (newndarr, obj) => {
    let isPicked = name => typeof obj[name] === 'number' && obj[name] >= 0
    let newnames = names.filter(name => !isPicked(name))
    if (newnames.length === 0) {
      // no support for degenerate arrays yet
      return newndarr
    }
    let newcoords = new Map(coords)
    names.filter(isPicked).forEach(name => newcoords.set(name, coords.get(name).pick(obj[name])))
    return new XNdArray(newndarr, newnames, newcoords)  
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
