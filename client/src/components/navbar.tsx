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
import { Search, User, Wallet, LogOut, LayoutDashboard, Settings, Link as LinkIcon } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useMetaMask } from "@/contexts/MetaMaskContext";
import { Badge } from "@/components/ui/badge";
import { HowToBetDialog } from "@/components/how-to-bet-dialog";
import { useToast } from "@/hooks/use-toast";

export function Navbar() {
  const [location, setLocation] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { account, isConnected, isCorrectNetwork, connectWallet, switchToPolygon, isLoading } = useMetaMask();
  const { toast } = useToast();

  const handleMetaMaskClick = async () => {
    if (!isConnected) {
      await connectWallet();
    } else if (!isCorrectNetwork) {
      await switchToPolygon();
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const navItems = [
    { href: "/", label: "Mercados", icon: LayoutDashboard },
    { href: "/portfolio", label: "Portfólio", icon: Wallet },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-navbar border-b border-white/10">
      <div className="container mx-auto px-6">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Left Section: Logo + How to Bet */}
          <div className="flex items-center gap-3">
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer hover-elevate px-3 py-1 rounded-md transition-all" data-testid="link-home">
                <span className="font-accent text-[22px] font-extrabold text-white">
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
                  className={`gap-2 font-medium ${isActive ? 'text-white bg-white/10 shadow-purple' : 'text-purple-light'}`}
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
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-muted" />
              <Input
                type="search"
                placeholder="Buscar mercados..."
                className="pl-9 bg-white/5 backdrop-blur-sm border-white/10 text-white placeholder:text-purple-muted focus-visible:ring-primary focus-visible:border-white/30 transition-all"
                data-testid="input-search"
              />
            </div>
          </div>

          {/* Right Section: Balance + Deposit + MetaMask + User Menu */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2">
              <Badge 
                variant="outline" 
                className="bg-gradient-purple/20 border-white/20 text-white font-mono tabular-nums px-3 py-1.5 shadow-purple" 
                data-testid="badge-balance-brl3"
              >
                {parseFloat(user?.balanceBrl || "0").toLocaleString('pt-BR', { minimumFractionDigits: 2 })} BRL3
              </Badge>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setLocation("/wallet/deposit")}
                data-testid="button-deposit-pix"
              >
                Depositar PIX
              </Button>
              {isConnected && isCorrectNetwork ? (
                <Badge 
                  variant="outline" 
                  className="bg-green-500/20 border-green-400/30 text-green-300 font-mono px-3 py-1.5" 
                  data-testid="badge-metamask-connected"
                >
                  <LinkIcon className="h-3 w-3 mr-1.5" />
                  {formatAddress(account!)}
                </Badge>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleMetaMaskClick}
                  disabled={isLoading}
                  data-testid="button-connect-metamask"
                >
                  <LinkIcon className="h-4 w-4 mr-1.5" />
                  {isLoading ? "Conectando..." : !isConnected ? "MetaMask" : "Trocar Rede"}
                </Button>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  data-testid="button-user-menu"
                >
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 glass-card border-white/10">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium text-white" data-testid="text-username">@{user?.username}</p>
                    <p className="text-xs text-purple-light truncate">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem asChild>
                  <Link href="/portfolio" className="cursor-pointer w-full text-purple-light hover:text-white">
                    <Wallet className="mr-2 h-4 w-4" />
                    <span>Carteira</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer w-full text-purple-light hover:text-white" data-testid="link-profile">
                    <User className="mr-2 h-4 w-4" />
                    <span>Perfil</span>
                  </Link>
                </DropdownMenuItem>
                {user?.isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="cursor-pointer w-full text-purple-light hover:text-white">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Admin</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem
                  onClick={() => logoutMutation.mutate()}
                  className="cursor-pointer text-destructive focus:text-destructive"
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
