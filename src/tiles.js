
import { tileSize } from './shared/constants';

const tilePattern = /\[x=(\d+),y=(\d+),w=(\d+),h=(\d+)\].png$/;

function locateTiles(tiles) {
  let maxRow = 0, maxColumn = 0;

  const locatedTiles = tiles.map(src => {

    const match = tilePattern.exec(decodeURI(src));
    if (match == null) {
      console.error(`invalid tile path: ${src}`)
    }
    const [x, y, w, h] = match.slice(1, 5).map(n => parseInt(n));

    if (x % tileSize.realWidth != 0 || y % tileSize.realWidth != 0) {
      console.error(`unexpected tile position: ${x} ${y}`);
    }
    if (w != tileSize.realWidth || h != tileSize.realWidth) {
      console.error(`unexpected tile size: ${w} ${h}`);
    }
    
    const row    = y / tileSize.realWidth;
    const column = x / tileSize.realWidth;

    maxRow = Math.max(maxRow, row);
    maxColumn = Math.max(maxColumn, column);

    return {row, column, src};
  });

  return {locatedTiles, maxRow, maxColumn};
}

function shallowCopy2dArray(arr) {
  let newArr = [];
  for (const row of arr) {
    newArr.push(row.slice());
  }
  return newArr;
}

function expand2dArray(arr, newHeight, newWidth) {
  for (let r = 0; r < newHeight; r++) {
    if (r >= arr.length) {
      arr.push([]);
    }
    let row = arr[r];
    for (let c = row.length; c < newWidth; c++) {
      row.push(null);
    }
  }
}

// add *new* tiles to the grid(s)
export function updateTileGrid(grid, newTiles, areMasks) {
  const { locatedTiles, maxRow, maxColumn } = locateTiles(newTiles);

  let newGrid = {
    height: Math.max(grid.height, maxRow + 1),
    width: Math.max(grid.width, maxColumn + 1),
    biopsyTiles: shallowCopy2dArray(grid.biopsyTiles),
    maskTiles: shallowCopy2dArray(grid.maskTiles)
  };

  expand2dArray(newGrid.biopsyTiles, newGrid.height, newGrid.width);
  expand2dArray(newGrid.maskTiles, newGrid.height, newGrid.width);

  for (const {row, column, src} of locatedTiles) {
    (areMasks ? newGrid.maskTiles : newGrid.biopsyTiles)[row][column] = src;
  }

  return newGrid;
}
