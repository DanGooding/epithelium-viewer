const { app, BrowserWindow, ipcMain, protocol, dialog } = require('electron');
const { execFile, spawn } = require('child_process');
const chokidar = require('chokidar');
const path = require('path');
const Store = require('electron-store');
const tmp = require('tmp');
const url = require('url');
const { channels, tileSize, settingsStoreKeys } = require('../src/shared/constants');
const { batchify } = require('./utils');
require('dotenv').config();

const isDev = process.env.ELECTRON_ENV === 'development';

// https://github.com/electron/electron/issues/23757#issuecomment-640146333
// in development use http server - so chromium disallows local file access unless we do this
const devFileProtocolName = 'safe-file-protocol';
function devFileProtocolURI(path) {
  if (isDev) {
    return `${devFileProtocolName}:///${path}`;
  }else {
    return path;
  }
}

// get the absolute path for any (non javascript) resource
function getResourcePath(resource) {
  if (isDev) {
    return resource;
  }else {
    return path.join(process.resourcesPath, resource)
  }
}

// persistent settings
const settingsStore = new Store();

// app setup
function main() {
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

  const startURL = process.env.ELECTRON_START_URL || 
    url.format({
      pathname: path.join(__dirname, '../index.html'),
      protocol: 'file:',
      slashes: 'true'
    });

  const window = new BrowserWindow({
    width: 1500,
    height: 1000,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true
    }
  });

  window.loadURL(startURL);
  window.maximize();
}

app.on('ready', main);

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
    main();
  }
});

// track things that need to be deleted/killed when the app quits
let runningChildProcesses = new Map(); // pid: ChildProcess
let createdTmpDirs = new Map(); // path: cleanup function

// wrapper arround execFile that ensures the subprocess is killed before app quit
function managedExecFile(path, args, callback) {
  const managedProcess = execFile(path, args, (error, stdout, stderr) => {
    runningChildProcesses.delete(managedProcess.pid);
    callback(error, stdout, stderr);
  });
  runningChildProcesses.set(managedProcess.pid, managedProcess);
  return managedProcess;
}

// wrapper arround managedSpawn that ensures the subprocess is killed before app quit
function managedSpawn(command, args, options) {
  const spawnedProcess = spawn(command, args, options);
  runningChildProcesses.set(spawnedProcess.pid, spawnedProcess);
  // TODO: are additional listeners guaranteed not to replace this one
  spawnedProcess.on('close', () => {
    runningChildProcesses.delete(spawnedProcess.pid);
  });
  return spawnedProcess;
}

// wrapper around tmp.dir that ensures the directory and all its contents are deleted before the app quits
function makeTmpDir(callback) {
  tmp.dir({unsafeCleanup: true}, (error, dirPath, cleanup) => {
    if (error) { // if this fails, something is badly wrong
      console.error('failed to create tmp directory:', error);
      app.quit();
      return;
    }
    createdTmpDirs.set(dirPath, cleanup);
    if (callback != null) callback(dirPath);
  });
}

function makeTmpDirs(n, callback) {
  if (n <= 0) {
    if (callback != null) callback([]);
  }else {
    makeTmpDirs(n - 1, tmpDirs => {
      makeTmpDir(tmpDir => {
        tmpDirs.push(tmpDir);
        if (callback != null) callback(tmpDirs);
      });
    });
  }
}

// delete all the directories create with makeTmpDir/makeTmpDirs
function cleanupAllTmp(callback) {
  if (createdTmpDirs.size > 0) {
    const path = createdTmpDirs.keys().next().value;
    const cleanup = createdTmpDirs.get(path);
    createdTmpDirs.delete(path);
    cleanup(() => cleanupAllTmp(callback));
  }else if (callback != null) {
    callback();
  }
}

// ensure all resources are cleaned up on quit
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

// handle render process either reading or asking to set the the in use qupath executable
ipcMain.on(channels.FIND_QUPATH, (event, args) => {
  if (args.select) {
    dialog.showOpenDialog({
      properties: ['openFile'],
      title: 'Locate QuPath executable',
      buttonLabel: 'Select'
    }).then(selection => {
      if (!selection.canceled) {
        const candidateQupathPath = selection.filePaths[0];
        testQupathPath(candidateQupathPath, result => {
          if (result.success) {
            settingsStore.set(settingsStoreKeys.QUPATH_PATH, candidateQupathPath);
            event.sender.send(channels.FIND_QUPATH, {version: result.version});
          }else {
            event.sender.send(channels.FIND_QUPATH, {error: 'selected file is not a QuPath executable'});
          }
        });
      }
    });
  }else if (settingsStore.get(settingsStoreKeys.QUPATH_PATH) != null) {
    testQupathPath(settingsStore.get(settingsStoreKeys.QUPATH_PATH), result => {
      if (result.success) {
        event.sender.send(channels.FIND_QUPATH, {version: result.version});
      }else {
        appState.qupathPath = null;
      }
    });
  }
});

// check that a path is actually a QuPath executable
function testQupathPath(qupathPath, callback) {
  try {
    managedExecFile(qupathPath, ['--version'], (error, stdout, stderr) => {
      if (error) {
        callback({success: false});
      }else {
        const match = /QuPath v(\d+.\d+.\d+)/i.exec(stdout);
        const version = match[1];
        callback({
          success: true,
          version
        });
      }
    });
  }catch (error) {
    callback({success: false});
  }
}

// handle render process asking to let the user choose an image to view
ipcMain.on(channels.OPEN_IMAGE, event => {
  dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: "Images", extensions: ['tif', 'bif'] }
    ]
  }).then(selection => {
    if (!selection.canceled) {
      const path = selection.filePaths[0];
      event.sender.send(channels.OPEN_IMAGE, { path });
    }
  });
});

// delete/stop generating tiles for the currently open image
ipcMain.on(channels.CLOSE_IMAGE, event => {
  // kill qupath/python
  // delete tiles + masks
  runningChildProcesses.forEach(process => process.kill());
  cleanupAllTmp();
});

// tile a biopsy tif using qupath, then send the tiles to the render process, 
// then generateMasks from those tiles
function generateTiles(image, listeningWebContents) {
  // all tiles are for viewing, some are segmented to produce masks too
  makeTmpDirs(2, ([viewOnlyTileDir, viewAndMaskTileDir]) => {
    const qupathPath = settingsStore.get(settingsStoreKeys.QUPATH_PATH);
    const command = [
      'script', 
      '--image', image, 
      getResourcePath('scripts/tiler.groovy')
    ];

    // generate most downsampled first
    const downsamplingLevels = tileSize.biopsyDownsamplings.slice().sort((a,b) => b - a);

    // each downsampling level and the folder to save those tiles to
    const downsamplingArgs = downsamplingLevels.map(downsampling => {
      if (tileSize.maskDownsamplings.includes(downsampling)) {
        return [viewAndMaskTileDir, downsampling];
      }else {
        return [viewOnlyTileDir, downsampling];
      }
    });
    
    const args = [
      tileSize.width, 
      // number of downsamplings
      downsamplingArgs.length, 
      // path, downsampling, path, downsampling, ...
      ...downsamplingArgs.flat()];

    const watcher = chokidar.watch([viewOnlyTileDir, viewAndMaskTileDir], {awaitWriteFinish: true});

    watcher.on('add', batchify(50, 1000, newTilePaths => {
      if (!listeningWebContents.isDestroyed()) {
        listeningWebContents.send(channels.TILES, {
          tiles: newTilePaths.map(devFileProtocolURI),
        });
      }
    }));

    try {
      const qupathProcess = managedExecFile(qupathPath, command, (error, stdout, stderr) => {
        if (error || stderr.length != 0) {
          if (!error) {
            error = stderr;
          }
          listeningWebContents.send(channels.TILES, {error: 'QuPath script error: ' + error});
          return;
        }
        // wait some time to be sure all changes are seen
        setTimeout(() => {
          watcher.close().then(() => {
            // not doing this in parallel with tile generation since both need a lot of compute
            generateMasks(viewAndMaskTileDir, listeningWebContents);
          });
        }, 3000);
      });

      for (const arg of args) {
        qupathProcess.stdin.write(`${arg}\n`);
      }

    }catch (error) {
      listeningWebContents.send(channels.TILES, {error: 'QuPath error: ' + error});
    }
  });
}

// handle render process requesting tiles
ipcMain.on(channels.TILES, (event, { image }) => {
  generateTiles(image, event.sender);
});

// return the python interpreter to use for the neural network
function getPython() {
  return process.env.PYTHON || (process.platform === 'win32' ? 'py' : 'python3');
}

// run the epithelium identifying neural network on every tile in a given directory
// and send the resulting masks to the render process
function generateMasks(tileDir, listeningWebContents) {
  makeTmpDir(maskDir => {

    const watcher = chokidar.watch(maskDir, {awaitWriteFinish: true});
    watcher.on('add', batchify(50, 1000, maskPaths => {
      if (!listeningWebContents.isDestroyed()) {
        listeningWebContents.send(channels.TILE_MASKS, {
          tiles: maskPaths.map(devFileProtocolURI)
        });
      }
    }));

    let args = [
      getResourcePath(`scripts/model/`),
      tileDir, 
      maskDir
    ];

    // either run the python script, or the bundled executable
    let executable;
    if (isDev) {
      executable = getPython();
      args = [getResourcePath('scripts/segmenter.py'), ...args];
    }else {
      executable = getResourcePath('scripts/dist/segmenter/segmenter');
    }

    try {
      const pythonProcess = managedSpawn(executable, args);
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

