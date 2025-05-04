import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  FileUp, Settings, Brain, BarChart2, Activity, Trophy, Calendar,
  Users, TrendingDown, DollarSign, AlertCircle, LogOut, LineChart, User,
  ChevronDown, ChevronRight, Menu, Flame, Lock
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
import { useState } from "react";
import PasswordChangeDialog from "./PasswordChangeDialog";

// Logo-Komponente für einheitliches Design
export const NxtLvlLogo = ({ className = "" }) => {
  const [_, navigate] = useLocation();
  
  const handleLogoClick = () => {
    navigate("/");
  };
  
  return (
    <div className={`flex items-center justify-start space-x-4 ${className} cursor-pointer`} onClick={handleLogoClick}>
      <div className="bg-gradient-to-br from-blue-950/90 to-black/90 p-3.5 rounded-xl shadow-lg 
                    border border-blue-500/20 group-hover:shadow-blue-500/30 group-hover:border-blue-400/30 
                    transition-all duration-300 transform group-hover:scale-105 relative backdrop-blur-md">
        <div className="absolute inset-0 bg-blue-800/10 rounded-xl blur-sm"></div>
        <LineChart className="h-9 w-9 text-blue-300 group-hover:text-blue-100 transition-colors relative z-10" />
      </div>
      <div className="text-4xl font-black tracking-tighter leading-none relative">
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-blue-200 
                      group-hover:from-white group-hover:to-blue-300 transition-all duration-300 drop-shadow-sm">
          NXT<span className="text-blue-300 group-hover:text-blue-200">LVL</span>
        </span>
        
        {/* "Trading" als Highlight-Element */}
        <div className="relative mt-1">
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
};

type HeaderProps = {
  activeTab?: string;
  onTabChange?: (value: string) => void;
}

export default function Header({ activeTab = "dashboard", onTabChange }: HeaderProps) {
  const { user, logoutMutation } = useAuth();
  const [location, navigate] = useLocation();
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

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
      <div className="bg-gradient-to-r from-black/90 via-blue-950/95 to-black/90 shadow-xl relative overflow-hidden 
                      border-b border-blue-500/20 rounded-b-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/15 via-transparent to-transparent"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-indigo-600/15 via-transparent to-transparent"></div>
        
        {/* Animiertes Hintergrund-Element */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
        
        <div className="container mx-auto py-3 pt-5 relative z-10">
          {/* Top-Bereich mit Logo und Benutzerbereich */}
          <div className="flex flex-col items-center mb-4">
            {/* Kreatives, modernes Logo - angepasst an TabsList Design */}
            <div className="flex justify-center w-full mb-2 relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[28rem] h-16 
                            bg-blue-950/20 blur-xl rounded-full z-0"></div>
              <div className="group relative z-10 w-auto max-w-[28rem]">
                <NxtLvlLogo className="backdrop-blur-sm bg-gradient-to-r from-black/70 via-blue-950/30 to-black/70 
                                      border border-blue-500/20 rounded-xl px-5 py-3
                                      w-full shadow-lg hover:shadow-blue-500/10 transition-shadow duration-300" />
              </div>
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
              <TabsList className="main-tabs-list bg-gradient-to-r from-black/70 via-blue-950/30 to-black/70 p-1.5 rounded-xl shadow-lg border border-blue-500/20 
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
                  <AlertCircle className="w-4 h-4 mr-1.5" /> Risk-Manager
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>
    </header>
  );
}