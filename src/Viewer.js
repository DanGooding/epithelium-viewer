import { useEffect, useRef } from 'react';
import { biopsy_tiles, mask_tiles, tile_width } from './tiles'
import './Viewer.css'

const display_tile_width = tile_width / 2;

function drawTile(ctx, src, row, column, setStyle) {
  const img = new Image();
  img.onload = () => {
    ctx.save()
    if (setStyle != null) setStyle();
    ctx.drawImage(img, 
      column * display_tile_width, 
      row * display_tile_width, 
      display_tile_width, 
      display_tile_width);
    ctx.restore()
  }
  img.src = src;
}

function Viewer(props) {

  const canvasRef = useRef(null);

  useEffect(() => {
    const ctx = canvasRef.current.getContext('2d');
    for (const [row, row_tiles] of biopsy_tiles.entries()) {
      for (const [column, src] of row_tiles.entries()) {
        drawTile(ctx, src, row, column);
      }
    }

    for (const [row, row_tiles] of mask_tiles.entries()) {
      for (const [column, src] of row_tiles.entries()) {
        drawTile(ctx, src, row, column, () => {
          ctx.globalAlpha = 0.7;
          ctx.globalCompositeOperation = 'multiply'
        })
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
