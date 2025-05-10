# Vereinfachte Authentifizierung

Diese Dateien implementieren eine vereinfachte Version der Authentifizierung ohne die komplexen Workarounds.

## Enthaltene Dateien

- `server/auth-simple.ts` - Vereinfachte Authentifizierungslogik
- `server/index-simple.ts` - Vereinfachter Server-Einstiegspunkt
- `client/src/hooks/use-auth-simple.tsx` - Vereinfachter Auth-Hook für die Frontend-Integration
- `create-sessions-table-simple.sql` - SQL-Skript zum Erstellen der Sessions-Tabelle
- `start-simple.js` - Einfaches Start-Skript

## Verwendung

Um die vereinfachte Version zu verwenden:

1. Stelle sicher, dass die Sessions-Tabelle in der Datenbank existiert (wird bei der Ausführung automatisch erstellt)
2. Starte den Server mit `node start-simple.js`
3. Verwende die `AuthProvider` und `useAuth` aus `client/src/hooks/use-auth-simple.tsx` im Frontend

## Debug-Endpunkte

Die vereinfachte Version enthält die folgenden Debug-Endpunkte:

- `/api/debug` - Gibt Informationen über die aktuelle Session und den Authentifizierungsstatus zurück
- `/api/auth-debug` - Gibt detaillierte Informationen über die Authentifizierung zurück

## Wichtige Punkte

1. Die Session-Konfiguration verwendet:
   - Name: "trading.sid"
   - Sichere Cookies (secure: true)
   - SameSite: "lax"
   - HttpOnly: true

2. Die Benutzerauthentifizierung erfolgt mit Passwortvergleich (im Produktionsbetrieb sollte die Hashing-Funktion verwendet werden)

3. Der Frontend-Hook verwendet die Standard-Navigation ohne Umwege oder spezielle Mechanismen