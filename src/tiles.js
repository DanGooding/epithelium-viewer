
// 'images/5096 HE.tif - Series 0/5096 HE.tif - Series 0 [x=10752,y=9216,w=1536,h=1536].png';
// 'images/5096 HE.tif - Series 0/5096 HE.tif - Series 0 [x=10752,y=9216,w=1536,h=1536]-labelled.png';

// TODO: grid may not be full rectangle, just request nonexistent image?
export const tile_width = 512;

// [column][row]
export const biopsy_tiles = [
  [
      'images/5096 HE.tif - Series 0/5096 HE.tif - Series 0 [x=9216,y=7680,w=1536,h=1536].png',
      'images/5096 HE.tif - Series 0/5096 HE.tif - Series 0 [x=9216,y=9216,w=1536,h=1536].png',
      'images/5096 HE.tif - Series 0/5096 HE.tif - Series 0 [x=9216,y=10752,w=1536,h=1536].png',
      'images/5096 HE.tif - Series 0/5096 HE.tif - Series 0 [x=9216,y=12288,w=1536,h=1536].png',
  ],
  [
      'images/5096 HE.tif - Series 0/5096 HE.tif - Series 0 [x=10752,y=7680,w=1536,h=1536].png',
      'images/5096 HE.tif - Series 0/5096 HE.tif - Series 0 [x=10752,y=9216,w=1536,h=1536].png',
      'images/5096 HE.tif - Series 0/5096 HE.tif - Series 0 [x=10752,y=10752,w=1536,h=1536].png',
      'images/5096 HE.tif - Series 0/5096 HE.tif - Series 0 [x=10752,y=12288,w=1536,h=1536].png',
  ],
  [
    'images/5096 HE.tif - Series 0/5096 HE.tif - Series 0 [x=12288,y=7680,w=1536,h=1536].png',
    'images/5096 HE.tif - Series 0/5096 HE.tif - Series 0 [x=12288,y=9216,w=1536,h=1536].png',
    'images/5096 HE.tif - Series 0/5096 HE.tif - Series 0 [x=12288,y=10752,w=1536,h=1536].png',
    'images/5096 HE.tif - Series 0/5096 HE.tif - Series 0 [x=12288,y=12288,w=1536,h=1536].png',
  ],
  [
    'images/5096 HE.tif - Series 0/5096 HE.tif - Series 0 [x=13824,y=7680,w=1536,h=1536].png',
    'images/5096 HE.tif - Series 0/5096 HE.tif - Series 0 [x=13824,y=9216,w=1536,h=1536].png',
    'images/5096 HE.tif - Series 0/5096 HE.tif - Series 0 [x=13824,y=10752,w=1536,h=1536].png',
    'images/5096 HE.tif - Series 0/5096 HE.tif - Series 0 [x=13824,y=12288,w=1536,h=1536].png',
  ],

];
export const mask_tiles = [
  [
    'images/5096 HE.tif - Series 0/5096 HE.tif - Series 0 [x=9216,y=7680,w=1536,h=1536]-labelled.png',
    'images/5096 HE.tif - Series 0/5096 HE.tif - Series 0 [x=9216,y=9216,w=1536,h=1536]-labelled.png',
    'images/5096 HE.tif - Series 0/5096 HE.tif - Series 0 [x=9216,y=10752,w=1536,h=1536]-labelled.png',
    'images/5096 HE.tif - Series 0/5096 HE.tif - Series 0 [x=9216,y=12288,w=1536,h=1536]-labelled.png',
  ],
  [
      'images/5096 HE.tif - Series 0/5096 HE.tif - Series 0 [x=10752,y=7680,w=1536,h=1536]-labelled.png',
      'images/5096 HE.tif - Series 0/5096 HE.tif - Series 0 [x=10752,y=9216,w=1536,h=1536]-labelled.png',
      'images/5096 HE.tif - Series 0/5096 HE.tif - Series 0 [x=10752,y=10752,w=1536,h=1536]-labelled.png',
      'images/5096 HE.tif - Series 0/5096 HE.tif - Series 0 [x=10752,y=12288,w=1536,h=1536]-labelled.png',
  ],
  [
    'images/5096 HE.tif - Series 0/5096 HE.tif - Series 0 [x=12288,y=7680,w=1536,h=1536]-labelled.png',
    'images/5096 HE.tif - Series 0/5096 HE.tif - Series 0 [x=12288,y=9216,w=1536,h=1536]-labelled.png',
    'images/5096 HE.tif - Series 0/5096 HE.tif - Series 0 [x=12288,y=10752,w=1536,h=1536]-labelled.png',
    'images/5096 HE.tif - Series 0/5096 HE.tif - Series 0 [x=12288,y=12288,w=1536,h=1536]-labelled.png',
  ],
  [
    'images/5096 HE.tif - Series 0/5096 HE.tif - Series 0 [x=13824,y=7680,w=1536,h=1536]-labelled.png',
    'images/5096 HE.tif - Series 0/5096 HE.tif - Series 0 [x=13824,y=9216,w=1536,h=1536]-labelled.png',
    'images/5096 HE.tif - Series 0/5096 HE.tif - Series 0 [x=13824,y=10752,w=1536,h=1536]-labelled.png',
    'images/5096 HE.tif - Series 0/5096 HE.tif - Series 0 [x=13824,y=12288,w=1536,h=1536]-labelled.png',
  ],
];




// open tif
// server gives list of image tiles straight away (all at once)
  // may give grid dimensions first
// then feeds list of mask tiles slowly









