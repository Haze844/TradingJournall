# Supabase-Integration mit Trading Journal

Diese Anleitung erklärt, wie du das Trading Journal mit einer Supabase-Datenbank verbinden kannst.

## Warum Supabase?

[Supabase](https://supabase.com/) ist eine Open-Source-Alternative zu Firebase, die eine PostgreSQL-Datenbank mit einfacher Verwaltung bietet. Vorteile:

- Kostenloser Plan mit großzügigen Limits
- Einfache Verwaltung über ein übersichtliches Dashboard
- Volle PostgreSQL-Funktionalität
- Automatische Backups
- Integrierte Authentifizierung (für zukünftige Funktionen)
- Realtime-Updates (für zukünftige Funktionen)

## 1. Supabase-Projekt erstellen

1. Gehe zu [Supabase](https://supabase.com/) und erstelle ein kostenloses Konto
2. Klicke auf "New Project"
3. Wähle einen Projektnamen (z.B. "trading-journal")
4. Wähle ein sicheres Datenbankpasswort und speichere es
5. Wähle eine Region in deiner Nähe
6. Klicke auf "Create new project"

## 2. Verbindungsdaten kopieren

1. Warte, bis dein Projekt erstellt wurde (kann einige Minuten dauern)
2. Gehe zu "Project Settings" → "Database"
3. Scrolle zu "Connection string" und wähle "URI"
4. Kopiere die Connection URI (sie beginnt mit `postgresql://postgres:`)
5. **Wichtig**: Ersetze `[YOUR-PASSWORD]` in der URI mit dem Datenbankpasswort, das du festgelegt hast

## 3. Lokale Entwicklung mit Supabase

### Option A: Direkt starten

```bash
# Setze die Umgebungsvariablen
export DATABASE_URL="deine-supabase-uri"
export DATABASE_PROVIDER="supabase"

# Starte die Anwendung
npm run dev
```

### Option B: Mit unserem Starter-Skript

```bash
# Das Skript fordert dich zur Eingabe der Supabase-URI auf
node start-supabase.js
```

## 4. Deployment auf Render mit Supabase

1. Gehe zu [Render](https://render.com/) und melde dich an
2. Wähle "New" → "Web Service"
3. Verbinde dein GitHub-Repository
4. Konfiguriere den Service:
   - **Name**: Trading Journal
   - **Environment**: Node
   - **Build Command**: `npm install --include=dev && npm run build`
   - **Start Command**: `node setup-supabase.js && node render-patch.cjs && node dist/index.js`
5. Füge folgende Umgebungsvariablen hinzu:
   - `DATABASE_URL`: Deine Supabase-URI
   - `DATABASE_PROVIDER`: `supabase`
   - `NODE_ENV`: `production`
   - `PORT`: `10000`
   - `SESSION_SECRET`: Ein zufälliger, sicherer String
6. Wähle "Create Web Service"

## 5. Migration von einer bestehenden Datenbank

Wenn du bereits eine Neon-Datenbank verwendest und zu Supabase migrieren möchtest:

```bash
# Setze die Umgebungsvariablen oder gib sie interaktiv ein
export NEON_DATABASE_URL="deine-neon-uri"
export SUPABASE_DATABASE_URL="deine-supabase-uri"

# Starte die Migration
node migrate-to-supabase.js
```

Das Skript migriert alle Daten (Benutzer, Trades, Einstellungen, Statistiken) automatisch.

## Fehlerbehebung

### Verbindungsprobleme

- **Fehler "keine Verbindung zur Datenbank"**: Überprüfe, ob du `[YOUR-PASSWORD]` in der URI durch dein tatsächliches Passwort ersetzt hast.
- **Zugriffsprobleme**: Stelle sicher, dass deine IP-Adresse in Supabase nicht blockiert ist ("Project Settings" → "Database" → "Connection Pooling").

### Tabellen fehlen

Führe das Setup-Skript aus, um alle Tabellen zu erstellen:

```bash
export DATABASE_URL="deine-supabase-uri"
node setup-supabase.js
```

## Support

Bei Fragen zur Supabase-Integration kontaktiere uns unter support@tradingjournall.com