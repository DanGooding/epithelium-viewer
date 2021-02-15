import { useEffect, useRef, useState } from 'react';
import { biopsy_tiles, mask_tiles, tile_width } from './tiles'
import './Viewer.css'
import ImageLoader from './ImageLoader'

const display_tile_width = tile_width / 2;

function Viewer(props) {
  const canvasRef = useRef(null);
  const imageLoaderRef = useRef(new ImageLoader())
  const [scroll, setScroll] = useState({x: 0, y: 0});

  function drawTile(ctx, src, row, column, setStyle) {
    imageLoaderRef.current.loadImage(src, (img) => {

      const x = column * display_tile_width - scroll.x
      const y = row * display_tile_width - scroll.y
      
      if (x + display_tile_width < 0 || y + display_tile_width < 0
       || x > ctx.canvas.width || y > ctx.canvas.height) {
        return;
      }

      ctx.save()
      if (setStyle != null) setStyle();
      ctx.drawImage(img, 
        x, 
        y, 
        display_tile_width, 
        display_tile_width);
      ctx.restore()
    })
  }
  

  useEffect(() => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

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
  })

  return (
    <div id="viewer" onClick={() => setScroll({x: scroll.x + 20, y: scroll.y + 20})}>
      <canvas ref={canvasRef} width={props.width} height={props.height} />
    </div>
  )
}

export default Viewer;
