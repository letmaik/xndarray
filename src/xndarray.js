import ndarray from 'ndarray'

// TODO add domains arguments (values per axis), handle in lo/hi/step methods

export default function xndarray (data, options) {
  let ndarr = {data}
  extend(ndarr, options)
  let names = options.names
  return _xndarray(ndarr, names)
}

function _xndarray (ndarr, names) {
  let nd = ndarray(ndarr.data, ndarr.shape, ndarr.stride, ndarr.offset)
  if (Array.isArray(names) && nd.dimension !== names.length) {
    throw new Error('names array length must match nd dimension ' + nd.dimension + ': ' + names)
  }

  let wrap = fn => (...args) => _xndarray(fn.apply(nd, args), names)
  let xnd = {
    // ndarray methods
    get: nd.get.bind(nd),
    set: nd.set.bind(nd),
    index: nd.index.bind(nd),
    lo: wrap(nd.lo),
    hi: wrap(nd.hi),
    step: wrap(nd.step),
    transpose: (...axes) => {
      let newndarr = nd.transpose(...axes)
      let newnames = names ? axes.map(i => names[i]) : undefined
      return _xndarray(newndarr, newnames)
    },
    pick: (...indices) => {
      let newndarr = nd.pick(...indices)
      let newnames = names ? names.filter((_,i) => !(typeof indices[i] === 'number' && indices[i] >= 0)) : undefined
      return _xndarray(newndarr, newnames)
    },

    // new instance members
    names
  }
  
  // proxy ndarray properties unchanged
  for (let prop of ['data', 'shape', 'stride', 'offset', 'dtype', 'size', 'order', 'dimension']) {
    Object.defineProperty(xnd, prop, {
      get: () => nd[prop]
    })
  }
  
  if (names) {
    extend(xnd, compileFunctions(nd, names))
  }
  return xnd
}

function compileFunctions (ndarr, names) {
  let fns = {}
  
  let idxArgs0 = indexArgsString(names, '0')  
  for (let [name, args=''] of [['get'], ['set', ',v'], ['index']]) {
    fns['x' + name] = new Function('ndarr', 
        `return function x${name} (obj${args}) { return ndarr.${name}(${idxArgs0}${args}) }`)(ndarr)
  }
  
  let idxArgsNull = indexArgsString(names, 'null')
  let wrap = newndarr => _xndarray(newndarr, names)
  for (let name of ['lo', 'hi', 'step']) {
    fns['x' + name] = new Function('ndarr', 'wrap', 
        `return function x${name} (obj) { return wrap(ndarr.${name}(${idxArgsNull})) }`)(ndarr, wrap)
  }

  // xtranspose input: axis name array, e.g. ['x','y']
  // turn ['x','y'] into {x:0, y:1}
  let namesMap = {}
  for (let i=0; i < names.length; i++) {
    namesMap[names[i]] = i
  }
  let transposeArgs = names.map((_,i) => `namesMap[axes[${i}]]`).join(',')
  let wrapTranspose = (newndarr, newnames) => _xndarray(newndarr, newnames)
  fns.xtranspose = new Function('ndarr', 'wrap', 'namesMap', 
      `return function xtranspose (axes) { return wrap(ndarr.transpose(${transposeArgs}), axes) }`)(ndarr, wrapTranspose, namesMap)

  let wrapPick = (newndarr, obj) => _xndarray(newndarr, names.filter(name => !(typeof obj[name] === 'number' && obj[name] >= 0)))
  
  fns.xpick = new Function('ndarr', 'wrap', 
      `return function xpick (obj) { return wrap(ndarr.pick(${idxArgsNull}), obj) }`)(ndarr, wrapPick)

  return fns
}

function indexArgsString (names, defaultVal) {
  let ndargs = ''
  for (let i = 0; i < names.length; i++) {
    if (ndargs) ndargs += ','
    // the line below is not obj['${names[i]}'] || ${defaultVal} since we need to handle null/undefined as well
    ndargs += `'${names[i]}' in obj ? obj['${names[i]}'] : ${defaultVal}`
  }
  return ndargs
}

function extend (obj, props) {
  for (let prop in props) {
    obj[prop] = props[prop]
  }
}
