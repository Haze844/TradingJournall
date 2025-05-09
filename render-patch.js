// render-patch.js
const fs = require('fs');

// API-URL-Patch für Frontend
const indexHtmlPath = './dist/public/index.html';
if (fs.existsSync(indexHtmlPath)) {
  let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
  // Fügen Sie ein Script hinzu, das die API-Basis-URL definiert und API-Pfade korrigiert
  indexHtml = indexHtml.replace(
    '</head>',
    `<script>
      window.API_BASE_URL = '';  // Leerer String, um relative Pfade zu verwenden
      // Fix für doppelte /api-Pfade
      const originalFetch = window.fetch;
      window.fetch = function(url, options) {
        if (url.startsWith('/api/api/')) {
          url = url.replace('/api/api/', '/api/');
          console.log('Korrigierter API-Pfad:', url);
        }
        return originalFetch(url, options);
      };
      console.log("API-Routen-Patch angewendet");
    </script>
    </head>`
  );
  fs.writeFileSync(indexHtmlPath, indexHtml);
  console.log('index.html gepatcht für Render-Deployment');
}

console.log('Render-Patches abgeschlossen');