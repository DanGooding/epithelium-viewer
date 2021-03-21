# Epithelium Viewer
A simple desktop app to view duodenal biopsies, and highlight our model's predicted segmentations of the epithelial region.
Built for the Part Ib Cambridge Computer Science Group Project, by team 'Mike's

## Technologies
Built with Electron and React.js.

- The 'backend' is electron's main process (which runs nodejs), which is in `main/`, which handles interfacing with QuPath to generate tiles. and python for the neural network.
- The 'frontend', electron's render process (which runs in a chromium window), is in `src/` and `public/`, and uses react for the UI.


## setting up
Requires node.js installed, then to install the required packages, run
```
npm install
```
also needs [QuPath](https://qupath.github.io/) to tile the biopsy images.

The model weights should be put in `scripts/model/`.
The required python packages are listed in `scripts/requirements.txt`, if using a venv, save `PYTHON=/path/to/venv/bin/python` in a `.env` file in the top level driectory.

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
This produces a standalone application (depening only on QuPath).

Packaging the neural net code uses [pyinstaller](https://www.pyinstaller.org/downloads.html), currently only the development release (`5.0.dev0`) seems to properly support tensorflow. It can be installed using:
```
pip install https://github.com/pyinstaller/pyinstaller/archive/develop.zip
```

Then to build everything:
```
npm run build-react
npm run build-electron
npm run build-python
```

Then package into a standalone app using one of the following. This can only target your current OS.
```
npm run build-linux
npm run build-windows
npm run build-mac
```
