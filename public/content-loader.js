// public/content-loader.js
(async () => {
  try {
    // Gerçek content.js dosyasını modül olarak yükle
    const src = chrome.runtime.getURL('content.js');
    await import(src);
  } catch (e) {
    console.error("Content script yüklenirken hata oluştu:", e);
  }
})();
