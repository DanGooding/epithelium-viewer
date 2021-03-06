
import { tileSize } from './shared/constants';

const tileNamePattern = /\[x=(\d+),y=(\d+),w=(\d+),h=(\d+)\].png$/;

// parse tile filenames as produced by QuPaths TileExporter
// to discover their location and size
export function locateTiles(tiles, possibleDownsamplings) {

  return tiles.map(src => {

    const match = tileNamePattern.exec(decodeURI(src));
    if (match == null) {
      console.error(`invalid tile path: ${src}`)
    }
    const [x, y, w, h] = match.slice(1, 5).map(n => parseInt(n));
    if (w != h) {
      console.error(`non square tile: ${w} x ${h}`);
    }
    if (w % tileSize.width != 0) {
      console.error(`unexpected tile size: ${w}`);
    }
    const downsampling = w / tileSize.width;
    if (!possibleDownsamplings.includes(downsampling)) {
      console.error(`unexpected tile downsampling: ${downsampling}`);
    }
    if (x % w != 0 || y % w != 0) {
      console.error(`unexpected tile position: ${x} ${y}`);
    }

    const row    = y / w;
    const column = x / w;

    return {row, column, downsampling, src};
  });
}

//creates new arrays for the structure, but keeps the old elements
export function shallowCopy2dArray(arr) {
  let newArr = [];
  for (const row of arr) {
    newArr.push(row.slice());
  }
  return newArr;
}

// make a 2d array larger by adding nulls
export function expand2dArray(arr, newHeight, newWidth) {
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

// 3 coordinate systems:
// - biopsy: [x,y] pixels in the source TIF
// - canvas: [x,y] pixels in the canvas
// - cell: [row,column] in a particular grid layer

// camera is as in Viewer.state: {x, y, zoom}

export function biopsyToCanvas(x, y, camera, canvasSize) {
  return [
    (x - camera.x) * camera.zoom + canvasSize.width / 2,
    (y - camera.y) * camera.zoom + canvasSize.height / 2
  ];
}

export function canvasToBiopsy(x, y, camera, canvasSize) {
  return [
    (x - canvasSize.width  / 2) / camera.zoom + camera.x,
    (y - canvasSize.height / 2) / camera.zoom + camera.y
  ];
}

export function biopsyDeltaToCanvas(dx, dy, camera) {
  return [dx * camera.zoom, dy * camera.zoom];
}

export function canvasDeltaToBiopsy(dx, dy, camera) {
  return [dx / camera.zoom, dy / camera.zoom];
}

export function biopsyToCell(x, y, downsampling) {
  return [
    Math.floor(y / (tileSize.width * downsampling)),
    Math.floor(x / (tileSize.width * downsampling))
  ];
}

export function cellToBiopsy(row, column, downsampling) {
  return [
    column * tileSize.width * downsampling,
    row    * tileSize.width * downsampling
  ];
}

export function canvasToCell(x, y, camera, canvasSize, downsampling) {
  const [biopsyX, biopsyY] = canvasToBiopsy(x, y, camera, canvasSize);
  return biopsyToCell(biopsyX, biopsyY, downsampling);
}

export function cellToCanvas(row, column, camera, canvasSize, downsampling) {
  const [biopsyX, biopsyY] = cellToBiopsy(row, column, downsampling);
  return biopsyToCanvas(biopsyX, biopsyY, camera, canvasSize);
}
