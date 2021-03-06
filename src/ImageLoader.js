const LRUCache = require('lru-cache');

// loads images (html image elements) for given sources, caching some amount
class ImageLoader {

  constructor(cacheSize) {
    // Map<src, {image: Image, loaded: bool}>
    this.images = new LRUCache({
      max: cacheSize // TODO calibrate
    });
    // TODO: use image dimensions/size
  }

  get(src) {
    if (!this.images.has(src)) {
      return null;
    }
    const { image, loaded } = this.images.get(src);
    return loaded ? image : null;
  }

  load(src, onload) {
    if (src == null) {
      return;
    }

    if (this.images.has(src)) {
      if (onload != null) onload(this.images.get(src));

    } else {
      let image = new Image();
      image.onerror = error => console.error(error);
      const entry = {image, loaded: false};
      this.images.set(src, entry);
      image.onload = () => {
        entry.loaded = true;
        if (onload != null) onload(image);
      };
      image.src = src;
    }
  }
}

export default ImageLoader
