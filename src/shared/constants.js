
let tileSize = {
  width: 512,
  downsampling: 8
};
tileSize.realWidth = tileSize.width * tileSize.downsampling;

module.exports = {
  channels: {
    QUPATH_CHECK: 'qupath-check',
    TILES: 'tiles',
    TILE_MASKS: 'tile-masks'
  },
  tileSize
};
