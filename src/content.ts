// Content script for QR code selection
// Allows users to select an area on the screen to capture QR codes

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

function endSelection() {
  if (!isSelecting) return;
  isSelecting = false;
  
  if (!selectionBox) return;
  
  const rect = selectionBox.getBoundingClientRect();
  
  // Minimum selection size
  if (rect.width < 50 || rect.height < 50) {
    cancelSelection();
    return;
  }
  
  // Send selected area to extension
  chrome.runtime.sendMessage({
    action: 'areaSelected',
    area: {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
    },
  });
  
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
  if (request.action === 'startSelection') {
    createOverlay();
    sendResponse({ success: true });
  } else if (request.action === 'cancelSelection') {
    cancelSelection();
    sendResponse({ success: true });
  }
});
