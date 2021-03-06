import { useEffect, useRef, useState } from 'react';
import './Viewer.css'
import ImageLoader from './ImageLoader'
import { channels } from './shared/constants';
import { Grid } from './grid';
const { ipc } = window;

function Viewer(props) {
  const canvasRef = useRef(null);
  const imageLoaderRef = useRef(new ImageLoader(400));
  const gridRef = useRef(new Grid(imageLoaderRef.current));
  // camera lives in 'biopsy' coordinate space
  const [cameraPos, setCameraPos] = useState({ x: 0, y: 0 });
  const [zoomAmt, setZoomAmt] = useState(0.1);
  const [highlightAmt, setHighlightAmt] = useState(0.5)
  
  useEffect(() => {
    ipc.send(channels.TILES, { image: props.biopsyTif });
    ipc.on(channels.TILES, args => {
      if (args.error) {
        console.error(args.error);
        return;
      }
      gridRef.current.addBiopsyTiles(args.tiles);
      // TODO: trigger draw, rerender (grid dimensions changed)
      draw();
    });
    ipc.on(channels.TILE_MASKS, args => {
      if (args.error) {
        console.error(args.error);
        return;
      }
      gridRef.current.addMaskTiles(args.tiles);
      draw();
    })
  }, []);

  useEffect(draw);

  // TODO draw when tiles arrive
  function draw() {
    gridRef.current.draw(canvasRef.current.getContext('2d'), cameraPos, zoomAmt, highlightAmt);
  }

  // TODO: track zooming to mouse
  function handleMouseMove(e) { // pan
    if (e.buttons != 0) { // if dragging
      const [maxX, maxY] = gridRef.current.getBounds();
      // TODO: use canvasToBiopsy to do conversion
      setCameraPos({
        x: Math.max(0, Math.min(maxX, cameraPos.x - e.movementX / zoomAmt)),
        y: Math.max(0, Math.min(maxY, cameraPos.y - e.movementY / zoomAmt))
      });
    }
  }
  function handleWheel(e) { // zoom
    // TODO: can't preventdefault here?
    if (e.deltaY < 0) {
      setZoomAmt(Math.min(zoomAmt / 0.9, 5));
    } else if (e.deltaY > 0) {
      setZoomAmt(Math.max(zoomAmt * 0.9, 0.01));
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
      <span>{Math.round(cameraPos.x)}, {Math.round(cameraPos.y)} px</span>
      <br/>
      <span>{gridRef.current.getBounds().join(' x ')} px</span>
      <br/>
      <span>Zoom: {zoomAmt}</span>
      <br/>
      <span> Cache: {imageLoaderRef.current.images.length}</span>
      <br/>
    </div>
  )
}

export default Viewer;
