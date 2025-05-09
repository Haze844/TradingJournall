# Render Deployment Guide

Diese Anleitung beschreibt, wie die Anwendung auf Render.com deployed wird.

## Deployment-Konfiguration

Die Anwendung verwendet die `render.yaml` Datei, um das Deployment zu konfigurieren. Diese Datei enthält alle notwendigen Einstellungen für den Webservice und die Datenbank.

### Wichtige Einstellungen:

- **Node.js Web Service**:
  - Build-Befehl: `npm install --include=dev; npm run build`
  - Start-Befehl: `node setup-db.js && node render-patch.js && node express-fix.js && node redirect-fix.js && node custom-deploy.js && node dist/index.js`
  - Umgebungsvariablen:
    - `NODE_ENV`: production
    - `PORT`: 5000
    - `SESSION_SECRET`: Automatisch generiert
    - `DATABASE_URL`: Verbindungsstring zur PostgreSQL-Datenbank

- **PostgreSQL-Datenbank**:
  - Plan: Free

## Deployment-Prozess

1. Bei Render.com anmelden
2. "Blueprint" auswählen und GitHub-Repo verknüpfen
3. Render erkennt die `render.yaml` und erstellt automatisch die Services

## Nach dem Deployment

- Die Anwendung ist unter der URL `https://your-service-name.onrender.com` erreichbar
- Der Standard-Login ist:
  - Benutzer: "admin" mit Passwort "admin123"
  - Benutzer: "mo" mit Passwort "mo123"

## Wichtige Hinweise

- Bei der ersten Anfrage nach einer Inaktivitätsphase benötigt die Anwendung 30-60 Sekunden zur Initialisierung (Free Tier Einschränkung)
- Die Root-URL (`/`) leitet automatisch zur Auth-Seite (`/auth`) weiter
- Die Express-Konfiguration wurde speziell für Render angepasst, um korrekte Weiterleitungen zu gewährleisten

## Fehlerbehebung

Falls Probleme mit dem Deployment auftreten:

1. Überprüfen Sie die Logs in der Render-Konsole
2. Stellen Sie sicher, dass die PostgreSQL-Datenbank korrekt initialisiert wurde
3. Prüfen Sie, ob alle erforderlichen Skripte (`setup-db.js`, `render-patch.js`, `express-fix.js`, `redirect-fix.js`, `custom-deploy.js`) vorhanden sind

Für weitere Unterstützung kontaktieren Sie den Administrator.