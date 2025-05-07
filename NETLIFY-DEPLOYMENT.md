# Netlify Deployment Guide

Dieses Dokument erläutert den Prozess für das Deployment der Trading Journal App auf Netlify.

## Voraussetzungen

- Ein GitHub-Repository mit dem vollständigen Projekt-Code
- Ein Netlify-Konto
- Eine Neon PostgreSQL-Datenbank

## Deployment-Schritte

1. Repository auf GitHub pushen
   - Stelle sicher, dass alle aktuellen Änderungen gepusht wurden

2. Netlify-Site einrichten
   - Bei Netlify anmelden und "New site from Git" auswählen
   - GitHub als Git-Provider auswählen und dein Repository auswählen
   - Build-Einstellungen:
     - Build command: `npm install && cd client && npx vite build --outDir ../dist/client`
     - Publish directory: `dist/client`

3. Umgebungsvariablen konfigurieren
   - `DATABASE_URL`: Die Verbindungszeichenfolge für deine Neon-Datenbank
   - `SESSION_SECRET`: Ein sicherer String für die Express-Session
   - `OPENAI_API_KEY`: Für die KI-Analyse-Funktionalität (optional)

4. Datenbank-Migration
   - Nach dem ersten erfolgreichen Deployment muss sichergestellt werden, dass die Datenbankstruktur korrekt ist

## Bekannte Probleme und Lösungen

### Import-Aliase (@)
Die Vite-Konfiguration nutzt Import-Aliase (@), die im Netlify-Build-Prozess Probleme verursachen können. Um dies zu beheben:

1. Alle `@`-Importe wurden in relevanten Dateien zu relativen Pfaden umgewandelt
2. Die Hauptdateien, die angepasst wurden:
   - client/src/main.tsx
   - client/src/App.tsx
   - client/src/components/ui/toaster.tsx

### Build-Fehler
Wenn der Build-Prozess fehlschlägt, überprüfe die Build-Logs in der Netlify-Oberfläche. Häufige Probleme sind:
- Fehlende Abhängigkeiten
- Probleme mit Import-Pfaden
- Umgebungsvariablen, die nicht korrekt konfiguriert sind

## Nach dem Deployment

1. Überprüfe die generierten Funktionen im Netlify-Dashboard
2. Teste die API-Endpunkte über die bereitgestellte URL
3. Überprüfe die Benutzerauthentifizierung
   - Username: "admin", Passwort: "admin123"
   - Username: "mo", Passwort: "mo123"