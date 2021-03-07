import React from 'react';
import './Viewer.css'
import ImageLoader from './ImageLoader'
import { Grid } from './grid';
import { withWindowSize } from './windowSize';
import { channels } from './shared/constants';
const { ipc } = window;


class Viewer extends React.Component {
  constructor(props) {
    super(props);
    this.canvasRef = React.createRef();
    this.imageLoader = new ImageLoader();
    this.grid = new Grid(this.imageLoader);

    this.state = {
      // camera lives in 'biopsy' coordinate space
      cameraPos: {
        x: 0,
        y: 0
      },
      zoomAmt: 0.1,
      highlightAmt: 0.5
    };

    this.draw = this.draw.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleWheel = this.handleWheel.bind(this);
  }

  componentDidMount() {
    ipc.send(channels.TILES, { image: this.props.biopsyTif });
    ipc.on(channels.TILES, args => {
      if (args.error) {
        console.error(args.error);
        return;
      }
      this.grid.addBiopsyTiles(args.tiles);
      // TODO: trigger draw, rerender (grid dimensions changed)
      this.draw();
    });
    ipc.on(channels.TILE_MASKS, args => {
      if (args.error) {
        console.error(args.error);
        return;
      }
      this.grid.addMaskTiles(args.tiles);
      this.draw();
    });
  }

  componentDidUpdate() {
    this.draw();
  }

  componentWillUnmount() {
    // TODO: clear listeners
  }

  draw() {
    this.grid.draw(
      this.canvasRef.current.getContext('2d'), 
      this.state.cameraPos, 
      this.state.zoomAmt, 
      this.state.highlightAmt
    );
  }

  // TODO: track zooming to mouse
  handleMouseMove(e) { // pan
    if (e.buttons != 0) { // if dragging
      const [maxX, maxY] = this.grid.getBounds();
      // TODO: use canvasToBiopsy to do conversion
      this.setState({
        cameraPos: {
          x: Math.max(0, Math.min(maxX, this.state.cameraPos.x - e.movementX / this.state.zoomAmt)),
          y: Math.max(0, Math.min(maxY, this.state.cameraPos.y - e.movementY / this.state.zoomAmt))
        }
      });
    }
  }
  handleWheel(e) { // zoom
    // TODO: can't preventdefault here?
    if (e.deltaY < 0) {
      this.setState({zoomAmt: Math.min(this.state.zoomAmt / 0.9, 5)});
    } else if (e.deltaY > 0) {
      this.setState({zoomAmt: Math.max(this.state.zoomAmt * 0.9, 0.01)});
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
          <span>{Math.round(this.state.cameraPos.x)}, {Math.round(this.state.cameraPos.y)} px</span>
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
