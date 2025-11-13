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
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  const navItems = [
    { href: "/", label: "Mercados", icon: LayoutDashboard },
    { href: "/portfolio", label: "Portfólio", icon: Wallet },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-glass-white border-b border-[var(--border-soft)] shadow-sm">
      <div className="container mx-auto px-6">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Left Section: Logo + How to Bet */}
          <div className="flex items-center gap-3">
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer" data-testid="link-home">
                <span className="font-accent text-[22px] font-extrabold bg-gradient-to-r from-[var(--primary-blue)] to-[var(--primary-blue-light)] bg-clip-text text-transparent">
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
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={`gap-2 font-medium ${isActive ? 'text-[var(--primary-blue)]' : 'text-[var(--text-medium)]'} hover:text-[var(--primary-blue)]`}
                    data-testid={`link-${item.label.toLowerCase()}`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </div>

          {/* Search Bar */}
          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-light)]" />
              <Input
                type="search"
                placeholder="Buscar mercados..."
                className="pl-9 bg-white border-[var(--border-soft)] focus-visible:ring-[var(--primary-blue)]"
                data-testid="input-search"
              />
            </div>
          </div>

          {/* Right Section: Balance + Deposit + User Menu */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2">
              <Badge 
                variant="outline" 
                className="bg-[var(--primary-blue-bg)] border-[var(--primary-blue)]/20 text-[var(--primary-blue)] font-mono tabular-nums px-3 py-1" 
                data-testid="badge-balance-brl3"
              >
                {parseFloat(user?.balanceBrl || "0").toLocaleString('pt-BR', { minimumFractionDigits: 2 })} BRL3
              </Badge>
              <Link href="/wallet/deposit">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-[var(--primary-blue)]/30 text-[var(--primary-blue)] hover:bg-[var(--glass-blue)] font-medium" 
                  data-testid="button-deposit-pix"
                >
                  Depositar PIX
                </Button>
              </Link>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="hover:bg-[var(--glass-blue)]"
                  data-testid="button-user-menu"
                >
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white border-[var(--border-soft)]">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium text-[var(--text-dark)]" data-testid="text-username">@{user?.username}</p>
                    <p className="text-xs text-[var(--text-medium)] truncate">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-[var(--border-soft)]" />
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
                <DropdownMenuSeparator className="bg-[var(--border-soft)]" />
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
