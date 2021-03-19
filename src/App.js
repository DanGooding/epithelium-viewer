import Viewer from './Viewer'
import { useEffect, useState } from 'react';
import { channels } from './shared/constants';
import './App.css';
const { ipc } = window;

// manages toplevel state, and displaying the menus before the viewer
function App() {
  const [qupath, setQupath] = useState({version: null, selectionError: null});
  const [biopsyTif, setBiopsyTif] = useState(null);

  useEffect(() => {
    ipc.on(channels.FIND_QUPATH, handleFindQupathResponse);
    ipc.on(channels.OPEN_IMAGE, handleOpenImageResponse);
    
    // poll the current qupath on first startup
    ipc.send(channels.FIND_QUPATH, {select: false});

    // clear listeners on unmount
    return () => {
      ipc.removeListener(channels.FIND_QUPATH, handleFindQupathResponse);
      ipc.removeListener(channels.OPEN_IMAGE, handleOpenImageResponse);
    };
  }, []);

  // prompt the user to find the qupath executable
  function selectQupath() {
    setQupath({...qupath, selectionError: null});
    ipc.send(channels.FIND_QUPATH, {select: true});
  }

  // user chose something, it may or may not have been a qupath executable
  function handleFindQupathResponse(args) {
    if (args.error) {
      setQupath({selectionError: args.error})
    }else {
      setQupath({version: args.version, selectionError: null});
    }
  }

  // prompt user to open a biopsy
  function selectBiopsyTif() {
    // TODO: don't open multiple dialogs on double click
    ipc.send(channels.OPEN_IMAGE);
  }

  // user opened a biopsy
  function handleOpenImageResponse(args) {
    if (args.path) {
      setBiopsyTif(args.path);
    }
  }
  
  // first prompt to find qupath
  if (qupath.version == null) {
    return (
      <div>
        <button onClick={selectQupath}>Select QuPath executable</button>
        {qupath.selectionError && <span>Error: {qupath.selectionError}</span>}
      </div>
    );

  }else if (biopsyTif == null) { // then prompt to open an image
    return (
      <div>
        Using Qupath {qupath.version} 
        <button onClick={selectQupath}>Change</button>
        <button onClick={selectBiopsyTif}>Open a Biopsy</button>
      </div>
    )
  }
  
  // otherwise an image being viewed currently
  return (
    <div>
      <Viewer biopsyTif={biopsyTif}/>
    </div>
  );
}

export default App;
