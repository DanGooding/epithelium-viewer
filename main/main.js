const { app, BrowserWindow, ipcMain, protocol } = require('electron');
const { execFile, spawn } = require('child_process');
const chokidar = require('chokidar');
const path = require('path');
const tmp = require('tmp');
const url = require('url');
const { channels, tileSize } = require('../src/shared/constants');

function isDev() {
  return process.env.ELECTRON_ENV == 'development';
}

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

function getResourcePath(resource) {
  if (isDev()) {
    return resource;
  }else {
    return path.join(process.resourcesPath, resource)
  }
}

app.on('ready', async () => {
  if (isDev()) {
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
let createdTmpDirs = new Map(); // path: cleanup function

function managedExecFile(path, args, callback) {
  const managedProcess = execFile(path, args, (error, stdout, stderr) => {
    runningChildProcesses.delete(managedProcess.pid);
    callback(error, stdout, stderr);
  });
  runningChildProcesses.set(managedProcess.pid, managedProcess);
  return managedProcess;
}

function managedSpawn(command, args, options) {
  const spawnedProcess = spawn(command, args, options);
  runningChildProcesses.set(spawnedProcess.pid, spawnedProcess);
  // TODO: are additional listeners guaranteed not to replace this one
  spawnedProcess.on('close', () => {
    runningChildProcesses.delete(spawnedProcess.pid);
  });
  return spawnedProcess;
}

function makeTmpDir(callback) {
  tmp.dir({unsafeCleanup: true}, (error, dirPath, cleanup) => {
    if (error) { // if this fails, something is badly wrong
      console.error('failed to create tmp directory:', error);
      app.quit();
      return;
    }
    createdTmpDirs.set(dirPath, cleanup);
    callback(dirPath);
  });
}

function cleanupAllTmp(callback) {
  if (createdTmpDirs.size > 0) {
    const path = createdTmpDirs.keys().next().value;
    const cleanup = createdTmpDirs.get(path);
    createdTmpDirs.delete(path);
    cleanup(() => cleanupAllTmp(callback));
  }else {
    callback();
  }
}

app.on('before-quit', event => {
  if (createdTmpDirs.size > 0) {
    event.preventDefault();
    cleanupAllTmp(() => app.quit());
  }else {
    // don't kill unless we are actually about to quit
    // else their completion callbacks will be called
    runningChildProcesses.forEach(process => process.kill());
  }
});

ipcMain.on(channels.QUPATH_CHECK, (event, args) => {
  const qupathPath = args.path;
  try {
    managedExecFile(qupathPath, ['--version'], (error, stdout, stderr) => {
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
  }catch (error) {
    event.sender.send(channels.QUPATH_CHECK, {
      success: false
    });
  }
});

// wrap a function, so calls are delayed and sent in batches
function batchify(batchSize, maxWait, target) {
  let bufferedItems = [];
  let timeout = null;

  function send() {
    if (bufferedItems.length > 0) {
      const readyItems = bufferedItems;
      bufferedItems = [];
      target(readyItems);
    }
    if (timeout != null) {
      clearTimeout(timeout);
      timeout = null;
    }
  }

  return arg => {
    bufferedItems.push(arg);
    if (timeout == null) {
      timeout = setTimeout(send, maxWait);
    }
    if (bufferedItems.length >= batchSize) {
      send();
    }
  }
}

function generateTiles(qupathPath, image, listeningWebContents) {
  makeTmpDir(tileDir => {
    const command = [
      'script', 
      '--image', image, 
      '--args', `${tileSize.width} ${tileSize.downsampling} ${tileDir}`, 
      getResourcePath('scripts/tiler.groovy')
    ];
  
    const watcher = chokidar.watch(tileDir, {awaitWriteFinish: true});
    
    watcher.on('add', batchify(50, 1000, newTilePaths => {
      listeningWebContents.send(channels.TILES, {
        tiles: newTilePaths.map(devFileProtocolURI),
      });
    }));

    try {
      managedExecFile(qupathPath, command, (error, stdout, stderr) => {
        // TODO check stdout, stderr for non warnings
        if (error) {
          listeningWebContents.send(channels.TILES, {error: 'QuPath script error: ' + error});
          return;
        }
        // wait some time to be sure all changes are seen
        setTimeout(() => {
          watcher.close().then(() => {
            // not doing this in parallel with tile generation since both need a lot of compute
            generateMasks(tileDir, listeningWebContents);
          });
        }, 3000);
      });

    }catch (error) {
      listeningWebContents.send(channels.TILES, {error: 'QuPath error: ' + error});
    }
  });
}

// request for tiles
ipcMain.on(channels.TILES, (event, { qupath, image }) => {
  generateTiles(qupath, image, event.sender);
});

function getSystemPython() {
  return process.platform === 'win32' ? 'py' : 'python3';
}

function generateMasks(tileDir, listeningWebContents) {
  makeTmpDir(maskDir => {

    const watcher = chokidar.watch(maskDir, {awaitWriteFinish: true});
    watcher.on('add', batchify(50, 1000, maskPaths => {
      listeningWebContents.send(channels.TILE_MASKS, {
        tiles: maskPaths.map(devFileProtocolURI)
      });
    }));

    try {
      const pythonProcess = managedSpawn(getSystemPython(), [getResourcePath('scripts/segmenter.py'), tileDir, maskDir]);
      pythonProcess.on('close', code => {
        if (code != 0) {
          listeningWebContents.send(channels.TILE_MASKS, {error: 'python script error'});
          return;
        }
        setTimeout(() => {
          watcher.close();
        }, 3000);
      });
      
    }catch (error) {
      listeningWebContents.send(channels.TILE_MASKS, {error: 'python error: ' + error});
    }
  });
}

