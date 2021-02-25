
let tileSize = {
  width: 512,
  downsampling: 8
};
tileSize.realWidth = tileSize.width * tileSize.downsampling;

module.exports = {
  channels: {
    TILES: 'tiles',
    QUPATH_CHECK: 'qupath-check'
  },
  tileSize
};
