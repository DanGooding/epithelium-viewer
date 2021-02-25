
import { tileSize } from './shared/constants';

const tilePattern = /\[x=(\d+),y=(\d+),w=(\d+),h=(\d+)\](-labelled)?.png$/;

// add *new* tiles to the grid(s)
export function updateTileGrid(grid, newTiles) {

  let maxRow = grid.height - 1;
  let maxColumn = grid.width - 1;

  const locatedTiles = newTiles.map(src => {

    const match = tilePattern.exec(decodeURI(src))
    const x = parseInt(match[1]);
    const y = parseInt(match[2]);
    const w = parseInt(match[3]);
    const h = parseInt(match[4]);
    if (x % tileSize.realWidth != 0 || y % tileSize.realWidth != 0) {
      console.error(`unexpected tile position: ${x} ${y}`);
    }
    if (w != tileSize.realWidth || h != tileSize.realWidth) {
      console.error(`unexpected tile size: ${w} ${h}`);
    }
    
    const isMask = match[5] != null;
    
    const row    = y / tileSize.realWidth;
    const column = x / tileSize.realWidth;

    maxRow = Math.max(maxRow, row);
    maxColumn = Math.max(maxColumn, column);

    return {row, column, isMask, src};
  })

  let newGrid = {
    biopsyTiles: [],
    maskTiles: [],
    height: maxRow + 1,
    width: maxColumn + 1
  };

  for (let tileType of ['biopsyTiles', 'maskTiles']) {
    for (let r = 0; r < newGrid.height; r++) {
      if (r < grid.height) { // copy & extend existing row
        let row = grid[tileType][r].slice();
        for (let c = grid.width; c < newGrid.width; c++) {
          row.push(null);
        }
        newGrid[tileType].push(row);

      }else { // add completely new row
        let row = [];
        for (let c = 0; c < newGrid.width; c++) {
          row.push(null);
        }
        newGrid[tileType].push(row);
      }
    }
  }

  for (const {row, column, isMask, src} of locatedTiles) {
    if (isMask) {
      newGrid.maskTiles[row][column] = src;
    } else {
      newGrid.biopsyTiles[row][column] = src;
    }
  }

  return newGrid;
}
