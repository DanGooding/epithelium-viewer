
let tileSize = {
  width: 512,
  downsampling: 8
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
  tileSize
};
