import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { LogIn, UserPlus } from "lucide-react";
import { HowToBetDialog } from "@/components/how-to-bet-dialog";

export function PublicNavbar() {
  const [, setLocation] = useLocation();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-navbar border-b border-white/10">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        {/* Left Section: Logo + Como Palpitar */}
        <div className="flex items-center gap-4">
          <Link href="/" data-testid="link-home">
            <span className="flex items-center gap-2 hover-elevate px-3 py-1 rounded-md transition-all cursor-pointer">
              <span className="font-accent text-[22px] font-extrabold text-white">
                Palpites.AI
              </span>
            </span>
          </Link>
          <HowToBetDialog />
        </div>

        {/* Center Navigation (hidden on mobile) */}
        <div className="hidden md:flex items-center gap-6 text-purple-light font-semibold">
          <Link href="/" className="hover-elevate px-3 py-1 rounded-md transition-all">
            Mercados
          </Link>
          <Link href="/wallet/deposit" className="hover-elevate px-3 py-1 rounded-md transition-all">
            Carteira
          </Link>
        </div>

        {/* Right Section: Auth Buttons */}
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost"
            onClick={() => setLocation("/auth")}
            className="text-purple-light font-semibold"
            data-testid="button-login"
          >
            <LogIn className="h-5 w-5 mr-2" />
            Login
          </Button>
          <Button 
            onClick={() => setLocation("/auth")}
            className="bg-gradient-purple text-white font-semibold shadow-purple border border-primary"
            data-testid="button-signup"
          >
            <UserPlus className="h-5 w-5 mr-2" />
            Criar Conta
          </Button>
        </div>
      </div>
    </header>
  );
}
