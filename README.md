# Epithelium Viewer
A simple desktop app to view duodenal biopsies, and highlight our model's predicted segmentations of the epithelial region.
Built for the Part Ib Cambridge Computer Science Group Project, by team 'Mike's

## Technologies
Built with Electron and React.js.

- The 'backend' is electron's main process (which runs nodejs), is in `main/`, which handles interfacing with QuPath to generate tiles. and python for the neural network.
- The 'frontend', electron's render process (which runs in a chromium window), is in `src/` and `public/`, and uses react for the UI.


## setting up
requires node.js installed, then to install the reuired packages, run
```
npm install
```

## running the app
Most scripts have windows specific versions, suffixed `-windows`

### running in development
The render process has hot reload, so just run
```
npm run start-react
```
once and it will update with any changes.


To launch the app, use

```
npm run start-electron
```
each time

### building for deployment
```
npm run build-react
npm run build-electron
```
Then package for the target OS (may require extra libraries for anything other than your current OS), by running one of:
```
npm run build-linux
npm run build-windows
npm run build-mac
```
