# Render Deployment Guide

## Übersicht

Dieses Dokument beschreibt das Deployment der Trading Journal Anwendung auf Render.com.

## Setup-Anleitung

### 1. Render-Konto erstellen

Falls noch nicht geschehen, erstellen Sie ein Konto auf [Render.com](https://render.com).

### 2. Neuen Web-Service einrichten

1. Gehen Sie zum Render Dashboard
2. Klicken Sie auf "New +" und wählen Sie "Web Service"
3. Verbinden Sie Ihr GitHub-Repository oder laden Sie den Code direkt hoch
4. Konfigurieren Sie den Service:
   - Name: trading-journal
   - Region: Wählen Sie die Region, die Ihrem Standort am nächsten ist
   - Branch: main (oder Ihr bevorzugter Branch)
   - Runtime: Node
   - Build Command: `npm install && npm run build`
   - Start Command: `node server.js`
   - Plan: Free (oder wählen Sie einen kostenpflichtigen Plan für bessere Performance)

### 3. Umgebungsvariablen konfigurieren

Folgende Umgebungsvariablen müssen eingerichtet werden:

- `NODE_ENV`: production
- `PORT`: 10000 (oder ein anderer Port)
- `SESSION_SECRET`: Ein sicherer, zufälliger String
- `DATABASE_URL`: Die URL zu Ihrer PostgreSQL-Datenbank
- `OPENAI_API_KEY`: Ihr OpenAI API-Schlüssel (wenn benötigt)

### 4. Datenbank einrichten

1. Gehen Sie zum Render Dashboard
2. Klicken Sie auf "New +" und wählen Sie "PostgreSQL"
3. Konfigurieren Sie die Datenbank:
   - Name: trading-journal-db
   - Database: trading_journal
   - User: trading_journal_user
   - Region: Die gleiche Region wie Ihr Web Service
   - Plan: Free (oder wählen Sie einen kostenpflichtigen Plan)

4. Nach der Erstellung kopieren Sie die Verbindungs-URL und setzen Sie sie als `DATABASE_URL` Umgebungsvariable in Ihrem Web Service.

### 5. Deployment ausführen

Nach dem Einrichten wird Render automatisch den Build-Prozess starten und die Anwendung deployen. Sie können den Fortschritt im Dashboard verfolgen.

## Fehlersuche

- **Build schlägt fehl**: Überprüfen Sie die Build-Logs auf Fehler und stellen Sie sicher, dass alle benötigten Abhängigkeiten installiert sind.

- **Anwendung zeigt eine 500-Fehlerseite**: Überprüfen Sie die Logs, um das Problem zu identifizieren. Häufige Probleme sind falsche Datenbankverbindungen oder fehlende Umgebungsvariablen.

- **Datenbankverbindungsprobleme**: Stellen Sie sicher, dass die `DATABASE_URL` korrekt ist und die Datenbank erreichbar ist. Überprüfen Sie auch, ob die Datenbanktabellen erstellt wurden.

- **API-Endpunkte funktionieren nicht**: Überprüfen Sie, ob der Pfad korrekt ist (z.B. `/api/...`) und ob die Backend-Routen richtig konfiguriert sind.

## Nützliche Links

- [Render Dokumentation](https://render.com/docs)
- [Render Pricing](https://render.com/pricing)
- [Render Status](https://status.render.com/)