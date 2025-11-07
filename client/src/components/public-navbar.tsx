import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { LogIn, UserPlus } from "lucide-react";

export function PublicNavbar() {
  const [, setLocation] = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" data-testid="link-home">
          <span className="flex items-center gap-2 hover-elevate px-3 py-1 rounded-md transition-all cursor-pointer">
            <span className="font-accent text-2xl font-bold bg-gradient-to-r from-brand-400 via-brand-500 to-brand-600 bg-clip-text text-transparent">
              Palpites.AI
            </span>
          </span>
        </Link>

        {/* Auth Buttons */}
        <div className="flex items-center gap-2">
          <Button 
            variant="outline"
            size="sm" 
            onClick={() => setLocation("/wallet/deposit")}
            className="bg-brand-500/10 border-brand-500/20 text-brand-300 hover:bg-brand-500/20"
            data-testid="button-deposit-pix"
          >
            Depositar via PIX
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setLocation("/auth")}
            data-testid="button-login"
          >
            <LogIn className="h-4 w-4 mr-2" />
            Login
          </Button>
          <Button 
            size="sm" 
            onClick={() => setLocation("/auth")}
            data-testid="button-signup"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Sign Up
          </Button>
        </div>
      </div>
    </header>
  );
}
