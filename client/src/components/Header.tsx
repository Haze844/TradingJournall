import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  FileUp, Settings, Brain, BarChart2, Activity, Trophy, Calendar,
  Users, TrendingDown, DollarSign, AlertCircle, LogOut, LineChart, User,
  ChevronDown, ChevronRight, Menu, Flame
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

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Logo-Komponente für einheitliches Design
export const NxtLvlLogo = ({ className = "" }) => (
  <div className={`flex items-center justify-start space-x-3 ${className}`}>
    <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-3 rounded-xl shadow-lg 
                  border border-blue-400/20 group-hover:shadow-blue-500/20 group-hover:border-blue-400/30 
                  transition-all duration-300 transform group-hover:scale-105">
      <LineChart className="h-6 w-6 text-white group-hover:text-blue-100 transition-colors" />
    </div>
    <div className="text-2xl font-black tracking-tighter leading-none relative">
      <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-blue-200 
                    group-hover:from-white group-hover:to-blue-300 transition-all duration-300">
        NXT<span className="text-blue-300 group-hover:text-blue-200">LVL</span>
      </span>
      
      {/* "Trading" als Highlight-Element */}
      <div className="relative mt-0.5">
        <span className="text-2xl font-bold tracking-tight bg-clip-text text-transparent 
                       bg-gradient-to-r from-blue-300 to-blue-100 
                       group-hover:from-blue-200 group-hover:to-white transition-all duration-300">
          TRADING
        </span>
        <div className="h-0.5 w-full bg-gradient-to-r from-blue-400 to-blue-300/0 rounded-full 
                      absolute bottom-0 transform scale-x-0 group-hover:scale-x-100 origin-left 
                      transition-transform ease-out duration-500"></div>
      </div>
    </div>
  </div>
);

type HeaderProps = {
  activeTab?: string;
  onTabChange?: (value: string) => void;
}

export default function Header({ activeTab = "dashboard", onTabChange }: HeaderProps) {
  const { user, logoutMutation } = useAuth();
  const [location, navigate] = useLocation();

  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  const handleTabChange = (value: string) => {
    if (onTabChange) {
      onTabChange(value);
    }
  };

  return (
    <header className="w-full main-header mb-6 backdrop-blur-xl">
      {/* Kreatives Header-Design mit übergreifendem Logo und weicheren Übergängen */}
      <div className="bg-gradient-to-r from-blue-950 via-blue-800 to-blue-900 shadow-xl relative overflow-hidden 
                      border-b border-blue-400/20 rounded-b-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-400/10 via-transparent to-transparent"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-purple-600/10 via-transparent to-transparent"></div>
        
        {/* Animiertes Hintergrund-Element */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto py-3 pt-5 relative z-10">
          {/* Top-Bereich mit Logo und Benutzerbereich */}
          <div className="flex flex-col items-center mb-4">
            {/* Kreatives, modernes Logo - zentriert */}
            <div className="flex justify-center w-full mb-2">
              <Link href="/" className="group">
                <NxtLvlLogo />
              </Link>
            </div>
            
            {/* Desktop Konto-Bereich - absolut positioniert, rechte Seite */}
            <div className="hidden md:flex items-center gap-3 whitespace-nowrap z-20 absolute top-4 right-4">
              {user ? (
                <div className="flex items-center bg-gradient-to-r from-blue-800/40 via-blue-700/40 to-blue-800/30 
                               rounded-full overflow-hidden border border-blue-400/20 shadow-lg backdrop-blur-md">
                  <div className="flex items-center px-4 py-2 relative">
                    <div className="absolute inset-0 bg-blue-400/5 rounded-full blur"></div>
                    <User className="w-4 h-4 mr-2 text-blue-200" />
                    <span className="font-medium text-blue-100 relative z-10">
                      {user.username}
                    </span>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-full rounded-none border-l border-blue-400/20 
                                                                    bg-blue-700/30 hover:bg-blue-600/40 transition-colors px-3">
                        <Settings className="w-4 h-4 text-blue-200" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 bg-blue-900/90 backdrop-blur-xl border-blue-400/30 shadow-xl">
                      <DropdownMenuLabel className="text-blue-200">Kontoeinstellungen</DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-blue-500/20" />
                      <DropdownMenuItem className="hover:bg-blue-800/60 text-blue-100">
                        <Settings className="w-4 h-4 mr-2 text-blue-300" />
                        <span>Einstellungen</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-blue-500/20" />
                      <DropdownMenuItem onClick={handleLogout} className="hover:bg-red-900/30 text-red-200">
                        <LogOut className="w-4 h-4 mr-2" />
                        <span>Abmelden</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <Button variant="ghost" size="sm" asChild 
                       className="bg-blue-600/30 hover:bg-blue-500/40 text-blue-100 border border-blue-400/20 px-4">
                  <Link href="/auth">Anmelden</Link>
                </Button>
              )}
            </div>
            
            {/* Mobile Kontobereich - absolut positioniert, rechte Seite */}
            <div className="md:hidden flex items-center gap-3 whitespace-nowrap z-20 absolute top-4 right-4">
              {user ? (
                <div className="flex items-center bg-gradient-to-r from-blue-800/40 via-blue-700/40 to-blue-800/30 
                                rounded-full overflow-hidden border border-blue-400/20 shadow-lg backdrop-blur-md">
                  <div className="flex items-center px-3 py-1.5 relative">
                    <div className="absolute inset-0 bg-blue-400/5 rounded-full blur"></div>
                    <User className="w-4 h-4 mr-2 text-blue-200" />
                    <span className="font-medium text-blue-100 relative z-10 text-sm">
                      {user.username}
                    </span>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-full rounded-none border-l border-blue-400/20 
                                                                      bg-blue-700/30 hover:bg-blue-600/40 transition-colors px-2">
                        <Settings className="w-3.5 h-3.5 text-blue-200" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 bg-blue-900/90 backdrop-blur-xl border-blue-400/30 shadow-xl">
                      <DropdownMenuLabel className="text-blue-200">Kontoeinstellungen</DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-blue-500/20" />
                      <DropdownMenuItem className="hover:bg-blue-800/60 text-blue-100">
                        <Settings className="w-4 h-4 mr-2 text-blue-300" />
                        <span>Einstellungen</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-blue-500/20" />
                      <DropdownMenuItem onClick={handleLogout} className="hover:bg-red-900/30 text-red-200">
                        <LogOut className="w-4 h-4 mr-2" />
                        <span>Abmelden</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <Button variant="ghost" size="sm" asChild 
                        className="bg-blue-600/30 hover:bg-blue-500/40 text-blue-100 border border-blue-400/20 px-3 py-1">
                  <Link href="/auth">Anmelden</Link>
                </Button>
              )}
            </div>
          </div>
          
          {/* Navigations-Tabs am unteren Rand des Headers */}
          <div className="flex justify-center items-center pb-1">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="flex justify-center w-full">
              <TabsList className="main-tabs-list bg-black/60 p-1.5 rounded-xl shadow-lg border border-primary/10 
                                overflow-hidden backdrop-blur-sm mx-auto">
                <TabsTrigger value="dashboard" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-md px-4 py-1.5 transition-all duration-200 rounded-lg">
                  <BarChart2 className="w-4 h-4 mr-1.5" /> Dashboard
                </TabsTrigger>
                <TabsTrigger value="trades" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-md px-4 py-1.5 transition-all duration-200 rounded-lg">
                  <DollarSign className="w-4 h-4 mr-1.5" /> Trades
                </TabsTrigger>
                <TabsTrigger value="ai-analysis" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-md px-4 py-1.5 transition-all duration-200 rounded-lg">
                  <Activity className="w-4 h-4 mr-1.5" /> Analyse
                </TabsTrigger>
                <TabsTrigger value="risk" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-md px-4 py-1.5 transition-all duration-200 rounded-lg">
                  <AlertCircle className="w-4 h-4 mr-1.5" /> Risiko
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>
    </header>
  );
}