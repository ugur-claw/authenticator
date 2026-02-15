// Background service worker for Chrome extension
// Handles QR code capture via desktopCapture API

/* eslint-disable @typescript-eslint/no-explicit-any */

interface DesktopCaptureSource {
  id: string;
  name: string;
  thumbnailUrl: string;
}

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === 'captureScreen') {
    (chrome.desktopCapture as any).getDesktopSources({ types: ['screen'] }, (sources: DesktopCaptureSource[]) => {
      const lastError = (chrome.runtime as any).lastError;
      if (lastError) {
        sendResponse({ error: lastError.message || 'Unknown error' });
        return;
      }
      
      if (!sources[0]) {
        sendResponse({ error: 'No screen sources available' });
        return;
      }
      
      // Use the first screen source
      const stream = (navigator.mediaDevices as any).getUserMedia({
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: sources[0].id,
            minWidth: 1920,
            maxWidth: 1920,
            minHeight: 1080,
            maxHeight: 1080,
          },
        },
      });
      
      stream.then((mediaStream: MediaStream) => {
        sendResponse({ stream: mediaStream, sourceId: sources[0].id });
      }).catch((err: Error) => {
        sendResponse({ error: err.message });
      });
      
      return true;
    });
    
    return true;
  }
  
  if (request.action === 'stopCapture') {
    const stream = request.stream as MediaStream | undefined;
    if (stream) {
      stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
    }
    sendResponse({ success: true });
  }
});
