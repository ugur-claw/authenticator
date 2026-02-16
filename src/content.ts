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
    background: transparent;
    z-index: 2147483647;
    cursor: crosshair;
  `;

  selectionBox = document.createElement('div');
  // Spotlight efekti: Seçilen alan şeffaf, etrafı yarı saydam siyah (dev gölge ile)
  selectionBox.style.cssText = `
    position: absolute;
    border: 2px solid #007AFF;
    background: transparent;
    box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
    display: none;
    pointer-events: none;
    border-radius: 4px;
  `;

  selectionOverlay.appendChild(selectionBox);
  document.body.appendChild(selectionOverlay);

  selectionOverlay.addEventListener('mousedown', startSelection);
  selectionOverlay.addEventListener('mousemove', updateSelection);
  selectionOverlay.addEventListener('mouseup', endSelection);
  document.addEventListener('keydown', handleKeyDown);
  selectionOverlay.addEventListener('wheel', (e) => e.preventDefault(), { passive: false });
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    cancelSelection();
  }
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

  // Çok küçük seçimleri yoksay
  if (rect.width < 10 || rect.height < 10) {
    cancelSelection();
    return;
  }

  try {
    const response = await chrome.runtime.sendMessage({ action: 'captureScreen' });
    if (response && response.dataUrl) {
      processImage(response.dataUrl, rect);
    } else {
      handleError(response?.error || 'Ekran görüntüsü alınamadı.');
    }
  } catch (err) {
    handleError('Bağlantı hatası.');
  }

  cleanup();
}

function processImage(dataUrl: string, rect: DOMRect) {
  const image = new Image();
  image.onload = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Retina ekranlar için Pixel Ratio kontrolü
    const dpr = window.devicePixelRatio || 1;

    // Seçilen alanı kırp
    const cropX = rect.left * dpr;
    const cropY = rect.top * dpr;
    const cropWidth = rect.width * dpr;
    const cropHeight = rect.height * dpr;

    canvas.width = cropWidth;
    canvas.height = cropHeight;

    ctx.drawImage(
      image,
      cropX, cropY, cropWidth, cropHeight, // Source
      0, 0, cropWidth, cropHeight         // Destination
    );

    const imageData = ctx.getImageData(0, 0, cropWidth, cropHeight);
    const qrCode = jsQR(imageData.data, imageData.width, imageData.height);

    if (qrCode && qrCode.data) {
      chrome.runtime.sendMessage({ action: 'qrScanned', uri: qrCode.data });
    } else {
      handleError('Seçilen alanda QR kod bulunamadı.');
    }
  };
  image.src = dataUrl;
}

function handleError(msg: string) {
  console.error(msg);
  chrome.runtime.sendMessage({ action: 'qrScanError', error: msg });
}

function cancelSelection() {
  cleanup();
  chrome.runtime.sendMessage({ action: 'selectionCancelled' });
}

function cleanup() {
  document.removeEventListener('keydown', handleKeyDown);
  if (selectionOverlay) {
    selectionOverlay.remove();
    selectionOverlay = null;
    selectionBox = null;
  }
  isSelecting = false;
}

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === 'startQrScan' || request.action === 'startSelection') {
    createOverlay();
    sendResponse({ success: true });
  } else if (request.action === 'cancelSelection') {
    cancelSelection();
    sendResponse({ success: true });
  }
});
