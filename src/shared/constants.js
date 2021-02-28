
let tileSize = {
  width: 512,
  downsampling: 8
};
tileSize.realWidth = tileSize.width * tileSize.downsampling;

module.exports = {
  channels: {
    FIND_QUPATH: 'find-qupath',
    OPEN_IMAGE: 'open-image',
    TILES: 'tiles',
    TILE_MASKS: 'tile-masks'
  },
  tileSize
};
