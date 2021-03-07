import React from 'react';
import './Viewer.css'
import ImageLoader from './ImageLoader'
import { Grid } from './grid';
import { withWindowSize } from './windowSize';
import { channels } from './shared/constants';
import { canvasDeltaToBiopsy } from './tiles';
const { ipc } = window;


class Viewer extends React.Component {
  constructor(props) {
    super(props);
    this.canvasRef = React.createRef();
    this.imageLoader = new ImageLoader(400);
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
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleWheel = this.handleWheel.bind(this);
  }

  componentDidMount() {
    ipc.on(channels.TILES, this.handleReceiveTiles);
    ipc.on(channels.TILE_MASKS, this.handleReceiveMasks);
    ipc.send(channels.TILES, { image: this.props.biopsyTif });
  }

  componentDidUpdate() {
    this.draw();
  }

  componentWillUnmount() {
    ipc.removeListener(channels.TILES, this.handleReceiveTiles);
    ipc.removeListener(channels.TILE_MASKS, this.handleReceiveMasks);
  }

  handleReceiveTiles(args) {
    if (args.error) {
      console.error(args.error);
      return;
    }
    this.grid.addBiopsyTiles(args.tiles);
    this.draw();
  }

  handleReceiveMasks(args) {
    if (args.error) {
      console.error(args.error);
      return;
    }
    this.grid.addMaskTiles(args.tiles);
    this.draw();
  }

  draw() {
    this.grid.draw(
      this.canvasRef.current.getContext('2d'), 
      this.state.camera,
      this.state.highlightAmt
    );
  }

  // TODO: track zooming to mouse
  handleMouseMove(e) { // pan
    if (e.buttons != 0) { // if dragging
      const [maxX, maxY] = this.grid.getBounds();
      const [dx, dy] = canvasDeltaToBiopsy(-e.movementX, -e.movementY, this.state.camera);

      this.setState({
        camera: {
          ...this.state.camera,
          x: Math.max(0, Math.min(maxX, this.state.camera.x + dx)),
          y: Math.max(0, Math.min(maxY, this.state.camera.y + dy))
        }
      });
    }
  }
  handleWheel(e) { // zoom
    // TODO: can't preventdefault here?
    if (e.deltaY < 0) {
      this.setState({camera: {
        ...this.state.camera, 
        zoom: Math.min(this.state.camera.zoom / 0.9, 5)}
      });
    } else if (e.deltaY > 0) {
      this.setState({camera: {
        ...this.state.camera, 
        zoom: Math.max(this.state.camera.zoom * 0.9, 0.01)}
      });
    }
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
          <span> Cache: {this.imageLoader.images.length}</span>
        </div>
      </div>
    );
  }
}

export default withWindowSize(Viewer);
