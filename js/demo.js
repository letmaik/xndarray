(function() {

var GridDataLayer = L.GridLayer.extend({
  options: {
    palette: palette('tol-dv', 256) // uses google's palette.js
  },
  initialize: function (griddata, options) {
    L.Util.setOptions(this, options)
    this._griddata = toAscendingCoords(griddata)
    this._palette = hexToRgb(this.options.palette)
  },
  createTile: function (coords) {
    // create a <canvas> element for drawing
    var tile = L.DomUtil.create('canvas', 'leaflet-tile')
    
    // setup tile width and height according to the options
    var size = this.getTileSize()
    tile.width = size.x
    tile.height = size.y
        
    // calculate projection coordinates of top left tile pixel
    var startX = coords.x * size.x
    var startY = coords.y * size.y
    
    // prepare drawing
    var ctx = tile.getContext('2d')
    var imgData = ctx.getImageData(0, 0, size.x, size.y)
    var rgba = xndarray(imgData.data, {
      shape: [size.y, size.x, 4],
      names: ['y','x','c']
    })
    
    var lats = this._griddata.coords.get('lat')
    var lons = this._griddata.coords.get('lon')
    
    // extended bounding box (first and last cell gets extended since we don't have explicit bounds)
    var latMin = lats.get(0) - (lats.get(1) - lats.get(0)) / 2
    var latMax = lats.get(lats.size-1) + (lats.get(lats.size-1) - lats.get(lats.size-2)) / 2
    var lonMin = lons.get(0) - (lons.get(1) - lons.get(0)) / 2
    var lonMax = lons.get(lons.size-1) + (lons.get(lons.size-1) - lons.get(lons.size-2)) / 2    
    
    // used for longitude wrapping
    var lonRange = [lonMin, lonMin + 360]
    
    for (var tileX = 0; tileX < size.x; tileX++) {
      for (var tileY = 0; tileY < size.y; tileY++) {
        var latlng = map.unproject(L.point(startX + tileX, startY + tileY))
        var lat = latlng.lat
        var lon = latlng.lng

        // we first check whether the tile pixel is outside the bounding box
        // in that case we skip it as we do not want to extrapolate
        if (lat < latMin || lat > latMax) {
          continue
        }

        lon = L.Util.wrapNum(lon, lonRange, true)
        if (lon < lonMin || lon > lonMax) {
          continue
        }

        // read the value of the corresponding grid cell
        var iLat = indexOfNearest(lats, lat)
        var iLon = indexOfNearest(lons, lon)
        var val = this._griddata.xget({lat: iLat, lon: iLon})
        
        // find the right color in the palette
        var colorIdx = scale(val, this._palette, this.options.paletteExtent)
        var color = this._palette[colorIdx]
        
        // and draw it
        rgba.set(tileY, tileX, 0, color[0])
        rgba.set(tileY, tileX, 1, color[1])
        rgba.set(tileY, tileX, 2, color[2])
        rgba.set(tileY, tileX, 3, 255)
      }
    }
    
    ctx.putImageData(imgData, 0, 0)
    
    return tile
  }
})

function toAscendingCoords (griddata) {
  let res = griddata
  let lat = griddata.coords.get('lat')
  let lon = griddata.coords.get('lon')
  if (lat.size > 1 && lat.get(0) > lat.get(1)) {
    res = res.xstep({lat: -1})
  }
  if (lon.size > 1 && lon.get(0) > lon.get(1)) {
    res = res.xstep({lon: -1})
  }
  return res
}

function hexToRgb (colors) {
  return colors.map(function(color) {
    var c = parseInt(color, 16)
    return [c >> 16, (c >> 8) & 255, c & 255]
  })
}

function scale (val, palette, extent) {
  // scale val to [0,paletteSize-1] using the palette extent
  // (IDL bytscl formula: http://www.exelisvis.com/docs/BYTSCL.html)
  let scaled = Math.trunc((palette.length - 1 + 0.9999) * (val - extent[0]) / (extent[1] - extent[0]))
  return scaled
}

/** Return the index of the value closest to 'x' in 'a' using binary search.
 *  'a' must be ascending.
 */
function indexOfNearest (a, x) {
  if (a.dimension !== 1) {
    throw new Error('ndarray must be 1D')
  }
  var lo = -1
  var hi = a.size
  while (hi - lo > 1) {
    var mid = Math.round((lo + hi) / 2)    
    if (a.get(mid) <= x) {
      lo = mid
    } else {
      hi = mid
    }
  }
  if (a.get(lo) === x) hi = lo
  if (lo === -1) lo = hi
  if (hi === a.size) hi = lo
  if (Math.abs(x - a.get(lo)) <= Math.abs(x - a.get(hi))) {
    return lo
  } else {
    return hi
  }
}


let map = L.map('map', {
  center: [10, 0],
  zoom: 2
})

L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
   attribution: 'Map data &copy; <a href="http://www.osm.org">OpenStreetMap</a>'
}).addTo(map)

var griddata = xndarray(
  [17.3, 18.2, 16.5, 18.7,
   18.1, 19.4, 17.2, 18.6,
   19.2, 20.4, 21.1, 20.7,
   21.1, 21.3, 20.5, 19.2], {
  shape: [4,4],
  names: ['lat','lon'],
  coords: {
    lat: [54, 52, 50, 48],
    lon: [7, 9.4, 11.7, 14]
  }
})

var rasterLayer = new GridDataLayer(griddata, {
  paletteExtent: [15, 25]
}).addTo(map)

})()