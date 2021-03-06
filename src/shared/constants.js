
// the original data is: 512px @ 3x downsampling
// this is reduced to: {128px @ 12x} for training
// so anything of the form {128*N px @ 3*N} can be used here
let tileSize = {
  width: 256,
  downsampling: 6
};
tileSize.realWidth = tileSize.width * tileSize.downsampling;

module.exports = {
  channels: {
    // ({select}) -> main
    // main -> ({version})
    // main -> ({error})
    FIND_QUPATH: 'find-qupath',

    // () -> main
    // main -> ({path})
    OPEN_IMAGE: 'open-image',

    // ({image}) -> main
    // main -> ({tiles})
    TILES: 'tiles',

    // main -> ({tiles})
    TILE_MASKS: 'tile-masks'
  },
  tileSize,
  settingsStoreKeys: {
    QUPATH_PATH: 'qupath-path'
  }
};
