import Viewer from './Viewer'
import { useEffect, useState } from 'react';
import { channels } from './shared/constants';
import './App.css';
const { ipc } = window;

function App() {
  const [qupath, setQupath] = useState({version: null, selectionError: null});
  const [biopsyTif, setBiopsyTif] = useState(null);

  useEffect(() => {
    ipc.send(channels.FIND_QUPATH, {select: false}); // poll the current qupath

    ipc.on(channels.FIND_QUPATH, args => {
      if (args.error) {
        setQupath({selectionError: args.error})
      }else {
        setQupath({version: args.version, selectionError: null});
      }
    });

    ipc.on(channels.OPEN_IMAGE, args => {
      if (args.path) {
        setBiopsyTif(args.path);
      }
    });
  }, []);

  function selectQupath() {
    setQupath({version: qupath.version, selectionError: null});
    ipc.send(channels.FIND_QUPATH, {select: true});
  }

  function selectBiopsyTif() {
    // TODO: don't open multiple dialogs on double click
    ipc.send(channels.OPEN_IMAGE);
  }

  if (qupath.version == null) {
    return (
      <div>
        <button onClick={selectQupath}>Select QuPath executable</button>
        {qupath.selectionError && <span>Error: {qupath.selectionError}</span>}
      </div>
    );

  }else if (biopsyTif == null) {
    return (
      <div>
        Using Qupath {qupath.version} 
        <button onClick={selectQupath}>Change</button>
        <button onClick={selectBiopsyTif}>Open a Biopsy</button>
      </div>
    )
  }

  return (
    <div>
      Image {biopsyTif}
      <Viewer width={1000} height={800} biopsyTif={biopsyTif}/>
    </div>
  );
}

export default App;
