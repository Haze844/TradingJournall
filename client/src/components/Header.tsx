import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  FileUp, Settings, Brain, BarChart2, Activity, Trophy, Calendar,
  Users, TrendingDown, DollarSign, AlertCircle, LogOut, LineChart, User,
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
    <header className="w-full main-header mb-6 bg-gradient-to-r from-blue-950/40 to-blue-800/30 backdrop-blur-lg shadow-lg border-b border-blue-500/10">
      <div className="container mx-auto py-4">
        <div className="flex justify-between items-center">
          
          {/* Moderneres Logo mit NXT LVL Trading */}
          <Link href="/" className="flex-1 flex items-center hover:opacity-90 transition-all">
            <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700 
                           rounded-lg flex items-center justify-center text-white shadow-xl
                           py-2.5 px-4 mr-4 border border-blue-400/20">
              <div className="flex items-center">
                <LineChart className="w-5 h-5 mr-2 text-blue-200" />
                <div className="text-lg font-extrabold tracking-tight leading-none">
                  NXT <span className="text-blue-200 font-black">LVL</span> <span className="font-bold">TRADING</span>
                </div>
              </div>
            </div>
          </Link>
          
          {/* Integrierter Kontobereich */}
          <div className="flex items-center gap-2 whitespace-nowrap">
            {user ? (
              <div className="flex items-center bg-gradient-to-r from-blue-900/40 to-blue-800/40 rounded-full overflow-hidden border border-blue-500/20 shadow-md">
                <div className="flex items-center px-4 py-1.5">
                  <User className="w-4 h-4 mr-2 text-blue-300" />
                  <span className="font-medium text-blue-100">
                    {user.username}
                  </span>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-full rounded-none border-l border-blue-500/20 bg-blue-800/30 hover:bg-blue-700/40 transition-colors px-3">
                      <Settings className="w-4 h-4 text-blue-300" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-black/90 backdrop-blur-md border-blue-500/30">
                    <DropdownMenuLabel className="text-blue-300">Kontoeinstellungen</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-blue-500/20" />
                    <DropdownMenuItem className="hover:bg-blue-900/40">
                      <Settings className="w-4 h-4 mr-2 text-blue-400" />
                      <span>Einstellungen</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-blue-500/20" />
                    <DropdownMenuItem onClick={handleLogout} className="hover:bg-blue-900/40 text-red-300 hover:text-red-200">
                      <LogOut className="w-4 h-4 mr-2" />
                      <span>Abmelden</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <Button variant="ghost" size="sm" asChild className="bg-blue-600/30 hover:bg-blue-600/40 text-blue-100">
                <Link href="/auth">Anmelden</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}