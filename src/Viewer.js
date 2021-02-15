
import React from 'react';
import { biopsy_tiles, mask_tiles, tile_width } from './tiles'
import './Viewer.css'

class Viewer extends React.Component {
  constructor(props) {
    super(props);
    this.canvasRef = React.createRef();
  }

  componentDidMount() {
    const ctx = this.canvasRef.current.getContext('2d');

    const display_tile_width = tile_width / 2;

    for (const [row, row_tiles] of biopsy_tiles.entries()) {
      for (const [column, src] of row_tiles.entries()) {
        const img = new Image();
        img.onload = () => {
          ctx.save()
          ctx.drawImage(img, 
            column * display_tile_width, 
            row * display_tile_width, 
            display_tile_width, 
            display_tile_width);
          ctx.restore()
        }
        img.src = src;
      }
    }

    for (const [row, row_tiles] of mask_tiles.entries()) {
      for (const [column, src] of row_tiles.entries()) {
        const img = new Image();
        img.onload = () => {
          ctx.save()
          ctx.globalAlpha = 0.7;
          ctx.globalCompositeOperation = 'multiply'
          ctx.drawImage(img, 
            column * display_tile_width, 
            row * display_tile_width, 
            display_tile_width, 
            display_tile_width);
          ctx.restore()
        }
        img.src = src;
      }
    }

    // TODO: this method reloads images on every draw !!
    
 
  }

  render() {
    return (
      <div id="viewer">
        <canvas ref={this.canvasRef} width={this.props.width} height={this.props.height} />
      </div>
    )

  }

}

export default Viewer;
