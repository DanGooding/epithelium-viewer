import { useState, useEffect } from 'react';

function getWindowSize() {
  const {innerWidth, innerHeight} = window;
  return [innerWidth, innerHeight];
}

// hook that provides the window's [width, height].
export function useWindowSize() {
  const [windowSize, setWindowSize] = useState(getWindowSize());

  useEffect(() => {
    function handleResize() {
      setWindowSize(getWindowSize());
    }
    // register on mount
    window.addEventListener('resize', handleResize);

    // cleanup on unmount
    return () => window.removeEventListener('resize', handleResize);
  });

  return windowSize;
}

export function withWindowSize(Component) {
  return (props) => {
    const [width, height] = useWindowSize();
    return <Component windowWidth={width} windowHeight={height} {...props} />;
  }
}
