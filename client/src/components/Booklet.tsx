import { Button } from "@/components/ui/button";
import {
  FileUp, Download, Brain, BarChart2, Activity, Trophy, Calendar, 
  Users, TrendingDown, DollarSign, ChevronDown
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function Booklet() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="rocket-card rounded-xl p-8 mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-extrabold text-2xl shadow-lg">
            LVL<br />UP
          </div>
          <div>
            <h1 className="text-3xl font-extrabold moon-text">LvlUp Trading</h1>
            <p className="text-gray-400">Benutzerhandbuch und Dokumentation</p>
          </div>
        </div>
        
        <p className="text-lg mb-6">
          Willkommen zum LvlUp Trading Benutzerhandbuch. Hier findest du eine ausführliche Erklärung aller Funktionen und Möglichkeiten der Anwendung.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button variant="outline" className="justify-start">
            <FileUp className="mr-2 h-4 w-4" /> Import Optionen
          </Button>
          <Button variant="outline" className="justify-start">
            <Brain className="mr-2 h-4 w-4" /> KI-Analysen
          </Button>
          <Button variant="outline" className="justify-start">
            <BarChart2 className="mr-2 h-4 w-4" /> Risikomanagement
          </Button>
          <Button variant="outline" className="justify-start">
            <Activity className="mr-2 h-4 w-4" /> Marktphasen-Analyse
          </Button>
          <Button variant="outline" className="justify-start">
            <Trophy className="mr-2 h-4 w-4" /> Trading Coach
          </Button>
          <Button variant="outline" className="justify-start">
            <Calendar className="mr-2 h-4 w-4" /> Makro-Kalender
          </Button>
        </div>
      </div>

      {/* Inhaltsverzeichnis */}
      <div className="rocket-card rounded-xl p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">Inhaltsverzeichnis</h2>
        <ul className="space-y-2">
          <li className="flex items-center">
            <span className="text-primary mr-2">1.</span>
            <a href="#dashboard" className="hover:text-primary">Dashboard & Navigation</a>
          </li>
          <li className="flex items-center">
            <span className="text-primary mr-2">2.</span>
            <a href="#trade-management" className="hover:text-primary">Trade-Management</a>
          </li>
          <li className="flex items-center">
            <span className="text-primary mr-2">3.</span>
            <a href="#ai-analysis" className="hover:text-primary">KI-Analyse</a>
          </li>
          <li className="flex items-center">
            <span className="text-primary mr-2">4.</span>
            <a href="#risk-management" className="hover:text-primary">Risikomanagement</a>
          </li>
          <li className="flex items-center">
            <span className="text-primary mr-2">5.</span>
            <a href="#market-phases" className="hover:text-primary">Marktphasen-Analyse</a>
          </li>
          <li className="flex items-center">
            <span className="text-primary mr-2">6.</span>
            <a href="#coach" className="hover:text-primary">Trading Coach</a>
          </li>
          <li className="flex items-center">
            <span className="text-primary mr-2">7.</span>
            <a href="#macro-calendar" className="hover:text-primary">Makroökonomischer Kalender</a>
          </li>
          <li className="flex items-center">
            <span className="text-primary mr-2">8.</span>
            <a href="#social" className="hover:text-primary">Social Trading</a>
          </li>
          <li className="flex items-center">
            <span className="text-primary mr-2">9.</span>
            <a href="#import-export" className="hover:text-primary">Import & Export</a>
          </li>
        </ul>
      </div>

      {/* Dashboard & Navigation */}
      <div id="dashboard" className="rocket-card rounded-xl p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">1. Dashboard & Navigation</h2>
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2">Hauptnavigation</h3>
          <p className="mb-4">
            Das Dashboard ist deine zentrale Anlaufstelle. Von hier aus hast du Zugriff auf alle Funktionen der Anwendung:
          </p>
          <ul className="space-y-2 mb-4">
            <li className="flex items-center">
              <Activity className="h-4 w-4 mr-2 text-primary" />
              <span><strong>Dashboard:</strong> Übersicht über deine Trade-Aktivitäten</span>
            </li>
            <li className="flex items-center">
              <Brain className="h-4 w-4 mr-2 text-primary" />
              <span><strong>KI-Analyse:</strong> Automatische Erkennung von Handelsmustern und Verbesserungspotential</span>
            </li>
            <li className="flex items-center">
              <BarChart2 className="h-4 w-4 mr-2 text-primary" />
              <span><strong>Risikomanagement:</strong> Analyse deiner Risikometriken und Optimierungsmöglichkeiten</span>
            </li>
            <li className="flex items-center">
              <Activity className="h-4 w-4 mr-2 text-primary" />
              <span><strong>Marktphasen:</strong> Analyse deiner Performance in verschiedenen Marktphasen</span>
            </li>
          </ul>
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm">
              <strong>Tipp:</strong> Die Navigationsleiste ist immer oben verfügbar. Für schnellen Zugriff auf wichtige Funktionen, nutze die direkten Tab-Links unterhalb des Headers.
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">Zusätzliche Funktionen</h3>
          <p className="mb-4">
            Außerhalb des Dashboards kannst du auf diese erweiterten Funktionen zugreifen:
          </p>
          <ul className="space-y-2">
            <li className="flex items-center">
              <Trophy className="h-4 w-4 mr-2 text-primary" />
              <span><strong>Trading Coach:</strong> Personalisierte Verbesserungsvorschläge und Ziele</span>
            </li>
            <li className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-primary" />
              <span><strong>Makro-Kalender:</strong> Übersicht wichtiger Wirtschaftsereignisse</span>
            </li>
            <li className="flex items-center">
              <Users className="h-4 w-4 mr-2 text-primary" />
              <span><strong>Social Trading:</strong> Teile und lerne von anderen Tradern</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Trade-Management */}
      <div id="trade-management" className="rocket-card rounded-xl p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">2. Trade-Management</h2>
        
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2">Trade-Tabelle</h3>
          <p className="mb-4">
            Die Trade-Tabelle zeigt alle deine erfassten Trades mit wichtigen Informationen auf einen Blick:
          </p>
          <ul className="space-y-1 mb-4">
            <li>• Datum und Symbol</li>
            <li>• Setup und Trendanalyse</li>
            <li>• Entry-Typ und Level</li>
            <li>• Risk-Reward-Verhältnis</li>
            <li>• Profit/Loss</li>
          </ul>
          <div className="bg-muted p-4 rounded-lg mb-4">
            <p className="text-sm">
              <strong>Filterfunktion:</strong> Nutze die Filterleiste oberhalb der Tabelle, um Trades nach verschiedenen Kriterien zu filtern, wie Datum, Symbol, Setup, Trend oder Entry-Typ.
            </p>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2">Trade-Details</h3>
          <p className="mb-4">
            Durch Klicken auf einen Trade in der Tabelle werden die vollständigen Details im rechten Seitenbereich angezeigt:
          </p>
          <ul className="space-y-1 mb-4">
            <li>• Vollständige Trade-Informationen</li>
            <li>• Kommentare und Notizen</li>
            <li>• Angehängte Chart-Screenshots</li>
            <li>• KI-generiertes Feedback zum Trade</li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">Wöchentliche Zusammenfassung</h3>
          <p className="mb-4">
            Unterhalb der Trade-Tabelle findest du eine wöchentliche Zusammenfassung mit wichtigen Kennzahlen:
          </p>
          <ul className="space-y-1">
            <li>• Gesamtzahl der Trades</li>
            <li>• Gewinnrate</li>
            <li>• Durchschnittliches RR-Verhältnis</li>
            <li>• Gesamtperformance</li>
            <li>• Vergleich zur Vorwoche</li>
          </ul>
        </div>
      </div>

      {/* KI-Analyse */}
      <div id="ai-analysis" className="rocket-card rounded-xl p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">3. KI-Analyse</h2>
        
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2">Trading-Muster</h3>
          <p className="mb-4">
            Die KI analysiert deine Trade-Historie und identifiziert wiederkehrende Muster:
          </p>
          <ul className="space-y-1 mb-4">
            <li>• Erkennung deiner erfolgreichsten Setups</li>
            <li>• Identifikation von Schwachstellen und Problemen</li>
            <li>• Analyse von emotionalen Mustern (Overtrading, Revenge Trading)</li>
            <li>• Vorschläge zur Optimierung</li>
          </ul>
          <div className="bg-muted p-4 rounded-lg mb-4">
            <p className="text-sm">
              <strong>Tipp:</strong> Klicke auf "Neue Analyse generieren", um eine frische KI-Beurteilung basierend auf deinen neuesten Trades zu erhalten.
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">Erweiterte Trade-Analyse</h3>
          <p className="mb-4">
            Detaillierte Analysen zu spezifischen Aspekten deines Tradings:
          </p>
          <ul className="space-y-1">
            <li>• Zeitbasierte Analyse (beste Trading-Zeiten)</li>
            <li>• Symbol-Performance (was funktioniert am besten)</li>
            <li>• Setup-Erfolgsanalyse</li>
            <li>• Psychologische Faktoren und Gewohnheiten</li>
          </ul>
        </div>
      </div>

      {/* Risikomanagement */}
      <div id="risk-management" className="rocket-card rounded-xl p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">4. Risikomanagement</h2>
        
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2">Drawdown-Analyse</h3>
          <p className="mb-4">
            Verfolge und analysiere deine Drawdowns:
          </p>
          <ul className="space-y-1 mb-4">
            <li>• Historische Drawdown-Perioden</li>
            <li>• Maximaler Drawdown</li>
            <li>• Durchschnittliche Erholungszeit</li>
            <li>• Drawdown-Vergleich (Aktuell vs. Historisch)</li>
          </ul>
          <div className="rounded-lg border p-4 mb-4">
            <div className="flex items-center">
              <TrendingDown className="h-5 w-5 mr-2 text-destructive" />
              <h4 className="font-medium">Drawdown-Warnung</h4>
            </div>
            <p className="text-sm mt-2">
              Die Anwendung benachrichtigt dich, wenn du dich einem kritischen Drawdown-Level näherst oder bereits darin befindest.
            </p>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2">Risiko pro Trade</h3>
          <p className="mb-4">
            Überwache dein Risiko pro Trade und optimiere es:
          </p>
          <ul className="space-y-1 mb-4">
            <li>• Durchschnittliches Risiko pro Trade</li>
            <li>• Risk-Reward-Verhältnis über Zeit</li>
            <li>• Risiko-Konsistenz</li>
            <li>• Optimales Risiko basierend auf deiner Performance</li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">Positionsgrößen-Kalkulator</h3>
          <p className="mb-4">
            Berechne die optimale Positionsgröße für deine Trades:
          </p>
          <ul className="space-y-1">
            <li>• Basierend auf deinem Kontostand</li>
            <li>• Anpassbar an dein Risikoprofil</li>
            <li>• Berücksichtigung von Stop-Loss-Levels</li>
            <li>• Automatische Berechnung basierend auf Währungspaar und Volatilität</li>
          </ul>
        </div>
      </div>

      {/* Marktphasen-Analyse */}
      <div id="market-phases" className="rocket-card rounded-xl p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">5. Marktphasen-Analyse</h2>
        
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2">Marktphasen-Verteilung</h3>
          <p className="mb-4">
            Analyse der verschiedenen Marktphasen in deiner Trading-Historie:
          </p>
          <ul className="space-y-1 mb-4">
            <li>• Trend-Phasen</li>
            <li>• Range-Phasen</li>
            <li>• Volatile Phasen</li>
          </ul>
          <div className="bg-muted p-4 rounded-lg mb-4">
            <p className="text-sm">
              <strong>Verteilungsdiagramm:</strong> Visualisiert den Anteil jeder Marktphase an deinen gesamten Trades.
            </p>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2">Performance nach Marktphase</h3>
          <p className="mb-4">
            Detaillierte Analyse deiner Performance in verschiedenen Marktbedingungen:
          </p>
          <ul className="space-y-1 mb-4">
            <li>• Gewinnrate pro Marktphase</li>
            <li>• Durchschnittliches RR pro Marktphase</li>
            <li>• Verlustphasen und Ursachen</li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">Setup-Performance nach Marktphase</h3>
          <p className="mb-4">
            Analyse, welche Setups in welchen Marktphasen am besten funktionieren:
          </p>
          <ul className="space-y-1">
            <li>• Setups für Trend-Märkte</li>
            <li>• Setups für Range-Märkte</li>
            <li>• Setups für volatile Phasen</li>
            <li>• Empfehlungen für verschiedene Marktbedingungen</li>
          </ul>
        </div>
      </div>

      {/* Trading Coach */}
      <div id="coach" className="rocket-card rounded-xl p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">6. Trading Coach</h2>
        
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2">Persönliche Ziele</h3>
          <p className="mb-4">
            Setze und verfolge deine Trading-Ziele:
          </p>
          <ul className="space-y-1 mb-4">
            <li>• Tägliche, wöchentliche und monatliche Ziele</li>
            <li>• Fortschrittsanzeige</li>
            <li>• Zielerreichungshistorie</li>
            <li>• KI-generierte Zielvorschläge basierend auf deiner Performance</li>
          </ul>
          <div className="bg-muted p-4 rounded-lg mb-4">
            <p className="text-sm">
              <strong>Tipp:</strong> Fokussiere dich auf prozessorientierte Ziele (z.B. "Setup-Regeln einhalten") statt auf ergebnisorientierte Ziele (z.B. "X% Profit").
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">Coaching-Feedback</h3>
          <p className="mb-4">
            Erhalte personalisiertes Feedback zu deinem Trading:
          </p>
          <ul className="space-y-1">
            <li>• KI-generierte Trading-Tipps</li>
            <li>• Identifikation von Verbesserungspotential</li>
            <li>• Erfolgsstrategien und Verstärkung positiver Gewohnheiten</li>
            <li>• Warnungen bei problematischen Mustern</li>
          </ul>
        </div>
      </div>

      {/* Makroökonomischer Kalender */}
      <div id="macro-calendar" className="rocket-card rounded-xl p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">7. Makroökonomischer Kalender</h2>
        
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2">Wirtschaftsereignisse</h3>
          <p className="mb-4">
            Übersicht wichtiger wirtschaftlicher Ereignisse:
          </p>
          <ul className="space-y-1 mb-4">
            <li>• Zinsentscheidungen</li>
            <li>• Wirtschaftsindikatoren</li>
            <li>• Unternehmensberichte</li>
            <li>• Politische Ereignisse</li>
          </ul>
          <div className="bg-muted p-4 rounded-lg mb-4">
            <p className="text-sm">
              <strong>Filterfunktion:</strong> Filtere nach Land, Währung, Wichtigkeit oder Zeitraum.
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">Trade-Planung mit Makrodaten</h3>
          <p className="mb-4">
            Nutze den Kalender für deine Trading-Planung:
          </p>
          <ul className="space-y-1">
            <li>• Vorhersage von Marktvolatilität</li>
            <li>• Vermeidung von Trades während wichtiger Ankündigungen</li>
            <li>• Identifikation von Trading-Möglichkeiten nach Veröffentlichungen</li>
            <li>• Korrelation deiner historischen Performance mit Wirtschaftsereignissen</li>
          </ul>
        </div>
      </div>

      {/* Social Trading */}
      <div id="social" className="rocket-card rounded-xl p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">8. Social Trading</h2>
        
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2">Trading-Strategien</h3>
          <p className="mb-4">
            Teile und entdecke Trading-Strategien:
          </p>
          <ul className="space-y-1 mb-4">
            <li>• Veröffentliche deine erfolgreichen Setups</li>
            <li>• Entdecke Strategien anderer Trader</li>
            <li>• Bewerte und kommentiere Strategien</li>
            <li>• Sortierung nach Popularität oder Performance</li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">Community-Interaktion</h3>
          <p className="mb-4">
            Tausche dich mit anderen Tradern aus:
          </p>
          <ul className="space-y-1">
            <li>• Kommentiere und diskutiere Strategien</li>
            <li>• Stelle Fragen an erfahrene Trader</li>
            <li>• Teile Erfolge und Learnings</li>
            <li>• Folge Top-Performern</li>
          </ul>
        </div>
      </div>

      {/* Import & Export */}
      <div id="import-export" className="rocket-card rounded-xl p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">9. Import & Export</h2>
        
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2">Daten-Import</h3>
          <p className="mb-4">
            Importiere deine Trades aus verschiedenen Quellen:
          </p>
          <ul className="space-y-1 mb-4">
            <li>• CSV-Import (Universal-Format)</li>
            <li>• TradingView-Export</li>
            <li>• Tradovate-Integration</li>
            <li>• Manueller Trade-Import</li>
          </ul>
          <div className="bg-muted p-4 rounded-lg mb-4">
            <p className="text-sm">
              <strong>Tipp:</strong> Nutze die CSV-Vorlagen für verschiedene Plattformen, um den Import zu erleichtern.
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">Daten-Export</h3>
          <p className="mb-4">
            Exportiere deine Daten für externe Analyse:
          </p>
          <ul className="space-y-1">
            <li>• CSV-Export</li>
            <li>• PDF-Reports (wöchentlich, monatlich)</li>
            <li>• Performance-Zusammenfassungen</li>
            <li>• KI-Analysen und Empfehlungen</li>
          </ul>
        </div>
      </div>

      {/* Abschluss */}
      <div className="rocket-card rounded-xl p-6">
        <h2 className="text-2xl font-bold mb-4">Fazit</h2>
        <p className="mb-4">
          LvlUp Trading wurde entwickelt, um dir zu helfen, deine Trading-Performance kontinuierlich zu verbessern und von deinen eigenen Daten zu lernen. 
          Die Kombination aus detaillierter Analyse, KI-gestützter Erkennung von Mustern und Risikomanagement-Tools gibt dir alle Werkzeuge an die Hand, 
          die du brauchst, um ein besserer Trader zu werden.
        </p>
        <p className="mb-6">
          Wir empfehlen, mit dem regelmäßigen Import deiner Trades zu beginnen und dann die verschiedenen Analyse-Tools zu nutzen, 
          um Verbesserungspotential zu identifizieren. Setze dir realistische Ziele mit dem Trading Coach und verfolge deinen Fortschritt.
        </p>

        <div className="flex justify-center">
          <Button variant="default" className="flex items-center" size="lg">
            <FileUp className="mr-2 h-4 w-4" />
            Mit dem CSV-Import beginnen
          </Button>
        </div>
      </div>
    </div>
  );
}