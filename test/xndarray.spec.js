import assert from 'assert'

import ndarray from 'ndarray'
import unpack from 'ndarray-unpack'
import linspace from 'ndarray-linspace'
import xndarray from '../lib/xndarray.js'

describe('xndarray constructor', () => {
  it('should work', () => {
    let arr = xndarray([1,2,3,4], {shape: [2,2], names: ['y','x'], coords: {x: [0,1], y: [5,6]}})
    assert.deepEqual(arr.data, [1,2,3,4])
    assert.deepEqual(arr.shape, [2,2])
    assert.strictEqual(arr.dtype, 'array')
    assert.strictEqual(arr.size, 4)
    assert.strictEqual(arr.dimension, 2)
    assert.deepEqual(arr.names, ['y','x'])
    assert.strictEqual(arr.coords.size, 2)
    assert.strictEqual(arr.coords.get('y').get(0), 5)
  })
  it('should work without names or coords', () => {
    let arr = xndarray([1,2,3,4], {shape: [2,2]})
    
    // auto-generated dimension names and domain values
    assert.deepEqual(arr.names, ['dim_0', 'dim_1'])
    assert.deepEqual(unpack(arr.coords.get('dim_0')), [0,1])
    assert.deepEqual(unpack(arr.coords.get('dim_1')), [0,1])
  })
  it('should work with ndarray bidirectionally', () => {
    let nd = ndarray([1,2,3,4], [2,2])
    let arr = xndarray(nd, {coords: [[5,6],[0,1]]})
    assert.deepEqual(arr.data, [1,2,3,4])
    assert.deepEqual(arr.shape, [2,2])

    // here we use a random ndarray function on our xndarray object
    assert.deepEqual(unpack(arr), [[1,2],[3,4]])
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
        let arr = xndarray([1,2,3,4], {shape: [2,2], names: ['y','x'], coords: {y: [0,1], x: [2,3]}})
        let sliced = arr.lo(1, 1)
        assert(sliced.names)
        assert(sliced.xget)
        
        assert.strictEqual(sliced.coords.get('y').size, 1)
        assert.strictEqual(sliced.coords.get('x').size, 1)
        assert.strictEqual(sliced.coords.get('y').get(0), 1)
        assert.strictEqual(sliced.coords.get('x').get(0), 3)
      })
    })
    describe('#xlo', () => {
      it('should work correctly', () => {
        let arr = xndarray([1,2,3,4], {shape: [2,2], names: ['y','x'], coords: {y: [0,1], x: [2,3]}})
        let sliced = arr.xlo({x: 1, y: 1})
        assert.deepEqual(sliced.shape, [1,1])
        assert.strictEqual(sliced.size, 1)
        assert.strictEqual(sliced.dimension, 2)
        assert.deepEqual(sliced.names, ['y','x'])
        
        assert.strictEqual(sliced.xget({x: 0, y: 0}), 4)
        
        assert.strictEqual(sliced.coords.get('y').size, 1)
        assert.strictEqual(sliced.coords.get('x').size, 1)
        assert.strictEqual(sliced.coords.get('y').get(0), 1)
        assert.strictEqual(sliced.coords.get('x').get(0), 3)
      })
    })
    describe('#xhi', () => {
      it('should work correctly', () => {
        let arr = xndarray([1,2,3,4], {shape: [2,2], names: ['y','x'], coords: {y: [0,1], x: [2,3]}})
        let sliced = arr.xhi({x: 1, y: 1})
        assert.deepEqual(sliced.shape, [1,1])
        assert.strictEqual(sliced.size, 1)
        assert.strictEqual(sliced.dimension, 2)
        assert.deepEqual(sliced.names, ['y','x'])
        
        assert.strictEqual(sliced.xget({x: 0, y: 0}), 1)
        
        assert.strictEqual(sliced.coords.get('y').size, 1)
        assert.strictEqual(sliced.coords.get('x').size, 1)
        assert.strictEqual(sliced.coords.get('y').get(0), 0)
        assert.strictEqual(sliced.coords.get('x').get(0), 2)
      })
    })
    describe('#xstep', () => {
      it('should work correctly', () => {
        let arr = xndarray([1,2,3,4,5,6], {names: ['x'], coords: {x: [0,1,2,3,4,5]}})
        let evens = arr.xstep({x: 2})
        assert.deepEqual(evens.shape, [3])
        assert.strictEqual(evens.size, 3)
        assert.strictEqual(evens.dimension, 1)
        assert.deepEqual(evens.names, ['x'])
        
        assert.strictEqual(evens.xget({x: 0}), 1)
        assert.strictEqual(evens.xget({x: 1}), 3)
        assert.strictEqual(evens.xget({x: 2}), 5)
        
        assert.deepEqual(unpack(evens.coords.get('x')), [0,2,4])
      })
    })
    describe('#transpose', () => {
      it('should return an xndarray object again', () => {
        let arr = xndarray([1,2,3,4,5,6], {shape: [2,3], names: ['y','x'], coords: {y: [0,1], x: [2,3,4]}})
        let transposed = arr.transpose(1, 0)
        assert.deepEqual(transposed.names, ['x','y'])
        assert.deepEqual(transposed.shape, [3,2])
        
        assert.deepEqual(unpack(transposed.coords.get('y')), [0,1])
        assert.deepEqual(unpack(transposed.coords.get('x')), [2,3,4])
      })
    })
    describe('#xtranspose', () => {
      it('should work correctly', () => {
        let arr = xndarray([1,2,3,4,5,6], {shape: [2,3], names: ['y','x']})
        let transposed = arr.xtranspose('x','y')
        assert.deepEqual(transposed.names, ['x','y'])
        assert.deepEqual(transposed.shape, [3,2])
      })
    })
    describe('#pick', () => {
      it('should return an xndarray object again', () => {
        let arr = xndarray(new Uint8Array(50*50*3), {
          shape: [50,50,3], 
          names: ['y','x','t'], 
          coords: {
            y: linspace(1,50,50),
            x: linspace(1,50,50),
            t: [new Date('2000-01-01'), new Date('2000-02-01'), new Date('2000-03-01')]},
            foo: ['bar']
        })
        let sliced = arr.pick(null, null, 0)
        assert.deepEqual(sliced.names, ['y','x'])
        
        assert(sliced.coords.get('y').size, 50)
        assert(sliced.coords.get('x').size, 50)
        assert(sliced.coords.get('t').size, 1)
      })
      it('should work with single dimension', () => {
        let arr = xndarray([1,2])
        let sliced = arr.pick(0)
      })
    })
    describe('#xpick', () => {
      it('should work correctly', () => {
        let arr = xndarray(new Uint8Array(50*50*3), {
          shape: [50,50,3], 
          names: ['y','x','t'], 
          coords: {
            y: linspace(1,50,50),
            x: linspace(1,50,50),
            t: [new Date('2000-01-01'), new Date('2000-02-01'), new Date('2000-03-01')]}
        })
        let sliced = arr.xpick({t: 0})
        assert.deepEqual(sliced.names, ['y','x'])
        
        assert(sliced.coords.get('y').size, 50)
        assert(sliced.coords.get('x').size, 50)
        assert(sliced.coords.get('t').size, 1)
      })
    })
  })
})
