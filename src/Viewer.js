import { useEffect, useRef, useState } from 'react';
import { biopsy_tiles, mask_tiles, tile_width } from './tiles'
import './Viewer.css'
import ImageLoader from './ImageLoader'

function Viewer(props) {
  const canvasRef = useRef(null);
  const imageLoaderRef = useRef(new ImageLoader())
  const [cameraPos, setCameraPos] = useState({x: 0, y: 0});
  const [zoomAmt, setZoomAmt] = useState(1.0);
  const [highlightAmt, setHighlightAmt] = useState(0.5)

  // TODO: track zooming to mouse
  function grid_to_canvas({x, y}) {
    return {
      x: (x - cameraPos.x) * zoomAmt + props.width / 2, 
      y: (y - cameraPos.y) * zoomAmt + props.height / 2
    };
  }

  function canvas_to_grid({x, y}) {
    return {
      x: (x - props.width / 2) / zoomAmt + cameraPos.x,
      y: (y - props.height / 2) / zoomAmt + cameraPos.y
    };
  }

  function grid_coord_to_cell({x, y}) {
    return {
      row: Math.floor(y / tile_width),
      column: Math.floor(x / tile_width)
    };
  }

  function grid_cell_to_coord({row, column}) {
    return  {
      x: column * tile_width,
      y: row * tile_width
    };
  }

  function drawTile(ctx, src, row, column, setStyle) {
    if (src == null) return;
    imageLoaderRef.current.loadImage(src, (img) => {

      const {x, y} = grid_to_canvas(grid_cell_to_coord({row, column}));
      const display_tile_width = tile_width * zoomAmt;

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
    ctx.fillStyle = 'grey';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    let min_cell = grid_coord_to_cell(canvas_to_grid({x: 0, y: 0}));
    let max_cell = grid_coord_to_cell(canvas_to_grid({x: ctx.canvas.width, y: ctx.canvas.height}));
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

  function handleMouseMove(e) { // pan
    if (e.buttons != 0) { // if dragging
      setCameraPos({
        x: cameraPos.x - e.movementX / zoomAmt, 
        y: cameraPos.y - e.movementY / zoomAmt
      });
    }
  }
  function handleWheel(e) { // zoom
    // TODO: can't preventdefault here?
    if (e.deltaY < 0) {
      setZoomAmt(Math.min(zoomAmt / 0.9, 5));
    }else if (e.deltaY > 0) {
      setZoomAmt(Math.max(zoomAmt * 0.9, 0.2));
    }
  }

  return (
    <div id="viewer">
      <div>
        <canvas
          ref={canvasRef} 
          width={props.width} 
          height={props.height} 
          onMouseMove={handleMouseMove}
          onWheel={handleWheel}
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
