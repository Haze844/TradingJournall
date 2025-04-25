
import { Button } from "@/components/ui/button";
import {
  FileUp, Brain, BarChart2, Activity, Trophy, Calendar, 
  Users, TrendingDown, FileText, Download, ExternalLink
} from "lucide-react";

// Beispielbilder für das Handbuch
const PLACEHOLDER_IMAGES = {
  dashboard: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDUwMCAzMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj48cGF0aCBmaWxsPSIjMjAyMzM3IiBkPSJNMCAwaDUwMHYzMDBIMHoiLz48ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSg1MCw1MCkiIHN0cm9rZT0iIzQ4NTRhZiIgc3Ryb2tlLXdpZHRoPSIyIj48cGF0aCBkPSJNMCAxNTBMMTAwIDgwIDIwMCAxMjAgMzAwIDMwIDQwMCAyMCIvPjxwYXRoIGQ9Ik0wIDIwMEwxMDAgMTYwIDIwMCAxMTAgMzAwIDExMCA0MDAgNjAiLz48L2c+PHRleHQgZmlsbD0iI2ZmZiIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjI0IiBmb250LXdlaWdodD0iYm9sZCIgeD0iMTgwIiB5PSIzMCI+RGFzaGJvYXJkPC90ZXh0PjwvZz48L3N2Zz4=',
  trades: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDUwMCAzMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj48cGF0aCBmaWxsPSIjMjAyMzM3IiBkPSJNMCAwaDUwMHYzMDBIMHoiLz48cmVjdCBzdHJva2U9IiM0ODU0YWYiIHN0cm9rZS13aWR0aD0iMiIgeD0iNTAiIHk9IjUwIiB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgcng9IjQiLz48ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSg1MCw1MCkiPjxsaW5lIHgxPSIwIiB5MT0iNDAiIHgyPSI0MDAiIHkyPSI0MCIgc3Ryb2tlPSIjNDg1NGFmIiBzdHJva2Utd2lkdGg9IjEiLz48L2c+PGcgZmlsbD0iI2ZmZiIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0Ij48dGV4dCB4PSI2MCIgeT0iNzUiPkRhdHVtPC90ZXh0Pjx0ZXh0IHg9IjEyMCIgeT0iNzUiPlN5bWJvbDwvdGV4dD48dGV4dCB4PSIyMDAiIHk9Ijc1Ij5TZXRVcDwvdGV4dD48dGV4dCB4PSIyODAiIHk9Ijc1Ij5FbnRyeTwvdGV4dD48dGV4dCB4PSIzNDAiIHk9Ijc1Ij5SL1I8L3RleHQ+PHRleHQgeD0iNDAwIiB5PSI3NSI+UC9MPC90ZXh0PjwvZz48dGV4dCBmaWxsPSIjZmZmIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZvbnQtd2VpZ2h0PSJib2xkIiB4PSIxNzUiIHk9IjMwIj5UcmFkZSBUYWJsZTwvdGV4dD48L2c+PC9zdmc+',
  aiAnalysis: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDUwMCAzMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj48cGF0aCBmaWxsPSIjMjAyMzM3IiBkPSJNMCAwaDUwMHYzMDBIMHoiLz48cGF0aCBkPSJNMTUwIDEyMGMwLTMzLjEzIDI2Ljg3LTYwIDYwLTYwIDMzLjE0IDAgNjAgMjYuODcgNjAgNjAgMCAzMy4xNC0yNi44NiA2MC02MCA2MC0zMy4xMyAwLTYwLTI2Ljg2LTYwLTYweiIgc3Ryb2tlPSIjNDg1NGFmIiBzdHJva2Utd2lkdGg9IjMiLz48cGF0aCBkPSJNMTkwIDEyMGgyMG0tMTAgLTEwdjIwbTIwIC0xMGgxMG0xMCAwaDEwbS00MCAtMjB2MTBtMCAyMHYxMCIgc3Ryb2tlPSIjNDg1NGFmIiBzdHJva2Utd2lkdGg9IjIiLz48dGV4dCBmaWxsPSIjZmZmIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZvbnQtd2VpZ2h0PSJib2xkIiB4PSIxNTAiIHk9IjMwIj5LSS1BbmFseXNlPC90ZXh0PjwvZz48L3N2Zz4=',
  risk: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDUwMCAzMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj48cGF0aCBmaWxsPSIjMjAyMzM3IiBkPSJNMCAwaDUwMHYzMDBIMHoiLz48ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSg3MCw1MCkiPjxyZWN0IGZpbGw9IiM0ODU0YWYiIHg9IjAiIHk9IjEyMCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjgwIiByeD0iMiIvPjxyZWN0IGZpbGw9IiM0ODU0YWYiIHg9IjkwIiB5PSI4MCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjEyMCIgcng9IjIiLz48cmVjdCBmaWxsPSIjZWU0NDQ0IiB4PSIxODAiIHk9IjQwIiB3aWR0aD0iNjAiIGhlaWdodD0iMTYwIiByeD0iMiIvPjxyZWN0IGZpbGw9IiM0ODU0YWYiIHg9IjI3MCIgeT0iMTAwIiB3aWR0aD0iNjAiIGhlaWdodD0iMTAwIiByeD0iMiIvPjwvZz48dGV4dCBmaWxsPSIjZmZmIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZvbnQtd2VpZ2h0PSJib2xkIiB4PSIxNDAiIHk9IjMwIj5SaXNpa29hbmFseXNlPC90ZXh0PjwvZz48L3N2Zz4=',
  phases: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDUwMCAzMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj48cGF0aCBmaWxsPSIjMjAyMzM3IiBkPSJNMCAwaDUwMHYzMDBIMHoiLz48ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgxMDAsMTAwKSI+PHBhdGggZD0iTTE1MCA3NWMwIDQxLjQyLTMzLjU4IDc1LTc1IDc1UzAgMTE2LjQyIDAgNzUgMzMuNTggMCA3NSAwczc1IDMzLjU4IDc1IDc1eiIgc3Ryb2tlPSIjNDg1NGFmIiBzdHJva2Utd2lkdGg9IjIiLz48cGF0aCBkPSJNNzUgMHY3NU0wIDc1aDE1MCIgc3Ryb2tlPSIjNDg1NGFmIiBzdHJva2Utd2lkdGg9IjEiLz48cGF0aCBkPSJNNzUgMGw1MCA4MG0tNTAtODBsLTMwIDYwIiBzdHJva2U9IiM0ODU0YWYiIHN0cm9rZS13aWR0aD0iMiIvPjxwYXRoIGQ9Ik0zNSAxMjVsNDAtNTBtMTUgNTBsMzUtLTUwIiBzdHJva2U9IiM0ODU0YWYiIHN0cm9rZS13aWR0aD0iMiIvPjwvZz48dGV4dCBmaWxsPSIjZmZmIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZvbnQtd2VpZ2h0PSJib2xkIiB4PSIxMTAiIHk9IjMwIj5NYXJrdHBoYXNlbiBBbmFseXNlPC90ZXh0PjwvZz48L3N2Zz4=',
  coach: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDUwMCAzMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj48cGF0aCBmaWxsPSIjMjAyMzM3IiBkPSJNMCAwaDUwMHYzMDBIMHoiLz48cGF0aCBkPSJNMTYwIDkwYzAtMjIuMDkgMTcuOTEtNDAgNDAtNDAgMjIuMDkgMCA0MCAxNy45MSA0MCA0MCAwIDIyLjA5LTE3LjkxIDQwLTQwIDQwLTIyLjA5IDAtNDAtMTcuOTEtNDAtNDAiIHN0cm9rZT0iIzQ4NTRhZiIgc3Ryb2tlLXdpZHRoPSIzIi8+PHBhdGggZD0iTTE3MCAxNzB2LTQwaDYwYzAgMCAwIDQwIDAgNDBoNTB2MjBoLTE2MHYtMjBoNTB6IiBzdHJva2U9IiM0ODU0YWYiIHN0cm9rZS13aWR0aD0iMyIvPjx0ZXh0IGZpbGw9IiNmZmYiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZm9udC13ZWlnaHQ9ImJvbGQiIHg9IjEzNSIgeT0iMzAiPlRyYWRpbmcgQ29hY2g8L3RleHQ+PC9nPjwvc3ZnPg==',
  calendar: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDUwMCAzMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj48cGF0aCBmaWxsPSIjMjAyMzM3IiBkPSJNMCAwaDUwMHYzMDBIMHoiLz48cmVjdCBzdHJva2U9IiM0ODU0YWYiIHN0cm9rZS13aWR0aD0iMiIgeD0iMTAwIiB5PSI2MCIgd2lkdGg9IjMwMCIgaGVpZ2h0PSIxODAiIHJ4PSI0Ii8+PHBhdGggZD0iTTEwMCA5MGgzMDAiIHN0cm9rZT0iIzQ4NTRhZiIgc3Ryb2tlLXdpZHRoPSIyIi8+PHBhdGggZD0iTTE0MCA2MHYzMG0yMjAgMHYtMzAiIHN0cm9rZT0iIzQ4NTRhZiIgc3Ryb2tlLXdpZHRoPSIyIi8+PHRleHQgZmlsbD0iI2ZmZiIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE4IiB4PSIxMjAiIHk9IjEyMCI+MjUuMDQuMjAyNSAtIFpuc2VudHNjaGVpZHVuZzwvdGV4dD48dGV4dCBmaWxsPSIjZmZmIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIHg9IjEyMCIgeT0iMTUwIj4yOC4wNC4yMDI1IC0gQklQIERhdGVuPC90ZXh0Pjx0ZXh0IGZpbGw9IiNmZmYiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgeD0iMTIwIiB5PSIxODAiPjMwLjA0LjIwMjUgLSBBcmJlaXRzbWFya3Q8L3RleHQ+PHRleHQgZmlsbD0iI2ZmZiIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjI0IiBmb250LXdlaWdodD0iYm9sZCIgeD0iMTAwIiB5PSIzMCI+TWFrcm8tS2FsZW5kZXI8L3RleHQ+PC9nPjwvc3ZnPg==',
  social: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDUwMCAzMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj48cGF0aCBmaWxsPSIjMjAyMzM3IiBkPSJNMCAwaDUwMHYzMDBIMHoiLz48ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgxMDAsMTAwKSI+PGNpcmNsZSBzdHJva2U9IiM0ODU0YWYiIHN0cm9rZS13aWR0aD0iMiIgY3g9IjMwIiBjeT0iMzAiIHI9IjIwIi8+PGNpcmNsZSBzdHJva2U9IiM0ODU0YWYiIHN0cm9rZS13aWR0aD0iMiIgY3g9IjE1MCIgY3k9IjMwIiByPSIyMCIvPjxjaXJjbGUgc3Ryb2tlPSIjNDg1NGFmIiBzdHJva2Utd2lkdGg9IjIiIGN4PSIzMCIgY3k9IjEyMCIgcj0iMjAiLz48Y2lyY2xlIHN0cm9rZT0iIzQ4NTRhZiIgc3Ryb2tlLXdpZHRoPSIyIiBjeD0iMTUwIiBjeT0iMTIwIiByPSIyMCIvPjxjaXJjbGUgc3Ryb2tlPSIjNDg1NGFmIiBzdHJva2Utd2lkdGg9IjIiIGN4PSI5MCIgY3k9IjcwIiByPSIyMCIvPjxwYXRoIGQ9Ik0zMCA1MGwzMCAxMG0zMCAxMGw2MC0yMG0tMTIwIDcwbDMwLTMwbTMwLTEwbDYwIDMwIiBzdHJva2U9IiM0ODU0YWYiIHN0cm9rZS13aWR0aD0iMiIvPjwvZz48dGV4dCBmaWxsPSIjZmZmIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZvbnQtd2VpZ2h0PSJib2xkIiB4PSIxMzAiIHk9IjMwIj5Tb2NpYWwgVHJhZGluZzwvdGV4dD48L2c+PC9zdmc+',
  import: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDUwMCAzMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj48cGF0aCBmaWxsPSIjMjAyMzM3IiBkPSJNMCAwaDUwMHYzMDBIMHoiLz48cGF0aCBkPSJNMjAwIDgwdjE0MGgxMDBWODBIMjAweiIgc3Ryb2tlPSIjNDg1NGFmIiBzdHJva2Utd2lkdGg9IjMiLz48cGF0aCBkPSJNMjIwIDExMGgzMG0tMzAgMzBoNjBtLTYwIDMwaDYwbS02MCAzMGg2MCIgc3Ryb2tlPSIjNDg1NGFmIiBzdHJva2Utd2lkdGg9IjIiLz48cGF0aCBkPSJNMTUwIDEzMGgzMG0tMzAgMzBoMzBtOTAgLTMwaDMwbS0zMCAzMGgzMG0tMTUwIDMwdjIwIiBzdHJva2U9IiM0ODU0YWYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWRhc2hhcnJheT0iNSw1Ii8+PHRleHQgZmlsbD0iI2ZmZiIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjI0IiBmb250LXdlaWdodD0iYm9sZCIgeD0iMTUwIiB5PSIzMCI+Q1NWIEltcG9ydDwvdGV4dD48L2c+PC9zdmc+'
};



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
            <p className="text-gray-400">Kompaktes Benutzerhandbuch</p>
          </div>
        </div>
        
        <p className="text-lg mb-6">
          Willkommen zum kompakten LvlUp Trading Benutzerhandbuch. Hier findest du eine Übersicht aller Funktionen und Möglichkeiten der Anwendung.
        </p>

        <div className="flex justify-end mb-6 gap-2">
          <a 
            href="/generate-pdf"
            className="flex items-center gap-2 pulse-btn bg-gradient-to-r from-primary to-primary/80 text-white py-2 px-4 rounded-md"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Download className="h-5 w-5" /> PDF herunterladen
          </a>
          <Button 
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => window.print()}
          >
            <Printer className="h-5 w-5" /> Drucken
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button variant="outline" className="justify-start bg-opacity-20 hover:bg-opacity-30">
            <FileUp className="mr-2 h-4 w-4" /> Import Optionen
          </Button>
          <Button variant="outline" className="justify-start bg-opacity-20 hover:bg-opacity-30">
            <Brain className="mr-2 h-4 w-4" /> KI-Analysen
          </Button>
          <Button variant="outline" className="justify-start bg-opacity-20 hover:bg-opacity-30">
            <BarChart2 className="mr-2 h-4 w-4" /> Risikomanagement
          </Button>
          <Button variant="outline" className="justify-start bg-opacity-20 hover:bg-opacity-30">
            <Activity className="mr-2 h-4 w-4" /> Marktphasen-Analyse
          </Button>
          <Button variant="outline" className="justify-start bg-opacity-20 hover:bg-opacity-30">
            <Trophy className="mr-2 h-4 w-4" /> Trading Coach
          </Button>
          <Button variant="outline" className="justify-start bg-opacity-20 hover:bg-opacity-30">
            <Calendar className="mr-2 h-4 w-4" /> Makro-Kalender
          </Button>
        </div>
      </div>

      {/* Dashboard & Navigation mit Screenshot */}
      <div id="dashboard" className="rocket-card rounded-xl p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">1. Dashboard & Navigation</h2>
        <div className="mb-6">
          <img src={PLACEHOLDER_IMAGES.dashboard} alt="Dashboard Screenshot" className="rounded-lg w-full max-w-2xl mx-auto mb-4" />
          <p className="mb-4">
            Das Dashboard ist deine zentrale Anlaufstelle. Von hier aus hast du Zugriff auf alle Funktionen der Anwendung:
          </p>
          <ul className="space-y-2 mb-4 list-disc pl-5">
            <li><strong>Dashboard:</strong> Übersicht über deine Trade-Aktivitäten</li>
            <li><strong>KI-Analyse:</strong> Automatische Erkennung von Handelsmustern</li>
            <li><strong>Risikomanagement:</strong> Analyse deiner Risikometriken</li>
            <li><strong>Marktphasen:</strong> Analyse deiner Performance in verschiedenen Marktphasen</li>
          </ul>
        </div>
      </div>

      {/* Trade-Management mit Screenshot */}
      <div id="trade-management" className="rocket-card rounded-xl p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">2. Trade-Management</h2>
        <div className="mb-6">
          <img src={PLACEHOLDER_IMAGES.trades} alt="Trades Screenshot" className="rounded-lg w-full max-w-2xl mx-auto mb-4" />
          <p className="mb-4">
            Die Trade-Tabelle zeigt alle deine erfassten Trades mit wichtigen Informationen:
          </p>
          <ul className="space-y-1 mb-4 list-disc pl-5">
            <li>Datum und Symbol</li>
            <li>Setup und Trendanalyse</li>
            <li>Entry-Typ und Level</li>
            <li>Risk-Reward-Verhältnis</li>
          </ul>
        </div>
      </div>

      {/* KI-Analyse mit Screenshot */}
      <div id="ai-analysis" className="rocket-card rounded-xl p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">3. KI-Analyse</h2>
        <div className="mb-6">
          <img src={PLACEHOLDER_IMAGES.aiAnalysis} alt="KI-Analyse Screenshot" className="rounded-lg w-full max-w-2xl mx-auto mb-4" />
          <p className="mb-4">
            Die KI analysiert deine Trade-Historie und identifiziert wiederkehrende Muster:
          </p>
          <ul className="space-y-1 mb-4 list-disc pl-5">
            <li>Erkennung deiner erfolgreichsten Setups</li>
            <li>Identifikation von Schwachstellen und Problemen</li>
            <li>Analyse von emotionalen Mustern (Overtrading, Revenge Trading)</li>
            <li>Vorschläge zur Optimierung</li>
          </ul>
        </div>
      </div>

      {/* Risikomanagement mit Screenshot */}
      <div id="risk-management" className="rocket-card rounded-xl p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">4. Risikomanagement</h2>
        <div className="mb-6">
          <img src={PLACEHOLDER_IMAGES.risk} alt="Risikomanagement Screenshot" className="rounded-lg w-full max-w-2xl mx-auto mb-4" />
          <p className="mb-4">
            Überwache dein Risiko und optimiere deine Handelsstrategien:
          </p>
          <ul className="space-y-1 mb-4 list-disc pl-5">
            <li><strong>Drawdown-Analyse:</strong> Verfolge historische Drawdowns und Erholungszeiten</li>
            <li><strong>Risiko pro Trade:</strong> Analyse und Optimierung deines Risikos</li>
            <li><strong>Positionsgrößen-Kalkulator:</strong> Berechne optimale Positionsgrößen</li>
          </ul>
        </div>
      </div>

      {/* Marktphasen-Analyse mit Screenshot */}
      <div id="market-phases" className="rocket-card rounded-xl p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">5. Marktphasen-Analyse</h2>
        <div className="mb-6">
          <img src={PLACEHOLDER_IMAGES.phases} alt="Marktphasen Screenshot" className="rounded-lg w-full max-w-2xl mx-auto mb-4" />
          <p className="mb-4">
            Analysiere deine Performance in verschiedenen Marktbedingungen:
          </p>
          <ul className="space-y-1 mb-4 list-disc pl-5">
            <li><strong>Marktphasen-Verteilung:</strong> Anteil von Trend-, Range- und volatilen Phasen</li>
            <li><strong>Performance-Analyse:</strong> Gewinnrate und RR pro Marktphase</li>
            <li><strong>Setup-Performance:</strong> Welche Setups funktionieren in welchen Phasen am besten</li>
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Trading Coach */}
        <div id="coach" className="rocket-card rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4">6. Trading Coach</h2>
          <img src={PLACEHOLDER_IMAGES.coach} alt="Coach Screenshot" className="rounded-lg w-full mb-4 h-40 object-cover" />
          <p className="mb-4">
            Personalisierte Verbesserungsvorschläge und Zielsetzungen für dein Trading.
          </p>
        </div>

        {/* Makroökonomischer Kalender */}
        <div id="macro-calendar" className="rocket-card rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4">7. Makro-Kalender</h2>
          <img src={PLACEHOLDER_IMAGES.calendar} alt="Kalender Screenshot" className="rounded-lg w-full mb-4 h-40 object-cover" />
          <p className="mb-4">
            Behalte wichtige Wirtschaftsereignisse im Blick und plane deine Trades entsprechend.
          </p>
        </div>

        {/* Import & Export */}
        <div id="import-export" className="rocket-card rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4">8. Import & Export</h2>
          <img src={PLACEHOLDER_IMAGES.import} alt="Import Screenshot" className="rounded-lg w-full mb-4 h-40 object-cover" />
          <p className="mb-4">
            Importiere Trades aus verschiedenen Quellen und exportiere deine Daten für weitere Analysen.
          </p>
        </div>
      </div>

      {/* Abschluss */}
      <div className="rocket-card rounded-xl p-6 text-center">
        <h2 className="text-2xl font-bold mb-4">Fazit</h2>
        <p className="mb-4">
          LvlUp Trading hilft dir, deine Trading-Performance kontinuierlich zu verbessern und von deinen eigenen Daten zu lernen.
        </p>

        <div className="flex justify-center">
          <a 
            href="/generate-pdf"
            className="flex items-center gap-2 pulse-btn bg-gradient-to-r from-primary to-primary/80 text-white py-2 px-4 rounded-md"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Download className="h-5 w-5" /> PDF herunterladen
          </a>
        </div>
      </div>
    </div>
  );
}