// Build-Script für Netlify-Deployment
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Dirname Ersatz für ES-Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Funktion zum rekursiven Durchsuchen von Dateien
function walkSync(dir, filelist = []) {
  fs.readdirSync(dir).forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist' && file !== '.git') {
        filelist = walkSync(filePath, filelist);
      }
    } else if (
      file.endsWith('.tsx') || 
      file.endsWith('.ts') || 
      file.endsWith('.js') || 
      file.endsWith('.jsx')
    ) {
      filelist.push(filePath);
    }
  });
  return filelist;
}

// Dateien in client/src finden
const clientDir = path.join(__dirname, 'client', 'src');
const files = walkSync(clientDir);

// Alias-Map für Ersetzungen
const aliasMap = {
  '@/hooks/': '../hooks/',
  '@/components/': '../components/',
  '@/lib/': '../lib/',
  '@/pages/': '../pages/',
  '@/': '../',
  '@shared/': '../../shared/',
};

// Ersetze alle Aliase in den gefundenen Dateien
let replacementCount = 0;
files.forEach(file => {
  try {
    let content = fs.readFileSync(file, 'utf8');
    let hasReplacement = false;
    
    // Aliase ersetzen
    for (const [alias, replacement] of Object.entries(aliasMap)) {
      const regex = new RegExp(`from ["']${alias}`, 'g');
      if (regex.test(content)) {
        hasReplacement = true;
        content = content.replace(regex, `from "${replacement}`);
      }
      
      const importRegex = new RegExp(`import ["']${alias}`, 'g');
      if (importRegex.test(content)) {
        hasReplacement = true;
        content = content.replace(importRegex, `import "${replacement}`);
      }
    }
    
    // Speichere die Datei nur, wenn Ersetzungen vorgenommen wurden
    if (hasReplacement) {
      fs.writeFileSync(file, content, 'utf8');
      replacementCount++;
      console.log(`Replaced aliases in: ${file}`);
    }
  } catch (err) {
    console.error(`Error processing file ${file}:`, err);
  }
});

console.log(`Completed! Replaced aliases in ${replacementCount} files.`);