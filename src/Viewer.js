import { useEffect, useRef, useState } from 'react';
import { tileWidth, buildTileGrids } from './tiles'
import './Viewer.css'
import ImageLoader from './ImageLoader'
import { channels } from './shared/constants';
const { ipcRenderer } = window;

function Viewer(props) {
  const canvasRef = useRef(null);
  const imageLoaderRef = useRef(new ImageLoader())
  const [cameraPos, setCameraPos] = useState({x: 0, y: 0});
  const [zoomAmt, setZoomAmt] = useState(1.0);
  const [highlightAmt, setHighlightAmt] = useState(0.5)
  const [grid, setGrid] = useState({biopsyTiles: [], maskTiles: [], width: 0, height: 0});

  useEffect(() => {
    ipcRenderer.send(channels.TILES);
    ipcRenderer.once(channels.TILES, (event, {tiles}) => {
      setGrid(buildTileGrids(tiles));
    });
  }, []);

  // TODO: track zooming to mouse
  function gridToCanvas({x, y}) {
    return {
      x: (x - cameraPos.x) * zoomAmt + props.width / 2, 
      y: (y - cameraPos.y) * zoomAmt + props.height / 2
    };
  }

  function canvasToGrid({x, y}) {
    return {
      x: (x - props.width / 2) / zoomAmt + cameraPos.x,
      y: (y - props.height / 2) / zoomAmt + cameraPos.y
    };
  }

  function gridCoordToCell({x, y}) {
    return {
      row: Math.floor(y / tileWidth),
      column: Math.floor(x / tileWidth)
    };
  }

  function gridCellToCoord({row, column}) {
    return  {
      x: column * tileWidth,
      y: row * tileWidth
    };
  }

  function drawTile(ctx, src, row, column, setStyle) {
    if (src == null) return;
    imageLoaderRef.current.loadImage(src, (img) => {

      const {x, y} = gridToCanvas(gridCellToCoord({row, column}));
      const displayTileWidth = tileWidth * zoomAmt;

      if (x + displayTileWidth < 0 || y + displayTileWidth < 0
       || x > ctx.canvas.width || y > ctx.canvas.height) {
        return;
      }

      ctx.save()
      if (setStyle != null) setStyle();
      ctx.drawImage(img, 
        x, 
        y, 
        displayTileWidth, 
        displayTileWidth);
      ctx.restore()
    })
  }
  

  useEffect(() => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.fillStyle = 'grey';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    let minCell = gridCoordToCell(canvasToGrid({x: 0, y: 0}));
    let maxCell = gridCoordToCell(canvasToGrid({x: ctx.canvas.width, y: ctx.canvas.height}));
    minCell.row = Math.max(minCell.row, 0);
    minCell.column = Math.max(minCell.column, 0);
    
    maxCell.row = Math.min(maxCell.row, grid.height - 1);
    maxCell.column = Math.min(maxCell.column, grid.width - 1);

    debugger;

    for (let row = minCell.row; row <= maxCell.row; row++) {
      for (let column = minCell.column; column <= maxCell.column; column++) {
          drawTile(ctx, grid.biopsyTiles[row][column], row, column);
          drawTile(ctx, grid.maskTiles[row][column], row, column, () => {
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
