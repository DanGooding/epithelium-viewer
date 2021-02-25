const { app, BrowserWindow, ipcMain, protocol } = require('electron');
const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const tmp = require('tmp');
const url = require('url');
const { channels } = require('../src/shared/constants');

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
    width: 1000,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      enableRemoteModule: true,
    }
  });

  mainWindow.loadURL(startURL);
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

ipcMain.on(channels.QUPATH_CHECK, (event, args) => {
  const qupathPath = args.path;
  try {
    execFile(qupathPath, ['--version'], (error, stdout, stderr) => {
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

  // TODO: delete later?
  const tileDir = tmp.dirSync(); // TODO: is sync okay?

  const scriptPath = isDev() 
    ? './scripts/tiler.groovy' 
    : path.join(process.resourcesPath, "scripts/tiler.groovy");

  const command = ['script', '--image', image, '--args', tileDir.name, scriptPath];
  
  try {
    execFile(qupath, command, (error, stdout, stderr) => {
      if (!error) {
        fs.readdir(tileDir.name, (err, files) => {
          let fullPaths = files.map(name => devFileProtocolURI(path.join(tileDir.name, name)));
          
          // TODO: don't send all at once?
          event.sender.send(channels.TILES, {
            tiles: fullPaths,
            stdout,
            stderr
          });
        });
        
      } // TODO handle error!
      else {
        console.error(error)
      }
    });

  }catch (error) {
    // TODO respond with error
    console.error(error);
  }
  
});


