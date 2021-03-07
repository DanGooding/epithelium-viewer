
import { tileSize } from './shared/constants';
import { locateTiles, expand2dArray, canvasToCell, cellToCanvas, cellToBiopsy } from './tiles';

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

  draw(ctx, cameraPos, zoomAmt, highlightAmt) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.fillStyle = 'grey';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    this.biopsyLayer.draw(ctx, cameraPos, zoomAmt, null, 'black');
    this.maskLayer.draw(ctx, cameraPos, zoomAmt, () => {
      ctx.globalAlpha = highlightAmt;
      ctx.globalCompositeOperation = 'multiply';
    }, null);
  }

}

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

  draw(ctx, cameraPos, zoomAmt, setStyle, previewColor) {
    if (this.layers.size == 0) return;
    
    // TODO: use tiles from different layers based on availability

    let bestDownsampling = null, bestCost = null;
    for (const downsampling of this.layers.keys()) {
      // the amount a tile is scaled to draw for this zoomAmt
      // pick downsampling that makes this closest to 1
      const scale = zoomAmt * downsampling;
      const cost = Math.abs(Math.log(scale));
      
      if (bestDownsampling == null || cost < bestCost) {
        bestDownsampling = downsampling;
        bestCost = cost;
      }
    }
    this.layers.get(bestDownsampling).draw(ctx, cameraPos, zoomAmt, setStyle, previewColor);
  }
}

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

  draw(ctx, cameraPos, zoomAmt, setStyle, previewColor) {
    const canvasSize = {width: ctx.canvas.width, height: ctx.canvas.height};
    
    // determine which cells are visible
    let [minRow, minColumn] = 
      canvasToCell(
        0, 0, 
        cameraPos, zoomAmt, canvasSize, this.downsampling);
    minRow    = Math.max(minRow, 0);
    minColumn = Math.max(minColumn, 0);

    let [maxRow, maxColumn] = 
      canvasToCell(
        canvasSize.width, canvasSize.height, 
        cameraPos, zoomAmt, canvasSize, this.downsampling);
    maxRow    = Math.min(maxRow,    this.numRows - 1);
    maxColumn = Math.min(maxColumn, this.numColumns - 1);

    for (let row = minRow; row <= maxRow; row++) {
      for (let column = minColumn; column <= maxColumn; column++) {
        const [x, y] = cellToCanvas(row, column, cameraPos, zoomAmt, canvasSize, this.downsampling);
        const displayTileWidth = tileSize.width * this.downsampling * zoomAmt;
        
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
