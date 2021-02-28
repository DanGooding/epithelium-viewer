import Viewer from './Viewer'
import { useEffect, useState } from 'react';
import { channels } from './shared/constants';
import './App.css';
const { ipc } = window;

function App() {
  const [qupath, setQupath] = useState(null);
  const [biopsyTif, setBiopsyTif] = useState(null);

  useEffect(() => {
    ipc.on(channels.FIND_QUPATH, args => {
      if (args.success) {
        setQupath(args.qupath);
      }
    });

    ipc.once(channels.OPEN_IMAGE, args => {
      if (args.path) {
        setBiopsyTif(args.path);
      }
    });
  }, []);

  function findQupath() {
    ipc.send(channels.FIND_QUPATH);
  }

  function selectBiopsyTif() {
    // TODO: don't open multiple dialogs on double click
    ipc.send(channels.OPEN_IMAGE);
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
