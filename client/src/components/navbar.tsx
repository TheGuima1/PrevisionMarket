import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, User, Wallet, LogOut, LayoutDashboard, Settings } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { HowToBetDialog } from "@/components/how-to-bet-dialog";

export function Navbar() {
  const [location, setLocation] = useLocation();
  const { user, logoutMutation } = useAuth();

  const navItems = [
    { href: "/", label: "Mercados", icon: LayoutDashboard },
    { href: "/portfolio", label: "Portfólio", icon: Wallet },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-glass-white backdrop-blur-xl border-b-2 border-primary/10 shadow-lg shadow-primary/5">
      <div className="container mx-auto px-6">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Left Section: Logo + How to Bet */}
          <div className="flex items-center gap-3">
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer group" data-testid="link-home">
                <span className="font-accent text-[22px] font-extrabold text-gradient-purple group-hover:scale-105 transition-transform">
                  Palpites.AI
                </span>
              </div>
            </Link>
            <HowToBetDialog />
          </div>

          {/* Center Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              return (
                <Button
                  key={item.href}
                  variant={isActive ? "secondary" : "ghost"}
                  className={`gap-2 font-medium transition-all ${isActive ? 'text-primary bg-primary/10 shadow-sm shadow-primary/20' : 'text-muted-foreground'} hover:text-primary hover:bg-primary/5`}
                  onClick={() => setLocation(item.href)}
                  data-testid={`link-${item.label.toLowerCase()}`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Button>
              );
            })}
          </div>

          {/* Search Bar */}
          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar mercados..."
                className="pl-9 bg-white/80 backdrop-blur-sm border-primary/20 focus-visible:ring-primary focus-visible:border-primary/40 transition-all"
                data-testid="input-search"
              />
            </div>
          </div>

          {/* Right Section: Balance + Deposit + User Menu */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2">
              <Badge 
                variant="outline" 
                className="bg-gradient-to-r from-purple-50 to-purple-100 border-primary/20 text-primary font-mono tabular-nums px-3 py-1.5 shadow-sm shadow-primary/10" 
                data-testid="badge-balance-brl3"
              >
                {parseFloat(user?.balanceBrl || "0").toLocaleString('pt-BR', { minimumFractionDigits: 2 })} BRL3
              </Badge>
              <Button 
                variant="outline" 
                size="sm" 
                className="border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50 hover:shadow-sm hover:shadow-primary/20 font-medium transition-all" 
                onClick={() => setLocation("/wallet/deposit")}
                data-testid="button-deposit-pix"
              >
                Depositar PIX
              </Button>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="hover:bg-primary/5 hover:text-primary transition-all"
                  data-testid="button-user-menu"
                >
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white/95 backdrop-blur-sm border-primary/20 shadow-lg shadow-primary/10">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium text-foreground" data-testid="text-username">@{user?.username}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem asChild>
                  <Link href="/portfolio" className="cursor-pointer w-full">
                    <Wallet className="mr-2 h-4 w-4" />
                    <span>Carteira</span>
                  </Link>
                </DropdownMenuItem>
                {user?.isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="cursor-pointer w-full">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Admin</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem
                  onClick={() => logoutMutation.mutate()}
                  className="cursor-pointer text-[var(--red-tech)] focus:text-[var(--red-tech)]"
                  data-testid="button-logout"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
