import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  FileUp, Settings, Brain, BarChart2, Activity, Trophy, Calendar,
  Users, Download, TrendingDown, DollarSign, AlertCircle, BookOpen, LogOut
} from "lucide-react";

export default function Header() {
  const { user, logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="w-full main-header mb-6">
      <div className="container mx-auto px-4 py-4">
        {/* Hauptzeile mit Logo, Hauptmenü und Nutzerinfo */}
        <div className="flex flex-col md:flex-row justify-between items-center">
          
          {/* Logo und Titel */}
          <div className="flex items-center gap-3 mb-4 md:mb-0">
            <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-extrabold text-sm meme-logo shadow-lg">
              LVL<br />UP
            </div>
            <div>
              <h1 className="text-xl font-bold moon-text">LvlUp Trading</h1>
              <p className="text-xs text-muted-foreground">Trading-Performance optimieren</p>
            </div>
          </div>
          
          {/* Hauptnavigation */}
          <nav className="flex flex-wrap justify-center gap-2 mb-2 md:mb-0">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <BarChart2 className="w-4 h-4 mr-2" />
                Dashboard
              </Link>
            </Button>
            
            <Button variant="ghost" size="sm" asChild>
              <Link href="/coach">
                <Trophy className="w-4 h-4 mr-2" />
                Coach
              </Link>
            </Button>
            
            <Button variant="ghost" size="sm" asChild>
              <Link href="/calendar">
                <Calendar className="w-4 h-4 mr-2" />
                Makro-Kalender
              </Link>
            </Button>
            
            <Button variant="ghost" size="sm" asChild>
              <Link href="/social">
                <Users className="w-4 h-4 mr-2" />
                Social Trading
              </Link>
            </Button>
            
            <Button variant="ghost" size="sm" asChild>
              <Link href="/booklet">
                <BookOpen className="w-4 h-4 mr-2" />
                Handbuch
              </Link>
            </Button>
          </nav>
          
          {/* User-Menü rechts */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <span className="text-sm text-muted-foreground mr-2">
                  {user.username}
                </span>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-1" />
                  Abmelden
                </Button>
              </>
            ) : (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/auth">Anmelden</Link>
              </Button>
            )}
          </div>
        </div>
        
        {/* Zweite Navigationszeile für Untermenüs */}
        <div className="submenu-items mt-3 text-muted-foreground">
          <Button variant="link" size="sm" className="submenu-item" asChild>
            <Link href="/">
              <BarChart2 className="w-3 h-3 mr-1" />
              Dashboard
            </Link>
          </Button>
          
          <Button variant="link" size="sm" className="submenu-item" asChild>
            <Link href="/#trades">
              <BarChart2 className="w-3 h-3 mr-1" />
              Trades Übersicht
            </Link>
          </Button>
          
          <Button variant="link" size="sm" className="submenu-item" asChild>
            <Link href="/#import">
              <FileUp className="w-3 h-3 mr-1" />
              CSV Import
            </Link>
          </Button>
          
          <Button variant="link" size="sm" className="submenu-item" asChild>
            <Link href="/#ai-analysis">
              <Brain className="w-3 h-3 mr-1" />
              KI-Analyse
            </Link>
          </Button>
          
          <Button variant="link" size="sm" className="submenu-item" asChild>
            <Link href="/#risk-management">
              <AlertCircle className="w-3 h-3 mr-1" />
              Risikomanagement
            </Link>
          </Button>
          
          <Button variant="link" size="sm" className="submenu-item" asChild>
            <Link href="/#market-phase">
              <Activity className="w-3 h-3 mr-1" />
              Marktphasen
            </Link>
          </Button>
          
          <Button variant="link" size="sm" className="submenu-item" asChild>
            <Link href="/coach">
              <Trophy className="w-3 h-3 mr-1" />
              Coach
            </Link>
          </Button>
          
          <Button variant="link" size="sm" className="submenu-item" asChild>
            <Link href="/calendar">
              <Calendar className="w-3 h-3 mr-1" />
              Makro-Kalender
            </Link>
          </Button>
          
          <Button variant="link" size="sm" className="submenu-item" asChild>
            <Link href="/social">
              <Users className="w-3 h-3 mr-1" />
              Social Trading
            </Link>
          </Button>
          
          <Button variant="link" size="sm" className="submenu-item" asChild>
            <Link href="/booklet">
              <BookOpen className="w-3 h-3 mr-1" />
              Handbuch
            </Link>
          </Button>
          
          <Button variant="link" size="sm" className="submenu-item" asChild>
            <Link href="/lvlup-trading-handbuch-style.html" target="_blank">
              <Download className="w-3 h-3 mr-1" />
              Handbuch PDF
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}