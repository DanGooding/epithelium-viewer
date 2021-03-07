
// the original data is: 512px @ 3x downsampling
// this is reduced to: {128px @ 12x} for training
// so anything of the form {128*N px @ 3*N} can be used here
const tileWidth = 256;
const maskDownsamplings = [6];
const biopsyDownsamplings = [...maskDownsamplings, 16];

module.exports = {
  channels: {
    // render -> ({select: bool}) -> main
    // main -> ({version}) -> render
    // main -> ({error}) -> render
    FIND_QUPATH: 'find-qupath',

    // render -> () -> main
    // main -> ({path}) -> render
    OPEN_IMAGE: 'open-image',

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
  }
};
