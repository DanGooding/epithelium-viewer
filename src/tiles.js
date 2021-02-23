
// TODO: grid may not be full rectangle, just request nonexistent image?
export const tileWidth = 512;

const tilePattern = /\[x=(\d+),y=(\d+),w=(\d+),h=(\d+)\](-labelled)?.png$/;

export function buildTileGrids(allTiles) {

  let minX = null, minY = null, maxX = null, maxY = null;
  // assumes all same dimension
  let srcW
  const locatedTiles = allTiles.map(src => {
    const match = tilePattern.exec(src)
    const x = parseInt(match[1])
    const y = parseInt(match[2])
    srcW = parseInt(match[3])
    const isMask = match[5] != null
    
    if (minX == null || x < minX) minX = x;
    if (maxX == null || x > maxX) maxX = x;
    if (minY == null || y < minY) minY = y;
    if (maxY == null || y > maxY) maxY = y;
  
    return [[x,y], isMask, src];
  })
  
  const height = Math.round((maxY - minY) / srcW + 1)
  const width = Math.round((maxX - minX) / srcW + 1)
  // [row][column]
  let biopsyTiles = [];
  let maskTiles = [];
  
  for (let tiles of [biopsyTiles, maskTiles]) {
    for (let r = 0; r < height; r++) {
      let row = []
      for (let c = 0; c < width; c++) {
        row.push(null);
      }
      tiles.push(row);
    }
  }
  
  for (const [[x,y], isMask, src] of locatedTiles) {
    const row = (y - minY) / srcW;
    const column = (x - minX) / srcW;
  
    if (isMask) {
      maskTiles[row][column] = src
    }else {
      biopsyTiles[row][column] = src
    }
  }

  return {
    height,
    width,
    biopsyTiles,
    maskTiles
  };
}
