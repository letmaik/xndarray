import assert from 'assert'
import ndarray from 'ndarray'

import xndarray from '../lib/xndarray.js'

describe('xndarray constructor', () => {
  it('should not modify ndarray prototype', () => {
    let nd = ndarray([1,2,3,4], [2,2])
    let arr = xndarray(nd, ['y','x'])
    assert(!nd.names)
    
    let nd2 = ndarray([1,2,3,4], [2,2])
    assert(!nd2.names)
  })
  it('should accept plain object', () => {
    let arr = xndarray({data: [1,2,3,4], shape: [2,2]}, ['y','x'])
    assert.deepEqual(arr.data, [1,2,3,4])
    assert.deepEqual(arr.shape, [2,2])
    assert.strictEqual(arr.dtype, 'array')
    assert.strictEqual(arr.size, 4)
    assert.strictEqual(arr.dimension, 2)
    assert.deepEqual(arr.names, ['y','x'])
  })
})

describe('xndarray methods', () => {
  describe('Element Access methods', () => {
    describe('#xget', () => {
      it('should work correctly', () => {
        let arr = xndarray({data: [1,2,3,4], shape: [2,2]}, ['y','x'])
        assert.strictEqual(arr.xget({x: 0, y: 0}), 1)
        assert.strictEqual(arr.xget({x: 1, y: 0}), 2)
        assert.strictEqual(arr.xget({x: 0, y: 1}), 3)
        assert.strictEqual(arr.xget({x: 1, y: 1}), 4)
        
        assert.strictEqual(arr.xget({x: 0}), 1)
        assert.strictEqual(arr.xget({y: 0}), 1)
        assert.strictEqual(arr.xget({x: 1}), 2)      
        assert.strictEqual(arr.xget({y: 1}), 3)
      })
    })
    describe('#xset', () => {
      it('should work correctly', () => {
        let arr = xndarray({data: [1,2,3,4], shape: [2,2]}, ['y','x'])
        arr.xset({x: 0, y: 1}, 5)
        assert.strictEqual(arr.xget({x: 0, y: 0}), 1)
        assert.strictEqual(arr.xget({x: 1, y: 0}), 2)
        assert.strictEqual(arr.xget({x: 0, y: 1}), 5)
        assert.strictEqual(arr.xget({x: 1, y: 1}), 4)
      })
    })
    describe('#xindex', () => {
      it('should work correctly', () => {
        let arr = xndarray({data: [1,2,3,4], shape: [2,2]}, ['y','x'])
        assert.strictEqual(arr.xindex({x: 0, y: 0}), 0)
        assert.strictEqual(arr.xindex({x: 1, y: 0}), 1)
        assert.strictEqual(arr.xindex({x: 0, y: 1}), 2)
        assert.strictEqual(arr.xindex({x: 1, y: 1}), 3)
      })
    })
  })
  describe('Slicing methods', () => {
    describe('#lo', () => {
      it('should return an xndarray object again', () => {
        let arr = xndarray({data: [1,2,3,4], shape: [2,2]}, ['y','x'])
        let sliced = arr.lo(1, 1)
        assert(sliced.names)
        assert(sliced.xget)
      })
    })
    describe('#xlo', () => {
      it('should work correctly', () => {
        let arr = xndarray({data: [1,2,3,4], shape: [2,2]}, ['y','x'])
        let sliced = arr.xlo({x: 1, y: 1})
        assert.deepEqual(sliced.shape, [1,1])
        assert.strictEqual(sliced.size, 1)
        assert.strictEqual(sliced.dimension, 2)
        assert.deepEqual(sliced.names, ['y','x'])
        
        assert.strictEqual(sliced.xget({x: 0, y: 0}), 4)
      })
    })
    describe('#xhi', () => {
      it('should work correctly', () => {
        let arr = xndarray({data: [1,2,3,4], shape: [2,2]}, ['y','x'])
        let sliced = arr.xhi({x: 1, y: 1})
        assert.deepEqual(sliced.shape, [1,1])
        assert.strictEqual(sliced.size, 1)
        assert.strictEqual(sliced.dimension, 2)
        assert.deepEqual(sliced.names, ['y','x'])
        
        assert.strictEqual(sliced.xget({x: 0, y: 0}), 1)
      })
    })
    describe('#xstep', () => {
      it('should work correctly', () => {
        let arr = xndarray({data: [1,2,3,4,5,6]}, ['x'])
        let evens = arr.xstep({x: 2})
        assert.deepEqual(evens.shape, [3])
        assert.strictEqual(evens.size, 3)
        assert.strictEqual(evens.dimension, 1)
        assert.deepEqual(evens.names, ['x'])
        
        assert.strictEqual(evens.xget({x: 0}), 1)
        assert.strictEqual(evens.xget({x: 1}), 3)
        assert.strictEqual(evens.xget({x: 2}), 5)
      })
    })
  })
})
