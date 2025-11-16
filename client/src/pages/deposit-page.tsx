import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Zap, Shield, DollarSign } from "lucide-react";
import { Link } from "wouter";

export default function DepositPage() {
  return (
    <div className="min-h-screen bg-[#0F0C34]">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12 space-y-12">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h1 className="font-accent text-4xl md:text-6xl font-bold text-white leading-tight">
            Palpite certo.<br />Lucro real.
          </h1>
          <p className="text-purple-light text-lg md:text-xl max-w-2xl mx-auto">
            Probabilidade = preço. Cada cota vencedora vale 1 BRL3.
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-6">
          <Card className="glass-card p-6 space-y-3 hover-elevate">
            <div className="p-3 bg-gradient-purple/20 rounded-lg w-fit shadow-purple">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-semibold text-lg text-white">Instantâneo</h3>
            <p className="text-purple-light text-sm">
              Depósitos processados em segundos. Seu BRL3 aparece na carteira instantaneamente.
            </p>
          </Card>

          <Card className="glass-card p-6 space-y-3 hover-elevate">
            <div className="p-3 bg-gradient-purple/20 rounded-lg w-fit shadow-purple">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-semibold text-lg text-white">100% Seguro</h3>
            <p className="text-purple-light text-sm">
              Transações criptografadas e armazenamento on-chain. Seus fundos sempre protegidos.
            </p>
          </Card>

          <Card className="glass-card p-6 space-y-3 hover-elevate">
            <div className="p-3 bg-gradient-purple/20 rounded-lg w-fit shadow-purple">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-semibold text-lg text-white">1:1 Lastreado</h3>
            <p className="text-purple-light text-sm">
              Cada BRL3 vale exatamente 1 real. Totalmente lastreado e auditável.
            </p>
          </Card>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card className="glass-card p-8">
            <div className="text-center mb-8">
              <h2 className="font-accent text-2xl font-bold text-white mb-3">
                Pronto para começar?
              </h2>
              <p className="text-purple-light">
                Deposite via PIX e receba BRL3 na sua carteira em segundos.
              </p>
            </div>

            <Link href="/portfolio?tab=wallet">
              <Button 
                className="w-full gradient-purple border border-primary shadow-purple" 
                size="lg" 
                data-testid="button-go-to-wallet"
              >
                Ir para Carteira
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>

            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="text-sm text-purple-muted text-center">
                Depósito mínimo: <span className="font-semibold text-white">R$ 10,00</span>
              </p>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
