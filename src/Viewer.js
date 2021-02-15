import { useEffect, useRef } from 'react';
import { biopsy_tiles, mask_tiles, tile_width } from './tiles'
import './Viewer.css'

function Viewer(props) {

  const canvasRef = useRef(null);

  useEffect(() => {
    const ctx = canvasRef.current.getContext('2d');

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
    
 
  })

  return (
    <div id="viewer">
      <canvas ref={canvasRef} width={props.width} height={props.height} />
    </div>
  )
}

export default Viewer;
