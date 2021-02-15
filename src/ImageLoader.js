
class ImageLoader {

  constructor() {
    // src: Image
    this.images = new Map()
    // TODO: eviction
  }

  loadImage(src, onload) {
    if (this.images.has(src)) {
      onload(this.images.get(src))
    }else {
      let img = new Image()
      this.images.set(src, img)
      img.onload = () => onload(this.images.get(src))
      img.src = src
    }
  }
}

export default ImageLoader
