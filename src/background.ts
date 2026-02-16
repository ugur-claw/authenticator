chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === 'captureScreen') {
    // Aktif pencerenin görünen kısmının ekran görüntüsünü al
    (chrome.tabs.captureVisibleTab as any)(null, { format: 'png' }, (dataUrl: string | undefined) => {
      if (chrome.runtime.lastError) {
        console.error('[Background] Capture error:', chrome.runtime.lastError);
        sendResponse({ error: chrome.runtime.lastError.message });
      } else {
        // DataURL (base64 resim) döner, bu transfer edilebilir
        sendResponse({ dataUrl });
      }
    });
    // Asenkron yanıt vereceğimizi belirtiyoruz
    return true;
  }
});
