
import { tileSize, tileCounts } from './shared/constants';
import { 
  locateTiles, 
  expand2dArray, 
  cellToCanvas, 
  cellToBiopsy, 
  biopsyToCell, 
  canvasDeltaToBiopsy, 
  canvasToBiopsy 
} from './tiles';

// as explained in tiles.js, there are 3 coordinate systems:
// - biopsy: [x,y] pixels in the source TIF
// - canvas: [x,y] pixels in the canvas
// - cell: [row,column] in a particular grid layer


// represents everything that is displayed for one tif
// holds a ZoomableGridLayer for both the biopsy image tiles, and the mask tiles
export class Grid {
  constructor(imageLoader) {
    this.biopsyLayer = new ZoomableGridLayer(tileSize.biopsyDownsamplings, imageLoader);
    this.maskLayer = new ZoomableGridLayer(tileSize.maskDownsamplings, imageLoader);
  }

  // get the [width, height] in biopsy coords
  getBounds() {
    return this.biopsyLayer.getBounds();
  }

  addBiopsyTiles(tiles) {
    this.biopsyLayer.addLocatedTiles(locateTiles(tiles, tileSize.biopsyDownsamplings));
  }

  addMaskTiles(tiles) {
    this.maskLayer.addLocatedTiles(locateTiles(tiles, tileSize.maskDownsamplings));
  }

  draw(ctx, camera, highlightAmt) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.fillStyle = 'grey';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    this.biopsyLayer.draw(ctx, camera, null, 'black');
    this.maskLayer.draw(ctx, camera, () => {
      ctx.globalAlpha = highlightAmt;
      ctx.globalCompositeOperation = 'multiply';
    }, null);
  }

}

// holds several GridLayers all of the same kind of tiles
// but with different downsampling, alllowing efficient yet detailed zooming
class ZoomableGridLayer {
  constructor(downsamplings, imageLoader, drawingOptions) {
    // maps {downsampling -> GridLayer}
    this.layers = new Map();
    for (const downsampling of downsamplings) {
      this.layers.set(downsampling, new GridLayer(downsampling, imageLoader, drawingOptions));
    }
  }

  getBounds() {
    let width = 0, height = 0;
    this.layers.forEach(layer => {
      const [layerWidth, layerHeight] = layer.getBounds();
      width = Math.max(width, layerWidth);
      height = Math.max(height, layerHeight);
    });
    return [width, height];
  }

  // incorporate tiles whose positions have been determined (by tiles/locateTiles)
  // and are given in the form {row, colunm, src, downsampling}
  addLocatedTiles(locatedTiles) {
    let bins = new Map();
    for (const {row, column, src, downsampling} of locatedTiles) {
      if (!bins.has(downsampling)) {
        bins.set(downsampling, []);
      }
      bins.get(downsampling).push({row, column, src});
    }
    bins.forEach((bin, downsampling) => {
      this.layers.get(downsampling).addLocatedTiles(bin);
    });
  }

  draw(ctx, camera, setStyle, previewColor) {
    if (this.layers.size == 0) return;
    
    // TODO: use tiles from different layers based on availability

    let bestDownsampling = null, bestCost = null;
    for (const downsampling of this.layers.keys()) {
      // the amount a tile is scaled to draw for this camera.zoom
      // pick downsampling that makes this closest to 1
      const scale = camera.zoom * downsampling;
      const cost = Math.abs(Math.log(scale));
      
      if (bestDownsampling == null || cost < bestCost) {
        bestDownsampling = downsampling;
        bestCost = cost;
      }
    }
    this.layers.get(bestDownsampling).draw(ctx, camera, setStyle, previewColor);
  }
}

// holds tiles of a single type and downsampling
// allows adding more, as well as drawing itself to a canvas
class GridLayer {
  constructor(downsampling, imageLoader) {
    this.numRows = 0;
    this.numColumns = 0;
    // indexed [row][column]
    this.tiles = [];
    this.downsampling = downsampling;
    this.imageLoader = imageLoader;
  }

  getBounds() {
    return cellToBiopsy(this.numRows, this.numColumns, this.downsampling);
  }

  // incorporate tiles whose positions have been determined 
  // and are given in the form {row, colunm, src}
  addLocatedTiles(locatedTiles) {
    for (const {row, column, src} of locatedTiles) {
      this.numRows = Math.max(this.numRows, row + 1);
      this.numColumns = Math.max(this.numColumns, column + 1);
    }
    // does nothing if size unchanged
    expand2dArray(this.tiles, this.numRows, this.numColumns);

    for (const {row, column, src} of locatedTiles) {
      this.tiles[row][column] = src;
    }
  }

  // determine which cells are visible in a given rectangle
  findCellsInArea([x, y, w, h]) {
    let [minRow, minColumn] = biopsyToCell(x, y, this.downsampling);
    minRow    = Math.max(minRow, 0);
    minColumn = Math.max(minColumn, 0);

    let [maxRow, maxColumn] = biopsyToCell(x + w, y + h, this.downsampling);
    maxRow    = Math.min(maxRow,    this.numRows - 1);
    maxColumn = Math.min(maxColumn, this.numColumns - 1);

    return [[minRow, minColumn], [maxRow, maxColumn]];
  }

  draw(ctx, camera, setStyle, previewColor) {
    const canvasSize = {width: ctx.canvas.width, height: ctx.canvas.height};
    
    const viewArea = [
      ...canvasToBiopsy(0, 0, camera, canvasSize),
      ...canvasDeltaToBiopsy(canvasSize.width, canvasSize.height, camera)
    ];
    const [[minRow, minColumn], [maxRow, maxColumn]] = this.findCellsInArea(viewArea, camera);
    
    const numCells = (maxRow + 1 - minRow) * (maxColumn + 1 - minColumn);
    if (numCells > tileCounts.maxTilesToDrawPerLayer) {
      console.log(numCells);
      return;
    }

    for (let row = minRow; row <= maxRow; row++) {
      for (let column = minColumn; column <= maxColumn; column++) {
        const [x, y] = cellToCanvas(row, column, camera, canvasSize, this.downsampling);
        const displayTileWidth = tileSize.width * this.downsampling * camera.zoom;
        
        const src = this.tiles[row][column];
        const image = this.imageLoader.get(src);
        if (image == null) {
          // TODO redraw upon load
          this.imageLoader.load(src);

          if (previewColor != null) {
            ctx.save();
            ctx.fillStyle = previewColor;
            ctx.fillRect(x, y, displayTileWidth, displayTileWidth);
            ctx.restore();
          }
        }else {
          ctx.save();
          if (setStyle != null) setStyle();
          ctx.drawImage(image, x, y, displayTileWidth, displayTileWidth);
          ctx.restore();
        }
      }
    }
  }
}
