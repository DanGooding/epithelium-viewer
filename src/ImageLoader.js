const LRUCache = require('lru-cache');

class ImageLoader {

  constructor() {
    // Map<src, Image>
    this.images = new LRUCache({
      max: 200 // TODO calibrate
    });
    // TODO: use image dimensions/size
  }

  loadImage(src, onload) {
    if (src == null) {
      return;
    }

    if (this.images.has(src)) {
      onload(this.images.get(src))
    } else {
      let img = new Image()
      img.onerror = e => console.error(e)
      this.images.set(src, img)
      img.onload = () => onload(this.images.get(src));
      img.src = src
    }
  }
}

export default ImageLoader
