
// 'images/5096 HE.tif - Series 0/5096 HE.tif - Series 0 [x=10752,y=9216,w=1536,h=1536].png';
// 'images/5096 HE.tif - Series 0/5096 HE.tif - Series 0 [x=10752,y=9216,w=1536,h=1536]-labelled.png';

// TODO: grid may not be full rectangle, just request nonexistent image?
export const tile_width = 512;

const all_tiles = [
  'images/5096 HE.tif - Series 0/5096 HE.tif - Series 0 [x=9216,y=7680,w=1536,h=1536].png',
  'images/5096 HE.tif - Series 0/5096 HE.tif - Series 0 [x=9216,y=9216,w=1536,h=1536].png',
  'images/5096 HE.tif - Series 0/5096 HE.tif - Series 0 [x=9216,y=10752,w=1536,h=1536].png',
  'images/5096 HE.tif - Series 0/5096 HE.tif - Series 0 [x=9216,y=12288,w=1536,h=1536].png',
  'images/5096 HE.tif - Series 0/5096 HE.tif - Series 0 [x=10752,y=7680,w=1536,h=1536].png',
  'images/5096 HE.tif - Series 0/5096 HE.tif - Series 0 [x=10752,y=9216,w=1536,h=1536].png',
  'images/5096 HE.tif - Series 0/5096 HE.tif - Series 0 [x=10752,y=10752,w=1536,h=1536].png',
  'images/5096 HE.tif - Series 0/5096 HE.tif - Series 0 [x=10752,y=12288,w=1536,h=1536].png',
  'images/5096 HE.tif - Series 0/5096 HE.tif - Series 0 [x=12288,y=7680,w=1536,h=1536].png',
  'images/5096 HE.tif - Series 0/5096 HE.tif - Series 0 [x=12288,y=9216,w=1536,h=1536].png',
  'images/5096 HE.tif - Series 0/5096 HE.tif - Series 0 [x=12288,y=10752,w=1536,h=1536].png',
  'images/5096 HE.tif - Series 0/5096 HE.tif - Series 0 [x=12288,y=12288,w=1536,h=1536].png',
  'images/5096 HE.tif - Series 0/5096 HE.tif - Series 0 [x=13824,y=7680,w=1536,h=1536].png',
  'images/5096 HE.tif - Series 0/5096 HE.tif - Series 0 [x=13824,y=9216,w=1536,h=1536].png',
  'images/5096 HE.tif - Series 0/5096 HE.tif - Series 0 [x=13824,y=10752,w=1536,h=1536].png',
  'images/5096 HE.tif - Series 0/5096 HE.tif - Series 0 [x=13824,y=12288,w=1536,h=1536].png',
  'images/5096 HE.tif - Series 0/5096 HE.tif - Series 0 [x=9216,y=7680,w=1536,h=1536]-labelled.png',
  'images/5096 HE.tif - Series 0/5096 HE.tif - Series 0 [x=9216,y=9216,w=1536,h=1536]-labelled.png',
  'images/5096 HE.tif - Series 0/5096 HE.tif - Series 0 [x=9216,y=10752,w=1536,h=1536]-labelled.png',
  'images/5096 HE.tif - Series 0/5096 HE.tif - Series 0 [x=9216,y=12288,w=1536,h=1536]-labelled.png',
  'images/5096 HE.tif - Series 0/5096 HE.tif - Series 0 [x=10752,y=7680,w=1536,h=1536]-labelled.png',
  'images/5096 HE.tif - Series 0/5096 HE.tif - Series 0 [x=10752,y=9216,w=1536,h=1536]-labelled.png',
  'images/5096 HE.tif - Series 0/5096 HE.tif - Series 0 [x=10752,y=10752,w=1536,h=1536]-labelled.png',
  'images/5096 HE.tif - Series 0/5096 HE.tif - Series 0 [x=10752,y=12288,w=1536,h=1536]-labelled.png',
  'images/5096 HE.tif - Series 0/5096 HE.tif - Series 0 [x=12288,y=7680,w=1536,h=1536]-labelled.png',
  'images/5096 HE.tif - Series 0/5096 HE.tif - Series 0 [x=12288,y=9216,w=1536,h=1536]-labelled.png',
  'images/5096 HE.tif - Series 0/5096 HE.tif - Series 0 [x=12288,y=10752,w=1536,h=1536]-labelled.png',
  'images/5096 HE.tif - Series 0/5096 HE.tif - Series 0 [x=12288,y=12288,w=1536,h=1536]-labelled.png',
  'images/5096 HE.tif - Series 0/5096 HE.tif - Series 0 [x=13824,y=7680,w=1536,h=1536]-labelled.png',
  'images/5096 HE.tif - Series 0/5096 HE.tif - Series 0 [x=13824,y=9216,w=1536,h=1536]-labelled.png',
  'images/5096 HE.tif - Series 0/5096 HE.tif - Series 0 [x=13824,y=10752,w=1536,h=1536]-labelled.png',
  'images/5096 HE.tif - Series 0/5096 HE.tif - Series 0 [x=13824,y=12288,w=1536,h=1536]-labelled.png',
];


const tile_pattern = /\[x=(\d+),y=(\d+),w=(\d+),h=(\d+)\](-labelled)?.png$/;

let min_x = null, min_y = null, max_x = null, max_y = null;
// assumes all same dimension
let src_w
const located_tiles = all_tiles.map(src => {
  const match = tile_pattern.exec(src)
  const x = parseInt(match[1])
  const y = parseInt(match[2])
  src_w = parseInt(match[3])
  const is_mask = match[5] != null
  
  if (min_x == null || x < min_x) min_x = x;
  if (max_x == null || x > max_x) max_x = x;
  if (min_y == null || y < min_y) min_y = y;
  if (max_y == null || y > max_y) max_y = y;

  return [[x,y], is_mask, src];
})

export const num_rows = Math.round((max_y - min_y) / src_w + 1)
export const num_columns = Math.round((max_x - min_x) / src_w + 1)
// [row][column]
export let biopsy_tiles = [];
export let mask_tiles = [];

for (let tiles of [biopsy_tiles, mask_tiles]) {
  for (let r = 0; r < num_rows; r++) {
    let row = []
    for (let c = 0; c < num_columns; c++) {
      row.push(null);
    }
    tiles.push(row);
  }
}

for (const [[x,y], is_mask, src] of located_tiles) {
  const row = (y - min_y) / src_w;
  const column = (x - min_x) / src_w;

  if (is_mask) {
    mask_tiles[row][column] = src
  }else {
    biopsy_tiles[row][column] = src
  }
}



// open tif
// server gives list of image tiles straight away (all at once)
  // may give grid dimensions first
// then feeds list of mask tiles slowly

