import ndarray from 'ndarray'

// TODO add domains arguments (values per axis), handle in lo/hi/step methods

export default function xndarray (ndarr, names) {
  let nd = ndarray(ndarr.data, ndarr.shape, ndarr.stride, ndarr.offset)
  if (!Array.isArray(names) || nd.dimension !== names.length) {
    throw new Error('names array length must match ndarray dimension')
  }
  
  let wrap = fn => (...args) => xndarray(fn.apply(nd, args), names)
  let xnd = {
    // ndarray instance members
    data: nd.data,
    shape: nd.shape,
    stride: nd.stride,
    offset: nd.offset,
    
    // ndarray properties
    // TODO define as Property as in ndarray to reduce memory footprint
    dtype: nd.dtype,
    size: nd.size,
    order: nd.order,
    dimension: nd.dimension,
    
    // ndarray methods
    get: nd.get.bind(nd),
    set: nd.set.bind(nd),
    index: nd.index.bind(nd),
    lo: wrap(nd.lo),
    hi: wrap(nd.hi),
    step: wrap(nd.step),
    
    // new instance members
    names
  }
  extend(xnd, compileFunctions(nd, names))
  return xnd
}

function compileFunctions (ndarr, names) {
  let idxArgs = indexArgsString(names)
  let wrap = newndarr => xndarray(newndarr, names)
  return {
    xget: new Function('ndarr', `return function xget (obj) { return ndarr.get(${idxArgs}) }`)(ndarr),
    xset: new Function('ndarr', `return function xset (obj,v) { return ndarr.set(${idxArgs},v) }`)(ndarr),
    xindex: new Function('ndarr', `return function xindex (obj) { return ndarr.index(${idxArgs}) }`)(ndarr),
    xlo: new Function('ndarr', 'wrap', `return function xlo (obj) { return wrap(ndarr.lo(${idxArgs})) }`)(ndarr, wrap),
    xhi: new Function('ndarr', 'wrap', `return function xhi (obj) { return wrap(ndarr.hi(${idxArgs})) }`)(ndarr, wrap),
    xstep: new Function('ndarr', 'wrap', `return function xstep (obj) { return wrap(ndarr.step(${idxArgs})) }`)(ndarr, wrap)
    // TODO add support for transpose() and pick(), requires change of "names"
  }
}

function indexArgsString (names) {
  let ndargs = ''
  for (let i=0; i < names.length; i++) {
    if (ndargs) ndargs += ','
    // TODO benchmark both variants
    ndargs += `'${names[i]}' in obj ? obj['${names[i]}'] : 0`
    //ndargs += `obj['${names[i]}'] || 0`
  }
  return ndargs
}

function extend (obj, props) {
  for (let prop in props) {
    obj[prop] = props[prop]
  }
}
