import ndarray from 'ndarray'

/**
 * 
 * @param {NdArray|Array<Array>|Array<TypedArray>|Array<{get,set,length}>} data
 * @param {Array<number>} [options.shape] - Array shape, not used if data is an NdArray
 * @param {Array<String>} [options.names] - Axis names
 * @param {Array} [options.domains] - Domain values for each axis. 
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

  let domains = options.domains || {}
  if (!Array.isArray(domains)) {
    if (!names) {
      throw new Error('domains must be an array if names is missing')
    }
    domains = names.map(name => domains[name])
  }
  let arange = length => ndarray({get: i => i, length})
  domains = domains.map((domain,i) => domain ? (!domain.shape ? ndarray(domain) : domain) : arange(ndarr.shape[i]))

  return _xndarray(ndarr, names, domains)
}

/**
 * 
 * @param {NdArray} nd
 * @param {Array<String>} names - axis names
 * @param {Array<NdArray>} domains - domain values for each axis
 * @returns {XNdArray}
 */
function _xndarray (nd, names, domains) {
  let wrapSimple = fnname => (...args) => {
    let newnd = nd[fnname](...args)
    let newdomains = args.map((arg,i) => domains[i][fnname](arg))
    return _xndarray(newnd, names, newdomains)
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
      let newdomains = axes.map(i => domains[i])
      return _xndarray(newndarr, newnames, newdomains)
    },
    pick: (...indices) => {
      let newndarr = nd.pick(...indices)
      let filterFn = (_,i) => !(typeof indices[i] === 'number' && indices[i] >= 0)
      let newnames = names.filter(filterFn)
      let newdomains = domains.filter(filterFn)
      return _xndarray(newndarr, newnames, newdomains)
    },

    // new instance members
    names,
    domains
  }
  
  // proxy ndarray properties unchanged
  for (let prop of ['data', 'shape', 'stride', 'offset', 'dtype', 'size', 'order', 'dimension']) {
    Object.defineProperty(xnd, prop, {
      get: () => nd[prop]
    })
  }
  
  extend(xnd, compileAxisNamesFunctions(nd, names, domains))

  let namesMap = getNamesIndexMap(names)
  xnd.xdomain = name => domains[namesMap[name]]
  
  return xnd
}

/**
 * Precompiles functions that accept axis names as arguments for efficiency.
 * 
 * @param {NdArray} ndarr
 * @param {Array<String>} names - axis names
 * @param {Array<NdArray>} domains - 1D domain array for each axis
 * @returns {Object}
 */
function compileAxisNamesFunctions (ndarr, names, domains) {
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
    let wrapSimple = (newndarr, obj) => {
      let newdomains = names.map((_,i) => domains[i][fnname](obj[names[i]]))
      return _xndarray(newndarr, names, newdomains)
    }
    fns['x' + fnname] = new Function('ndarr', 'wrap',
        `return function x${fnname} (obj) { return wrap(ndarr.${fnname}(${idxArgsNull}), obj) }`)(ndarr, wrapSimple)
  }

  // xtranspose input: axis names, e.g. 'x', 'y'
  let namesMap = getNamesIndexMap(names)
  let wrapTranspose = (newndarr, newnames) => {
    let newdomains = newnames.map(name => domains[namesMap[name]])
    return _xndarray(newndarr, newnames, newdomains)
  }
  let xtransposeArgs = names.map((_,i) => `n${i}`).join(',')
  let transposeArgs = names.map((_,i) => `namesMap[n${i}]`).join(',')
  fns.xtranspose = new Function('ndarr', 'wrap', 'namesMap',
      `return function xtranspose (${xtransposeArgs}) { return wrap(ndarr.transpose(${transposeArgs}), [${xtransposeArgs}]) }`)(ndarr, wrapTranspose, namesMap)

  let wrapPick = (newndarr, obj) => {
    let filterFn = name => !(typeof obj[name] === 'number' && obj[name] >= 0)
    let newnames = names.filter(filterFn)
    let newdomains = domains.filter((_,i) => filterFn(names[i]))
    return _xndarray(newndarr, newnames, newdomains)  
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
