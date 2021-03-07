import Viewer from './Viewer'
import { useEffect, useState } from 'react';
import { channels } from './shared/constants';
import './App.css';
const { ipc } = window;

function App() {
  const [qupath, setQupath] = useState({version: null, selectionError: null});
  const [biopsyTif, setBiopsyTif] = useState(null);

  useEffect(() => {
    ipc.on(channels.FIND_QUPATH, handleFindQupathResponse);
    ipc.on(channels.OPEN_IMAGE, handleOpenImageResponse);
    
    ipc.send(channels.FIND_QUPATH, {select: false}); // poll the current qupath

    // clear listeners on unmount
    return () => {
      ipc.removeListener(channels.FIND_QUPATH, handleFindQupathResponse);
      ipc.removeListener(channels.OPEN_IMAGE, handleOpenImageResponse);
    };
  }, []);

  function selectQupath() {
    setQupath({...qupath, selectionError: null});
    ipc.send(channels.FIND_QUPATH, {select: true});
  }

  function handleFindQupathResponse(args) {
    if (args.error) {
      setQupath({selectionError: args.error})
    }else {
      setQupath({version: args.version, selectionError: null});
    }
  }

  function selectBiopsyTif() {
    // TODO: don't open multiple dialogs on double click
    ipc.send(channels.OPEN_IMAGE);
  }

  function handleOpenImageResponse(args) {
    if (args.path) {
      setBiopsyTif(args.path);
    }
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
      <Viewer biopsyTif={biopsyTif}/>
    </div>
  );
}

export default App;
