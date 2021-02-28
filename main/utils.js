
// wrap a function, so calls are delayed and sent in batches
function batchify(batchSize, maxWait, target) {
  let bufferedItems = [];
  let timeout = null;

  function send() {
    if (bufferedItems.length > 0) {
      const readyItems = bufferedItems;
      bufferedItems = [];
      target(readyItems);
    }
    if (timeout != null) {
      clearTimeout(timeout);
      timeout = null;
    }
  }

  return arg => {
    bufferedItems.push(arg);
    if (timeout == null) {
      timeout = setTimeout(send, maxWait);
    }
    if (bufferedItems.length >= batchSize) {
      send();
    }
  }
}

module.exports = {
  batchify
};
