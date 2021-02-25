const { app, BrowserWindow, ipcMain, protocol } = require('electron');
const { execFile } = require('child_process');
const chokidar = require('chokidar');
const path = require('path');
const tmp = require('tmp');
const url = require('url');
const { channels, tileSize } = require('../src/shared/constants');

function isDev() {
  return process.env.ELECTRON_ENV == 'development';
}

const createWindow = () => {
  const startURL = process.env.ELECTRON_START_URL || 
    url.format({
      pathname: path.join(__dirname, '../index.html'),
      protocol: 'file:',
      slashes: 'true'
    });

  const mainWindow = new BrowserWindow({
    width: 1500,
    height: 1000,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      enableRemoteModule: true,
    }
  });

  mainWindow.loadURL(startURL);
  mainWindow.maximize();
};

// https://github.com/electron/electron/issues/23757#issuecomment-640146333
// in development use http server - so chromium disallows local file access unless we do this
const devFileProtocolName = 'safe-file-protocol';
function devFileProtocolURI(path) {
  if (isDev()) {
    return `${devFileProtocolName}:///${path}`;
  }else {
    return path;
  }
}

app.on('ready', async () => {
  if (isDev) {
    protocol.registerFileProtocol(devFileProtocolName, (request, callback) => {
      const pathname = request.url.replace(`${devFileProtocolName}:///`, '');
      try {
        return callback(decodeURIComponent(pathname));
      }catch (error) {
        console.error(error)
      }
    });
  }

  createWindow();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

let runningChildProcesses = new Map(); // pid: ChildProcess

app.on('before-quit', () => {
  runningChildProcesses.forEach(process => process.kill());
});


// TODO: a general version for any subprocess
// execute a qupath command, throwing an error when it fails to spawn
function runQupath(qupathPath, command, callback) {
  const qupathProcess = execFile(qupathPath, command, result => {
    runningChildProcesses.delete(qupathProcess.pid);
    callback(result);
  });
  runningChildProcesses.set(qupathProcess.pid, qupathProcess);
}

ipcMain.on(channels.QUPATH_CHECK, (event, args) => {
  const qupathPath = args.path;
  try {
    runQupath(qupathPath, ['--version'], (error, stdout, stderr) => {

      if (error) {
        event.sender.send(channels.QUPATH_CHECK, {
          success: false
        });
      
      }else {

        // TODO: ensure have string not buffer
        const match = /QuPath v(\d+.\d+.\d+)/i.exec(stdout);
        const version = match[1];

        event.sender.send(channels.QUPATH_CHECK, {
          success: true,
          version
        });
      }
    });
  }catch (e) {
    event.sender.send(channels.QUPATH_CHECK, {
      success: false
    });
  }
});

// request for tiles
ipcMain.on(channels.TILES, (event, args) => {
  const { qupath, image } = args;

  // TODO: delete later
  tmp.dir((error, tileDir, cleanup) => {
    if (error) {
      event.sender.send(channels.TILES, {
        error: 'Unable to create directory: ' + error
      });
      return;
    }

    const scriptPath = isDev() 
      ? './scripts/tiler.groovy' 
      : path.join(process.resourcesPath, "scripts/tiler.groovy");
  
    const command = [
      'script', 
      '--image', image, 
      '--args', `${tileSize.width} ${tileSize.downsampling} ${tileDir}`, 
      scriptPath
    ];
  
    const watcher = chokidar.watch(tileDir, {awaitWriteFinish: true});
    
    // full file paths of yet unsent tiles
    let newTiles = [];
    const batchSize = 50;

    function sendTileBatch() {
      event.sender.send(channels.TILES, {
        tiles: newTiles.map(devFileProtocolURI),
      });
      newTiles = [];
    }

    watcher.on('add', tilePath => {
      newTiles.push(tilePath);
      if (newTiles.length >= batchSize) {
        sendTileBatch();
      }
    });

    try {
      runQupath(qupath, command, (error, stdout, stderr) => {
        // TODO check stdout, stderr for non warnings
        if (error) {
          event.sender.send(channels.TILES, {error: 'QuPath script error: ' + error});
          return;
        }
        // wait some time to be sure all tiles are seen
        setTimeout(() => {
          watcher.close().then(() => {
            sendTileBatch();
          });
        }, 200);
      });
    }catch (error) {
      event.sender.send(channels.TILES, {error: 'QuPath error: ' + error});
    }
  });
});

