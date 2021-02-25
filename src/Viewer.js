import { useEffect, useRef, useState } from 'react';
import { updateTileGrid } from './tiles'
import './Viewer.css'
import ImageLoader from './ImageLoader'
import { channels, tileSize } from './shared/constants';
const { ipcRenderer } = window.electron;

function Viewer(props) {
  const canvasRef = useRef(null);
  const imageLoaderRef = useRef(new ImageLoader())
  const [cameraPos, setCameraPos] = useState({ x: 0, y: 0 });
  const [zoomAmt, setZoomAmt] = useState(1.0);
  const [highlightAmt, setHighlightAmt] = useState(0.5)
  const [grid, setGrid] = useState({ biopsyTiles: [], maskTiles: [], width: 0, height: 0 });
  const gridRef = useRef();
  // use this in callbacks, so they only capture the container, 
  // not the state itself, therefore ensuring they see the current state
  gridRef.current = grid;

  useEffect(() => {
    ipcRenderer.send(channels.TILES, { qupath: props.qupath, image: props.biopsyTif });
    ipcRenderer.on(channels.TILES, (event, args) => {
      if (args.error) {
        console.error(args.error);
        return;
      }
      setGrid(updateTileGrid(gridRef.current, args.tiles));
    });
  }, []);

  // TODO: track zooming to mouse
  function gridToCanvas({ x, y }) {
    return {
      x: (x - cameraPos.x) * zoomAmt + props.width / 2,
      y: (y - cameraPos.y) * zoomAmt + props.height / 2
    };
  }

  function canvasToGrid({ x, y }) {
    return {
      x: (x - props.width / 2) / zoomAmt + cameraPos.x,
      y: (y - props.height / 2) / zoomAmt + cameraPos.y
    };
  }

  function gridCoordToCell({ x, y }) {
    return {
      row: Math.floor(y / tileSize.width),
      column: Math.floor(x / tileSize.width)
    };
  }

  function gridCellToCoord({ row, column }) {
    return {
      x: column * tileSize.width,
      y: row * tileSize.width
    };
  }

  function drawTile(ctx, src, row, column, setStyle) {
    if (src == null) return;
    imageLoaderRef.current.loadImage(src, (img) => {

      const { x, y } = gridToCanvas(gridCellToCoord({ row, column }));
      const displayTileWidth = tileSize.width * zoomAmt;

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

    let minCell = gridCoordToCell(canvasToGrid({ x: 0, y: 0 }));
    let maxCell = gridCoordToCell(canvasToGrid({ x: ctx.canvas.width, y: ctx.canvas.height }));
    minCell.row = Math.max(minCell.row, 0);
    minCell.column = Math.max(minCell.column, 0);

    maxCell.row = Math.min(maxCell.row, grid.height - 1);
    maxCell.column = Math.min(maxCell.column, grid.width - 1);

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
    } else if (e.deltaY > 0) {
      setZoomAmt(Math.max(zoomAmt * 0.9, 0.1));
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
