# Trading Journal App

Eine fortschrittliche Trading-Journal-Anwendung zur Verfolgung und Analyse von Trades mit umfassenden statistischen Auswertungen.

## Funktionen

- Umfassendes Trading-Journal mit erweiterten Parametern
- Trendanalyse über mehrere Zeitrahmen
- Statistische Auswertung der Trading-Performance
- Risikomanagement und Drawdown-Berechnung
- Benutzerauthentifizierung mit mehreren Konten
- Filtermöglichkeiten für Datenanalyse
- Visualisierungstools und Heatmaps

## Technische Details

- Frontend: React mit Tailwind CSS und TypeScript
- Backend: Node.js Express
- Datenbank: PostgreSQL (Neon)
- Authentifizierung: Express-Session mit Passport

## Deployment

### Lokale Installation

1. Repository klonen
2. `npm install` ausführen
3. Umgebungsvariablen in `.env` konfigurieren:
   - `DATABASE_URL` - PostgreSQL-Verbindungszeichenfolge
   - `OPENAI_API_KEY` - Für KI-Analyse (optional)
4. `npm run dev` ausführen

### Produktion

Die Anwendung ist für das Deployment auf Plattformen wie Netlify oder Vercel konfiguriert.

## Zukunftspläne

- Erweiterte Makroökonomische Analysen
- Trading-Streak und Gamification-Features
- Mobile App Integration