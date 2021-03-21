import React from 'react';
import './Viewer.css'
import ImageLoader from './ImageLoader'
import { Grid } from './grid';
import { withWindowSize } from './windowSize';
import { channels, tileCounts } from './shared/constants';
import { canvasDeltaToBiopsy } from './tiles';
const { ipc } = window;


class Viewer extends React.Component {
  constructor(props) {
    super(props);
    this.canvasRef = React.createRef();
    this.imageLoader = new ImageLoader(tileCounts.cacheSize);
    this.grid = new Grid(this.imageLoader);

    this.state = {
      // camera lives in 'biopsy' coordinate space
      camera: {
        x: 0,
        y: 0,
        zoom: 0.1
      },
      highlightAmt: 0.5
    };

    this.handleReceiveTiles = this.handleReceiveTiles.bind(this);
    this.handleReceiveMasks = this.handleReceiveMasks.bind(this);
    this.draw = this.draw.bind(this);
    this.handleKeydown = this.handleKeydown.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleWheel = this.handleWheel.bind(this);
  }

  componentDidMount() {
    window.addEventListener('keydown', this.handleKeydown);
    ipc.on(channels.TILES, this.handleReceiveTiles);
    ipc.on(channels.TILE_MASKS, this.handleReceiveMasks);
    ipc.send(channels.TILES, { image: this.props.biopsyTif });
    this.draw();
  }

  componentDidUpdate() {
    this.draw();
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.handleKeydown);
    ipc.removeListener(channels.TILES, this.handleReceiveTiles);
    ipc.removeListener(channels.TILE_MASKS, this.handleReceiveMasks);
  }

  // some new tiles were generated, add them to the grid and redraw
  handleReceiveTiles(args) {
    if (args.error) {
      console.error(args.error);
      return;
    }
    this.grid.addBiopsyTiles(args.tiles);
    this.draw();
  }

  // some new masks were generated, add them to the grid and redraw
  handleReceiveMasks(args) {
    if (args.error) {
      console.error(args.error);
      return;
    }
    this.grid.addMaskTiles(args.tiles);
    this.draw();
  }

  draw() {
    if (this.canvasRef.current != null) {
      this.grid.draw(
        this.canvasRef.current.getContext('2d'), 
        this.state.camera,
        this.state.highlightAmt
      );
    }
  }

  handleKeydown(e) {
    const moveSpeed = 20;
    const zoomFactor = 0.9;
    // TODO: when two keys are held, only one gets repeat events, so can't do diagonal movement
    if (e.key === 'ArrowDown') {
      this.panCamera(0, moveSpeed);
    }else if (e.key === 'ArrowLeft') {
      this.panCamera(-moveSpeed, 0);
    }else if (e.key === 'ArrowRight') {
      this.panCamera(moveSpeed, 0);
    }else if (e.key === 'ArrowUp') {
      this.panCamera(0, -moveSpeed);
    }else if (e.key === '-') {
      this.zoomCamera(zoomFactor);
    }else if (e.key === '=') {
      this.zoomCamera(1 / zoomFactor);
    }else {
      return;
    }
  }

  // TODO: track zooming to mouse
  handleMouseMove(e) { // pan
    if (e.buttons != 0) { // if dragging
      this.panCamera(-e.movementX, -e.movementY);
    }
  }
  handleWheel(e) { // zoom
    // TODO: can't preventdefault here?
    if (e.deltaY < 0) {
      this.zoomCamera(1 / 0.9);
    } else if (e.deltaY > 0) {
      this.zoomCamera(0.9);
    }
  }
  
  panCamera(canvasDX, canvasDY) {
    this.setState((state, props) => {
      const [maxX, maxY] = this.grid.getBounds();
      const [dx, dy] = canvasDeltaToBiopsy(canvasDX, canvasDY, this.state.camera);
      return {
        camera: {
          ...state.camera,
          x: Math.max(0, Math.min(maxX, state.camera.x + dx)),
          y: Math.max(0, Math.min(maxY, state.camera.y + dy))
        }
      }
    });
  }

  zoomCamera(factor) {
    this.setState((state, props) => {
      return {
        camera: {
        ...state.camera, 
        zoom: Math.max(Math.min(state.camera.zoom * factor, 5), 0.01)}
      }
    });
  }

  render() {
    return (
      <div id="viewer">
        <div>
          <canvas
            ref={this.canvasRef}
            width={this.props.windowWidth}
            height={this.props.windowHeight}
            onMouseMove={this.handleMouseMove}
            onWheel={this.handleWheel}
          />
        </div>
        <div id="hud">
          <span>{this.props.biopsyTif}</span>
          <br/>
          <label>Highlight
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={this.state.highlightAmt}
              onChange={e => this.setState({highlightAmt: e.target.value})}
            />
          </label>
          <br/>
          <span>{Math.round(this.state.camera.x)}, {Math.round(this.state.camera.y)} px</span>
          <br/>
          <span>{this.grid.getBounds().join(' x ')} px</span>
          <br/>
          <span>{Math.round(this.state.camera.zoom * 1000) / 1000} x</span>
          <br/>
          <span>move by clicking and dragging or with arrow keys, zoom by scrolling or with [+][-]</span>
        </div>
      </div>
    );
  }
}

export default withWindowSize(Viewer);
