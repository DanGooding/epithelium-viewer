
const maskDownsamplings = [8];
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
    width: 512,
    maskDownsamplings,
    biopsyDownsamplings
  },
  settingsStoreKeys: {
    QUPATH_PATH: 'qupath-path'
  }
};
