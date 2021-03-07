const { contextBridge, ipcRenderer } = require('electron');

// safe interface to ipcRenderer, which doesn't expose the `sender` object
contextBridge.exposeInMainWorld('ipc', {
  send: (channel, ...args) => {
    // TODO: allowed list of channels
    ipcRenderer.send(channel, ...args);
  },
  on: (channel, callback) => {
    ipcRenderer.on(channel, (event, ...args) => {
      callback(...args);
    });
  },
  once: (channel, callback) => {
    ipcRenderer.once(channel, (event, ...args) => {
      callback(...args);
    });
  },
  removeListener: (channel, listener) => {
    ipcRenderer.removeListener(channel, listener);
  }
});
