#!/bin/bash
# Dieses Skript bereitet das Projekt für das Deployment auf Render vor
# Es führt notwendige Anpassungen durch und erstellt die ESM-kompatiblen Dateien

# Log-Funktion für bessere Sichtbarkeit
log() {
  echo -e "\e[1;36m▶ $1\e[0m"
}

# Fehler-Funktion
error() {
  echo -e "\e[1;31m❌ $1\e[0m"
  exit 1
}

log "Deployment-Fix für Render wird gestartet..."

# 1. Package.json für ESM anpassen
log "Package.json für ESM anpassen..."
sed -i 's|--outdir=dist|--outfile=dist/index.mjs|g' package.json
sed -i 's|node dist/index.js|node dist/index.mjs|g' package.json
log "✅ Package.json angepasst"

# 2. Umgebungsvariablen für das Deployment vorbereiten
log "Umgebungsvariablen prüfen..."
if [ -z "$DATABASE_URL" ]; then
  log "⚠️ Warnung: DATABASE_URL ist nicht gesetzt"
fi

if [ -z "$SESSION_SECRET" ]; then
  log "⚠️ Warnung: SESSION_SECRET ist nicht gesetzt"
fi

# 3. Build ausführen
log "Build wird durchgeführt..."
npm run build || error "Build fehlgeschlagen"
log "✅ Build erfolgreich abgeschlossen"

# 4. Projekt starten
log "Server wird gestartet..."
npm start

log "Deployment abgeschlossen!"