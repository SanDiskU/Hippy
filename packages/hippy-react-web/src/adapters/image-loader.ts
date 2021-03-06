/* eslint no-use-before-define: ["error", { "functions": false }] */

interface Requests {
  [key: string]: any;
}

type SizeSucces = (width: number, height: number) => void;
type SizeFailure = () => void;
type LoadSuccess = (ev: Event) => void;

let id = 0;
const requests: Requests = {};

const ImageLoader = {
  abort(requestId: number) {
    let image = requests[`${requestId}`];
    if (image) {
      image.onerror = null;
      image.onload = null;
      image = null;
      delete requests[`${requestId}`];
    }
  },
  getSize(uri: string, success: SizeSucces, failure: SizeFailure) {
    let complete = false;
    const interval = setInterval(callback, 16);
    const requestId = ImageLoader.load(uri, callback, errorCallback);

    function callback() {
      const image = requests[`${requestId}`];
      if (image) {
        const { naturalHeight, naturalWidth } = image;
        if (naturalHeight && naturalWidth) {
          success(naturalWidth, naturalHeight);
          complete = true;
        }
      }
      if (complete) {
        ImageLoader.abort(requestId);
        clearInterval(interval);
      }
    }

    function errorCallback() {
      if (typeof failure === 'function') {
        failure();
      }
      ImageLoader.abort(requestId);
      clearInterval(interval);
    }
  },
  load(uri: string, onLoad: LoadSuccess, onError: OnErrorEventHandler) {
    id += 1;
    const image = new window.Image();
    image.onerror = onError;
    image.onload = (e) => {
      // avoid blocking the main thread
      const onDecode = () => onLoad(e);
      if (typeof image.decode === 'function') {
        // Safari currently throws exceptions when decoding svgs.
        // We want to catch that error and allow the load handler
        // to be forwarded to the onLoad handler in this case
        image.decode()
          .then(onDecode, onDecode);
      } else {
        setTimeout(onDecode, 0);
      }
    };
    image.src = uri;
    requests[`${id}`] = image;
    return id;
  },
  prefetch(uri: string) {
    return new Promise((resolve, reject) => {
      ImageLoader.load(uri, resolve, reject);
    });
  },
};

export default ImageLoader;
