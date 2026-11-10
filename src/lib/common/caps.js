/** Feature detection used to show honest "your browser can't do this" messages instead of failing silently. */
export const caps = {
  webcodecs: typeof VideoEncoder !== 'undefined' && typeof VideoDecoder !== 'undefined',
  audioCodecs: typeof AudioEncoder !== 'undefined',
  mediaRecorder: typeof MediaRecorder !== 'undefined',
  screenCapture: !!navigator.mediaDevices?.getDisplayMedia,
  camera: !!navigator.mediaDevices?.getUserMedia,
  offscreenCanvas: typeof OffscreenCanvas !== 'undefined',
  clipboard: !!navigator.clipboard?.writeText,
  isExtension: typeof __EXTENSION__ !== 'undefined' && __EXTENSION__,
};
