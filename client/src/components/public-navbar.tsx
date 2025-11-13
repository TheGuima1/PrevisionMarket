import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { LogIn, UserPlus } from "lucide-react";
import { HowToBetDialog } from "@/components/how-to-bet-dialog";

export function PublicNavbar() {
  const [, setLocation] = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Left Section: Como Palpitar + Logo */}
        <div className="flex items-center gap-4">
          <HowToBetDialog />
          <Link href="/" data-testid="link-home">
            <span className="flex items-center gap-2 hover-elevate px-3 py-1 rounded-md transition-all cursor-pointer">
              <span className="font-accent text-3xl font-bold text-primary">
                Palpites.AI
              </span>
            </span>
          </Link>
        </div>

        {/* Auth Buttons */}
        <div className="flex items-center gap-3">
          <Button 
            variant="outline"
            onClick={() => setLocation("/wallet/deposit")}
            className="bg-primary/10 border-primary/20 text-primary no-default-hover-elevate text-base h-10 px-5"
            data-testid="button-deposit-pix"
          >
            Depositar via PIX
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => setLocation("/auth")}
            className="no-default-hover-elevate text-base h-10 px-4"
            data-testid="button-login"
          >
            <LogIn className="h-5 w-5 mr-2" />
            Login
          </Button>
          <Button 
            onClick={() => setLocation("/auth")}
            className="no-default-hover-elevate text-base h-10 px-5"
            data-testid="button-signup"
          >
            <UserPlus className="h-5 w-5 mr-2" />
            Sign Up
          </Button>
        </div>
      </div>
    </header>
  );
}
