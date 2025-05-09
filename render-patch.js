// render-patch.js
import fs from 'fs';

// API-URL-Patch für Frontend
const indexHtmlPath = './dist/public/index.html';
if (fs.existsSync(indexHtmlPath)) {
  let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
  // Fügen Sie ein Script hinzu, das die API-Basis-URL definiert
  indexHtml = indexHtml.replace(
    '</head>',
    `<script>
      window.API_BASE_URL = window.location.origin;
      console.log("API-Basis-URL gesetzt auf:", window.API_BASE_URL);
    </script>
    </head>`
  );
  fs.writeFileSync(indexHtmlPath, indexHtml);
  console.log('index.html gepatcht für Render-Deployment');
}

console.log('Render-Patches abgeschlossen');