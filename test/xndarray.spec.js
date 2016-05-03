import assert from 'assert'

import xndarray from '../lib/xndarray.js'

describe('xndarray constructor', () => {
  it('should work', () => {
    let arr = xndarray([1,2,3,4], {shape: [2,2], names: ['y','x']})
    assert.deepEqual(arr.data, [1,2,3,4])
    assert.deepEqual(arr.shape, [2,2])
    assert.strictEqual(arr.dtype, 'array')
    assert.strictEqual(arr.size, 4)
    assert.strictEqual(arr.dimension, 2)
    assert.deepEqual(arr.names, ['y','x'])
  })
  it('should work without names', () => {
    let arr = xndarray([1,2,3,4], {shape: [2,2]})
    assert(!arr.names)
  })
})

describe('xndarray methods', () => {
  describe('Element Access methods', () => {
    describe('#xget', () => {
      it('should work correctly', () => {
        let arr = xndarray([1,2,3,4], {shape: [2,2], names: ['y','x']})
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
        let arr = xndarray([1,2,3,4], {shape: [2,2], names: ['y','x']})
        arr.xset({x: 0, y: 1}, 5)
        assert.strictEqual(arr.xget({x: 0, y: 0}), 1)
        assert.strictEqual(arr.xget({x: 1, y: 0}), 2)
        assert.strictEqual(arr.xget({x: 0, y: 1}), 5)
        assert.strictEqual(arr.xget({x: 1, y: 1}), 4)
      })
    })
    describe('#xindex', () => {
      it('should work correctly', () => {
        let arr = xndarray([1,2,3,4], {shape: [2,2], names: ['y','x']})
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
        let arr = xndarray([1,2,3,4], {shape: [2,2], names: ['y','x']})
        let sliced = arr.lo(1, 1)
        assert(sliced.names)
        assert(sliced.xget)
      })
    })
    describe('#xlo', () => {
      it('should work correctly', () => {
        let arr = xndarray([1,2,3,4], {shape: [2,2], names: ['y','x']})
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
        let arr = xndarray([1,2,3,4], {shape: [2,2], names: ['y','x']})
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
        let arr = xndarray([1,2,3,4,5,6], {names: ['x']})
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
    describe('#transpose', () => {
      it('should return an xndarray object again', () => {
        let arr = xndarray([1,2,3,4], {shape: [2,3], names: ['y','x']})
        let transposed = arr.transpose(1, 0)
        assert.deepEqual(transposed.names, ['x','y'])
        assert.deepEqual(transposed.shape, [3,2])
      })
    })
    describe('#xtranspose', () => {
      it('should work correctly', () => {
        let arr = xndarray([1,2,3,4], {shape: [2,3], names: ['y','x']})
        let transposed = arr.xtranspose(['x','y'])
        assert.deepEqual(transposed.names, ['x','y'])
        assert.deepEqual(transposed.shape, [3,2])
      })
    })
    describe('#pick', () => {
      it('should return an xndarray object again', () => {
        let arr = xndarray(new Uint8Array(50*50*3), {shape: [50,50,3], names: ['y','x','c']})
        let sliced = arr.pick(null, null, 0)
        assert.deepEqual(sliced.names, ['y','x'])
      })
    })
    describe('#xpick', () => {
      it('should work correctly', () => {
        let arr = xndarray(new Uint8Array(50*50*3), {shape: [50,50,3], names: ['y','x','c']})
        let sliced = arr.xpick({c: 0})
        assert.deepEqual(sliced.names, ['y','x'])
      })
    })
  })
})
