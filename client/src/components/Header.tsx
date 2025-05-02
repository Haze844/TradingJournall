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
    <header className="w-full main-header mb-6 bg-gradient-to-r from-blue-900/20 to-purple-900/15 backdrop-blur-md shadow-md">
      <div className="container mx-auto py-3">
        <div className="flex justify-between items-center">
          
          {/* Moderneres Logo über die gesamte Breite - Verlinkt zur Hauptseite */}
          <Link href="/" className="flex-1 flex items-center hover:opacity-90 transition-all">
            <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 
                           rounded-xl flex items-center justify-center text-white shadow-lg
                           py-2 px-3 mr-4">
              <div className="text-xl font-extrabold tracking-tighter leading-none">
                NXT<span className="ml-1 text-blue-200">LVL</span>
              </div>
            </div>
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-white to-blue-300 bg-clip-text text-transparent">
                Trading Journal
              </h1>
              <p className="text-xs text-blue-300/80">Performance optimieren. Gewinne maximieren.</p>
            </div>
          </Link>
          
          {/* Nur Konto und Einstellungen - vereinfachte Navigation */}
          <div className="flex items-center gap-3 whitespace-nowrap">
            {user ? (
              <>
                <div className="bg-black/20 rounded-full px-4 py-1.5 border border-primary/20 flex items-center">
                  <span className="text-sm font-medium text-white mr-1.5">
                    {user.username}
                  </span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex items-center bg-black/30 hover:bg-black/50 transition-colors">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44 bg-black/90 backdrop-blur-md border-primary/20">
                    <DropdownMenuLabel className="text-primary">Kontoeinstellungen</DropdownMenuLabel>
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
              <Button variant="ghost" size="sm" asChild className="bg-primary/20 hover:bg-primary/30">
                <Link href="/auth">Anmelden</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}