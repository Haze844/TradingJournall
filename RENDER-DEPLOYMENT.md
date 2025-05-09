# Render Deployment Guide

Dieses Dokument beschreibt den Prozess und die Konfiguration für das Deployment der Trading-Journal-Anwendung auf Render.com.

## Voraussetzungen

- Render.com-Konto
- PostgreSQL-Datenbank (z.B. über Neon.tech)
- Node.js-Umgebung für den Build-Prozess

## Deployment-Konfiguration

### Umgebungsvariablen

Die folgenden Umgebungsvariablen müssen in der Render-Konfiguration gesetzt werden:

| Variable | Beschreibung | Beispiel |
|----------|-------------|----------|
| `NODE_ENV` | Umgebungstyp | `production` |
| `PORT` | Port für den Webserver | `5000` |
| `SESSION_SECRET` | Geheimer Schlüssel für Sitzungsverschlüsselung | `your-secret-key` |
| `DATABASE_URL` | PostgreSQL-Verbindungsstring | `postgresql://<username>:<password>@<host>:<port>/<database>?sslmode=require` |

### Build-Befehle

**Build-Befehl:**
```
npm install --include=dev && npm run build
```

**Start-Befehl:**
```
node setup-db.js && node custom-deploy.js && node express-fix.js && node dist/index.js
```

## Patch-Dateien

Die Anwendung verwendet vier spezielle Patch-Dateien für das Render-Deployment:

### 1. setup-db.js

Diese Datei initialisiert die Datenbank und erstellt die erforderlichen Tabellen beim ersten Start. Sie sollte in der Produktion nur beim ersten Deployment oder nach Datenbankänderungen ausgeführt werden.

Hauptfunktionen:
- Verbindung zur PostgreSQL-Datenbank herstellen
- Tabellen erstellen, falls sie nicht existieren
- Standardbenutzer erstellen (admin/admin123 und mo/mo123)

### 2. render-patch.js

Diese Datei passt die kompilierte Frontend-Anwendung für das Deployment auf Render an.

Hauptfunktionen:
- Fügt `<base href="/">` für korrekte Pfadauflösung hinzu
- Implementiert Umgebungserkennung für Render
- Korrigiert doppelte API-Pfade (/api/api/ → /api/)
- Verbessert die Error-Handling für API-Anfragen
- Erstellt eine 404.html-Datei für Client-seitiges Routing
- Fügt automatische Weiterleitung von / zu /auth hinzu

### 3. express-fix.js

Diese Datei ändert die kompilierte Express-Anwendung, um korrekte Content-Type-Header und CORS-Konfiguration zu gewährleisten.

Hauptfunktionen:
- Setzt Content-Type-Header für API-Antworten auf 'application/json'
- Fügt CORS-Header für Cross-Origin-Anfragen hinzu
- Konfiguriert SPA-Routing mit Client-seitiger Weiterleitung

### 4. redirect-fix.js

Diese Datei erstellt eine statische Weiterleitungsseite, um das Problem mit Weiterleitungsschleifen zu beheben.

Hauptfunktionen:
- Platziert eine spezielle statische HTML-Datei direkt im Hauptverzeichnis
- Implementiert Schleifenerkennung mit sessionStorage
- Zählt Weiterleitungen, um Endlosschleifen zu verhindern
- Bietet Fallback mit direktem Login-Button, falls Weiterleitungen fehlschlagen

## Authentifizierung

Die Anwendung verwendet eine Express-Session-basierte Authentifizierung mit PassportJS.

Standardbenutzer:
- Username: `admin`, Passwort: `admin123`
- Username: `mo`, Passwort: `mo123`

## Fehlerbehebung

### Häufige Probleme

1. **HTML statt JSON in API-Antworten**
   - Überprüfen Sie die Content-Type-Header in den Netzwerkanfragen
   - Prüfen Sie, ob `express-fix.js` korrekt ausgeführt wurde

2. **Frontend kann nicht auf API zugreifen**
   - Überprüfen Sie, ob `render-patch.js` korrekt ausgeführt wurde
   - Kontrollieren Sie die Browser-Konsole auf API-Fehler

3. **Datenbankverbindungsprobleme**
   - Überprüfen Sie den `DATABASE_URL`-String
   - Stellen Sie sicher, dass die Datenbank erreichbar ist
   - Prüfen Sie, ob die Schemas korrekt erstellt wurden

## Monitoring

Für die Überwachung der Anwendung:
- Verwenden Sie die Render-Dashboard-Metriken für grundlegende Leistungsüberwachung
- Implementieren Sie in Zukunft einen umfassenderen Monitoring-Dienst wie Sentry oder New Relic

## Backup-Strategie

Neon.tech bietet automatische Backups für PostgreSQL-Datenbanken. Zusätzlich empfehlen wir:
- Regelmäßige manuelle Backups mit `pg_dump`
- Geplante Exporte aller Daten in einem portablen Format