import Viewer from './Viewer'
import { useState } from 'react';
import { channels } from './shared/constants';
import './App.css';
const { remote, ipcRenderer } = window.electron;

function App() {
  const [qupath, setQupath] = useState(null);
  const [biopsyTif, setBiopsyTif] = useState(null);

  function findQupath() {
    remote.dialog.showOpenDialog({
      properties: ['openFile'],
      title: 'Locate QuPath executable',
      buttonLabel: 'Select'
    }).then(selection => {
      if (!selection.canceled) {
        const path = selection.filePaths[0];
        ipcRenderer.send(channels.QUPATH_CHECK, {path});
        ipcRenderer.once(channels.QUPATH_CHECK, (event, args) => {
          if (args.success) {
            setQupath({path, version: args.version});
          }
        });
      }
    })
  }

  function selectBiopsyTif() {
    remote.dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: "Images", extensions: ['tif', 'bif'] }
      ]
    }).then(selection => {
      if (!selection.canceled) {
        const path = selection.filePaths[0];
        setBiopsyTif(path);
      }
    })
  }

  if (qupath == null) {
    return (
      <div>
        <button onClick={findQupath}>Select QuPath executable</button>
      </div>
    );

  }else if (biopsyTif == null) {
    return (
      <div>
        Using Qupath {qupath.version}
        <button onClick={selectBiopsyTif}>Open a Biopsy</button>
      </div>
    )
  }

  return (
    <div>
      Image {biopsyTif}
      <Viewer width={1000} height={800} biopsyTif={biopsyTif} qupath={qupath.path}/>
    </div>
  );
}

export default App;
