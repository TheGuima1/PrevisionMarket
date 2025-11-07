import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Zap, Shield, DollarSign } from "lucide-react";
import { Link } from "wouter";

export default function DepositPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12 space-y-12">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <h1 className="font-accent text-4xl md:text-5xl font-bold text-white">
            Deposite via PIX
          </h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            Pague com PIX → saldo é tokenizado em BRL3 on-chain na sua conta
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-6">
          <Card className="p-6 space-y-3 bg-surface-2 rounded-xl2 shadow-soft hover:bg-surface-3 transition-colors">
            <div className="p-3 bg-brand-500/10 rounded-lg w-fit">
              <Zap className="h-6 w-6 text-brand-300" />
            </div>
            <h3 className="font-semibold text-lg text-white">Instantâneo</h3>
            <p className="text-white/70 text-sm">
              Depósitos processados em segundos. Seu BRL3 aparece na carteira instantaneamente.
            </p>
          </Card>

          <Card className="p-6 space-y-3 bg-surface-2 rounded-xl2 shadow-soft hover:bg-surface-3 transition-colors">
            <div className="p-3 bg-brand-500/10 rounded-lg w-fit">
              <Shield className="h-6 w-6 text-brand-300" />
            </div>
            <h3 className="font-semibold text-lg text-white">100% Seguro</h3>
            <p className="text-white/70 text-sm">
              Transações criptografadas e armazenamento on-chain. Seus fundos sempre protegidos.
            </p>
          </Card>

          <Card className="p-6 space-y-3 bg-surface-2 rounded-xl2 shadow-soft hover:bg-surface-3 transition-colors">
            <div className="p-3 bg-brand-500/10 rounded-lg w-fit">
              <DollarSign className="h-6 w-6 text-brand-300" />
            </div>
            <h3 className="font-semibold text-lg text-white">1:1 Lastreado</h3>
            <p className="text-white/70 text-sm">
              Cada BRL3 vale exatamente 1 real. Totalmente lastreado e auditável.
            </p>
          </Card>
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="p-8 bg-surface-2 rounded-xl2 shadow-soft">
            <h2 className="font-accent text-2xl font-bold text-white mb-6">
              Como funciona o depósito
            </h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-brand-500/20 text-brand-300 rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-1">Acesse sua carteira</h4>
                  <p className="text-white/70 text-sm">
                    Na aba "Carteira" do seu portfólio, escolha "Depositar BRL3".
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-brand-500/20 text-brand-300 rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-1">Insira o valor</h4>
                  <p className="text-white/70 text-sm">
                    Digite quanto você quer depositar. Mínimo de R$ 10,00.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-brand-500/20 text-brand-300 rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-1">Gere o QR Code PIX</h4>
                  <p className="text-white/70 text-sm">
                    Clique em "Depositar via PIX" e escaneie o QR Code com seu app bancário.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-brand-500/20 text-brand-300 rounded-full flex items-center justify-center font-bold">
                  4
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-1">Receba BRL3 on-chain</h4>
                  <p className="text-white/70 text-sm">
                    Após confirmação, BRL3 é emitido on-chain e aparece na sua carteira.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10">
              <Link href="/portfolio?tab=wallet">
                <Button className="w-full bg-brand-500 hover:bg-brand-400 text-white" size="lg" data-testid="button-go-to-wallet">
                  Ir para Carteira
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
