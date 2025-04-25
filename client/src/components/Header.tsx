import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  FileUp, Settings, Brain, BarChart2, Activity, Trophy, Calendar,
  Users, Download, TrendingDown, DollarSign, AlertCircle, BookOpen, LogOut,
  ChevronDown, ChevronRight, Menu
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal
} from "@/components/ui/dropdown-menu";

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
          
          {/* Logo und Titel - Verlinkt zur Hauptseite */}
          <Link href="/" className="flex items-center gap-3 mb-4 md:mb-0 hover:opacity-80 transition-opacity">
            <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-extrabold text-sm meme-logo shadow-lg">
              LVL<br />UP
            </div>
            <div>
              <h1 className="text-xl font-bold moon-text">LvlUp Trading</h1>
              <p className="text-xs text-muted-foreground">Trading-Performance optimieren</p>
            </div>
          </Link>
          
          {/* Hauptnavigation */}
          <nav className="flex flex-wrap justify-center gap-3 mb-2 md:mb-0">
            {/* Dashboard Button - Immer zuerst */}
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <BarChart2 className="w-4 h-4 mr-2" />
                Dashboard
              </Link>
            </Button>
            
            {/* Trading Dropdown - Kern der Anwendung */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center">
                  <BarChart2 className="w-4 h-4 mr-2" />
                  Trading
                  <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-56 bg-black/90 backdrop-blur-md border-primary/20">
                <DropdownMenuLabel className="text-primary">Trading Funktionen</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  {/* Chronologisch nach Workflow geordnet */}
                  <DropdownMenuItem asChild>
                    <Link href="/#trades">
                      <BarChart2 className="w-4 h-4 mr-2" />
                      <span>Trades Übersicht</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/#import">
                      <FileUp className="w-4 h-4 mr-2" />
                      <span>CSV Import</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/#risk-management">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      <span>Risikomanagement</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/#market-phase">
                      <Activity className="w-4 h-4 mr-2" />
                      <span>Marktphasen</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Analyse Dropdown - Erweiterte Features */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center">
                  <Brain className="w-4 h-4 mr-2" />
                  Analyse
                  <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-56 bg-black/90 backdrop-blur-md border-primary/20">
                <DropdownMenuLabel className="text-primary">Analyse Werkzeuge</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  {/* Nach Komplexität sortiert */}
                  <DropdownMenuItem asChild>
                    <Link href="/#ai-analysis">
                      <Brain className="w-4 h-4 mr-2" />
                      <span>KI-Analyse</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/coach">
                      <Trophy className="w-4 h-4 mr-2" />
                      <span>Trading Coach</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/calendar">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>Makro-Kalender</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Community - Social Trading */}
            <Button variant="ghost" size="sm" asChild>
              <Link href="/social">
                <Users className="w-4 h-4 mr-2" />
                Community
              </Link>
            </Button>
            
            {/* Hilfe & Dokumentation */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Hilfe
                  <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-black/90 backdrop-blur-md border-primary/20">
                <DropdownMenuLabel className="text-primary">Handbuch & Hilfe</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <Link href="/booklet">
                      <BookOpen className="w-4 h-4 mr-2" />
                      <span>Online Handbuch</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.open('/lvlup-trading-handbuch-style.html', '_blank')}>
                    <Download className="w-4 h-4 mr-2" />
                    <span>Handbuch PDF</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
          
          {/* User-Menü rechts */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <span className="text-sm text-muted-foreground mr-1">
                  {user.username}
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex items-center">
                      <Settings className="w-4 h-4" />
                      <ChevronDown className="w-3 h-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40 bg-black/90 backdrop-blur-md border-primary/20">
                    <DropdownMenuLabel className="text-primary">Benutzer</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Settings className="w-4 h-4 mr-2" />
                      <span>Einstellungen</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="w-4 h-4 mr-2" />
                      <span>Abmelden</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/auth">Anmelden</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}