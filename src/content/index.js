// src/content/index.js

(function() {
  const getMetaContent = (name) => {
    const meta = document.querySelector(`meta[name='${name}']`);
    return meta ? meta.content : '';
  };

  const metadata = {
    description: getMetaContent('description'),
    keywords: getMetaContent('keywords'),
  };

  chrome.runtime.sendMessage({ type: 'METADATA_RESULT', metadata });
})(); 