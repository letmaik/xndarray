import assert from 'assert'

import unpack from 'ndarray-unpack'
import xndarray from '../lib/xndarray.js'

describe('README examples', () => {
  it('should be correct', () => {
    // ### Creation
    
    var arr = xndarray(new Uint8Array([1, 2, 3, 4, 5, 6]), {shape: [2,3], names: ['y','x']})
    
    // arr = 1 2 3
    //       4 5 6
    
    assert.deepEqual(unpack(arr), [[1,2,3],[4,5,6]])
    
    // ### Element access
    
    // arr.get(0, 1)
    var v = arr.xget({y: 0, x: 1}) // 2
    
    assert.equal(v, 2)
    
    // arr.set(1, 1, 8)
    arr.xset({y: 1, x: 1}, 8)

    // arr = 1 2 3
    //       4 8 6
    
    assert.deepEqual(unpack(arr), [[1,2,3],[4,8,6]])
    
    // arr.index(1, 0)
    var idx = arr.xindex({y: 1, x: 0}) // 3
    
    assert.equal(idx, 3)
    
    // ### Slicing
    arr = xndarray(new Uint8Array([1, 2, 3, 4, 5, 6]), {shape: [2,3], names: ['y','x']})
    
    // arr.lo(null, 1)
    var s1 = arr.xlo({x: 1})

    // s1 = 2 3
    //      5 6
    
    assert.deepEqual(unpack(s1), [[2,3],[5,6]])
    
    // arr.hi(null, 2)
    var s2 = arr.xhi({x: 2})
    
    // s2 = 1 2
    //      4 5
    
    assert.deepEqual(unpack(s2), [[1,2],[4,5]])
    
    // arr.step(null, 2)
    var s3 = arr.xstep({x: 2})
    
    // s3 = 1 3
    //      4 6

    assert.deepEqual(unpack(s3), [[1,3],[4,6]])
    
    // arr.transpose(1, 0)
    var s4 = arr.xtranspose(['x','y'])
    
    // s4 = 1 4
    //      2 5
    //      3 6
    // 
    // s4.names = ['x','y']
    
    assert.deepEqual(unpack(s4), [[1,4],[2,5],[3,6]])
    assert.deepEqual(s4.names, ['x','y'])
    
    // arr.pick(null, 1)
    var s5 = arr.xpick({x: 1})
    
    // s5 == 2 5
    // s5.dimension == 1
    // s5.names == ['y']
    
    assert.deepEqual(unpack(s5), [2,5])
    assert.deepEqual(s5.names, ['y'])
  })
})
