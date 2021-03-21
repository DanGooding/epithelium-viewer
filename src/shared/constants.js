
// the original data is: 512px @ 3x downsampling
// this is reduced to: {128px @ 12x} for training
// so anything of the form {128*N px @ 3*N} can be used here
const tileWidth = 512;
const maskDownsamplings = [3];
const biopsyDownsamplings = [...maskDownsamplings, 8, 16];

module.exports = {
  channels: {
    // render -> ({select: bool}) -> main
    // main -> ({version}) -> render
    // main -> ({error}) -> render
    FIND_QUPATH: 'find-qupath',

    // render -> () -> main
    // main -> ({path}) -> render
    OPEN_IMAGE: 'open-image',

    // render -> () -> main
    CLOSE_IMAGE: 'close-image',

    // render -> ({image}) -> main
    // main -> ({tiles: [string]}) -> render
    // main -> ({error}) -> render
    TILES: 'tiles',

    // main -> ({tiles: [string]}) -> render
    // main -> ({error}) -> render
    TILE_MASKS: 'tile-masks'
  },
  tileSize: {
    // actual width of the (square) image files
    width: tileWidth,
    maskDownsamplings,
    biopsyDownsamplings
  },
  settingsStoreKeys: {
    QUPATH_PATH: 'qupath-path'
  },
  tileCounts: {
    cacheSize: 600,
    maxTilesToDrawPerLayer: 300
  }
};
