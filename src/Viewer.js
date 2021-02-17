import { useEffect, useRef, useState } from 'react';
import { biopsy_tiles, mask_tiles, tile_width } from './tiles'
import './Viewer.css'
import ImageLoader from './ImageLoader'

const display_tile_width = tile_width / 2;

function Viewer(props) {
  const canvasRef = useRef(null);
  const imageLoaderRef = useRef(new ImageLoader())
  const [scroll, setScroll] = useState({x: 0, y: 0});
  const [highlightAmt, setHighlightAmt] = useState(0.5)

  function grid_to_canvas_coord(row, column) {
    return {
      x: column * display_tile_width - scroll.x, 
      y: row * display_tile_width - scroll.y
    };
  }

  function canvas_to_grid_coord(x, y) {
    return {
      row: Math.floor((y + scroll.y) / display_tile_width),
      column: Math.floor((x + scroll.x) / display_tile_width)
    };
  }

  function drawTile(ctx, src, row, column, setStyle) {
    // TODO: dont draw null tiles - where?
    imageLoaderRef.current.loadImage(src, (img) => {

      const {x, y} = grid_to_canvas_coord(row, column);
      
      // TODO: this check is now redundant
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

    let min_cell = canvas_to_grid_coord(0, 0);
    let max_cell = canvas_to_grid_coord(ctx.canvas.width, ctx.canvas.height);
    min_cell.row = Math.max(min_cell.row, 0);
    min_cell.column = Math.max(min_cell.column, 0);
    
    const grid_width = biopsy_tiles.length;
    const grid_height = biopsy_tiles[0].length;
    
    max_cell.row = Math.min(max_cell.row, grid_height - 1);
    max_cell.column = Math.min(max_cell.column, grid_width - 1);

    for (let row = min_cell.row; row <= max_cell.row; row++) {
      for (let column = min_cell.column; column <= max_cell.column; column++) {
          drawTile(ctx, biopsy_tiles[row][column], row, column);
          drawTile(ctx, mask_tiles[row][column], row, column, () => {
            ctx.globalAlpha = highlightAmt;
            ctx.globalCompositeOperation = 'screen'
          });
      }
    }
  })

  return (
    <div id="viewer">
      <div>
        <canvas
          ref={canvasRef} 
          width={props.width} 
          height={props.height} 
        />
      </div>
      <label>Highlight
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.01"
          value={highlightAmt} 
          onChange={e => setHighlightAmt(e.target.value)}
        />
      </label>
    </div>
  )
}

export default Viewer;
