import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  FileUp, Settings, Brain, BarChart2, Activity, Trophy, Calendar,
  Users, TrendingDown, DollarSign, AlertCircle, LogOut,
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
          <Link href="/" className="flex items-center gap-3 mb-4 md:mb-0 hover:opacity-80 transition-opacity whitespace-nowrap">
            <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-extrabold text-sm meme-logo shadow-lg">
              NXT<br />LVL
            </div>
            <div>
              <h1 className="text-xl font-bold moon-text">NXT LVL Trading</h1>
              <p className="text-xs text-muted-foreground">Trading-Performance optimieren</p>
            </div>
          </Link>
          
          {/* Hauptnavigation */}
          <nav className="flex flex-nowrap justify-center gap-3 mb-2 md:mb-0 whitespace-nowrap overflow-x-auto">
            {/* Dashboard Button - zum Dashboard navigieren */}
            <Button variant="ghost" size="sm" asChild>
              <a href="#" onClick={(e) => {
                e.preventDefault();
                // Setze den aktiven Tab auf "dashboard"
                const dashboardTab = document.querySelector('[value="dashboard"]') as HTMLElement;
                if (dashboardTab) dashboardTab.click();
              }}>
                <BarChart2 className="w-4 h-4 mr-2" />
                Dashboard
              </a>
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
                    <a href="#" onClick={(e) => {
                      e.preventDefault();
                      const dashboardTab = document.querySelector('[value="dashboard"]') as HTMLElement;
                      if (dashboardTab) dashboardTab.click();
                    }}>
                      <BarChart2 className="w-4 h-4 mr-2" />
                      <span>Dashboard</span>
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href="#" onClick={(e) => {
                      e.preventDefault();
                      const tradesTab = document.querySelector('[value="trades"]') as HTMLElement;
                      if (tradesTab) tradesTab.click();
                    }}>
                      <DollarSign className="w-4 h-4 mr-2" />
                      <span>Trades Liste</span>
                    </a>
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
          </nav>
          
          {/* User-Menü rechts */}
          <div className="flex items-center gap-2 whitespace-nowrap">
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