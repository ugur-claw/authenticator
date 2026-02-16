// Content script for QR code selection
// Allows users to select an area on the screen to capture QR codes

import jsQR from 'jsqr';

let selectionOverlay: HTMLDivElement | null = null;
let selectionBox: HTMLDivElement | null = null;
let startX = 0;
let startY = 0;
let isSelecting = false;

function createOverlay() {
  if (selectionOverlay) return;
  
  selectionOverlay = document.createElement('div');
  selectionOverlay.id = 'qr-scanner-overlay';
  selectionOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.3);
    z-index: 999999;
    cursor: crosshair;
  `;
  
  selectionBox = document.createElement('div');
  selectionBox.style.cssText = `
    position: absolute;
    border: 2px solid #007AFF;
    background: transparent;
    display: none;
    pointer-events: none;
  `;
  
  selectionOverlay.appendChild(selectionBox);
  document.body.appendChild(selectionOverlay);
  
  selectionOverlay.addEventListener('mousedown', startSelection);
  selectionOverlay.addEventListener('mousemove', updateSelection);
  selectionOverlay.addEventListener('mouseup', endSelection);
  selectionOverlay.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      cancelSelection();
    }
  });
  
  // Prevent scrolling while selecting
  selectionOverlay.addEventListener('wheel', (_e) => _e.preventDefault(), { passive: false });
}

function startSelection(e: MouseEvent) {
  isSelecting = true;
  startX = e.clientX;
  startY = e.clientY;
  
  if (selectionBox) {
    selectionBox.style.display = 'block';
    selectionBox.style.left = `${startX}px`;
    selectionBox.style.top = `${startY}px`;
    selectionBox.style.width = '0px';
    selectionBox.style.height = '0px';
  }
}

function updateSelection(e: MouseEvent) {
  if (!isSelecting || !selectionBox) return;
  
  const currentX = e.clientX;
  const currentY = e.clientY;
  
  const left = Math.min(startX, currentX);
  const top = Math.min(startY, currentY);
  const width = Math.abs(currentX - startX);
  const height = Math.abs(currentY - startY);
  
  selectionBox.style.left = `${left}px`;
  selectionBox.style.top = `${top}px`;
  selectionBox.style.width = `${width}px`;
  selectionBox.style.height = `${height}px`;
}

async function endSelection() {
  if (!isSelecting) return;
  isSelecting = false;
  
  if (!selectionBox) return;
  
  const rect = selectionBox.getBoundingClientRect();
  
  // Minimum selection size
  if (rect.width < 50 || rect.height < 50) {
    cancelSelection();
    return;
  }
  
  // Request screen capture from background script
  try {
    const response = await new Promise<{ stream?: MediaStream; error?: string }>((resolve) => {
      chrome.runtime.sendMessage({ action: 'captureScreen' }, resolve);
    });
    
    if (response.error) {
      chrome.runtime.sendMessage({
        action: 'qrScanError',
        error: response.error
      });
      return;
    }
    
    if (!response.stream) {
      chrome.runtime.sendMessage({
        action: 'qrScanError',
        error: 'Could not capture screen'
      });
      return;
    }
    
    // Create video element to capture frame
    const video = document.createElement('video');
    video.srcObject = response.stream;
    await video.play();
    
    // Create canvas to extract the selected region
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      chrome.runtime.sendMessage({
        action: 'qrScanError',
        error: 'Could not process image'
      });
      return;
    }
    
    // Set video dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame
    ctx.drawImage(video, 0, 0);
    
    // Calculate scale factor between page and video
    const scaleX = video.videoWidth / window.innerWidth;
    const scaleY = video.videoHeight / window.innerHeight;
    
    // Extract selected region (scaled)
    const scaledX = rect.left * scaleX;
    const scaledY = rect.top * scaleY;
    const scaledWidth = rect.width * scaleX;
    const scaledHeight = rect.height * scaleY;
    
    // Create smaller canvas for selected region
    const regionCanvas = document.createElement('canvas');
    regionCanvas.width = rect.width;
    regionCanvas.height = rect.height;
    const regionCtx = regionCanvas.getContext('2d');
    
    if (regionCtx) {
      regionCtx.drawImage(
        canvas,
        scaledX, scaledY, scaledWidth, scaledHeight,
        0, 0, rect.width, rect.height
      );
      
      const imageData = regionCtx.getImageData(0, 0, rect.width, rect.height);
      
      // Try to decode QR code
      const qrCode = jsQR(imageData.data, imageData.width, imageData.height);
      
      if (qrCode && qrCode.data) {
        chrome.runtime.sendMessage({
          action: 'qrScanned',
          uri: qrCode.data
        });
      } else {
        chrome.runtime.sendMessage({
          action: 'qrScanError',
          error: 'No QR code found in selection'
        });
      }
    }
    
    // Stop the stream
    response.stream.getTracks().forEach(track => track.stop());
    
  } catch (err) {
    console.error('Error capturing area:', err);
    chrome.runtime.sendMessage({
      action: 'qrScanError',
      error: 'Failed to capture screen area'
    });
  }
  
  cleanup();
}

function cancelSelection() {
  cleanup();
  chrome.runtime.sendMessage({ action: 'selectionCancelled' });
}

function cleanup() {
  if (selectionOverlay) {
    selectionOverlay.remove();
    selectionOverlay = null;
    selectionBox = null;
  }
  isSelecting = false;
}

// Listen for messages from popup to start selection
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === 'startQrScan' || request.action === 'startSelection') {
    createOverlay();
    sendResponse({ success: true });
  } else if (request.action === 'cancelSelection' || request.action === 'cancelQrScan') {
    cancelSelection();
    sendResponse({ success: true });
  }
}); 