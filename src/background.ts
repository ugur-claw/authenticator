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
    console.log('[Background] captureScreen requested');
    
    // Use Promise-based approach for getDesktopSources
    // Note: getDesktopSources may not have TypeScript types, so we cast
    const desktopCaptureApi = chrome.desktopCapture as unknown as {
      getDesktopSources: (options: { types: string[] }) => Promise<DesktopCaptureSource[]>;
    };
    
    desktopCaptureApi.getDesktopSources({ types: ['screen'] })
      .then((sources: DesktopCaptureSource[]) => {
        console.log('[Background] Desktop sources found:', sources.length);
        
        const lastError = (chrome.runtime as any).lastError;
        if (lastError) {
          console.error('[Background] Desktop capture error:', lastError);
          sendResponse({ error: lastError.message || 'Unknown error getting desktop sources' });
          return;
        }
        
        if (!sources || sources.length === 0) {
          console.error('[Background] No screen sources available');
          sendResponse({ error: 'No screen sources available. Please grant screen capture permission.' });
          return;
        }
        
        // Use the first screen source
        console.log('[Background] Using source:', sources[0].name, sources[0].id);
        
        return (navigator.mediaDevices as any).getUserMedia({
          audio: false,
          video: {
            mandatory: {
              chromeMediaSource: 'desktop',
              chromeMediaSourceId: sources[0].id,
              minWidth: 1280,
              maxWidth: 3840,
              minHeight: 720,
              maxHeight: 2160,
            },
          },
        });
      })
      .then((mediaStream: MediaStream | undefined) => {
        if (!mediaStream) {
          // Stream was not created (error happened in previous .then)
          return;
        }
        console.log('[Background] Screen capture stream created successfully');
        sendResponse({ stream: mediaStream });
      })
      .catch((err: Error) => {
        console.error('[Background] Screen capture error:', err);
        sendResponse({ error: err.message || 'Failed to capture screen' });
      });
    
    // Return true to indicate we'll respond asynchronously
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
