import { useState } from "react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Zap, Shield, DollarSign, ChevronRight, ChevronLeft } from "lucide-react";
import { Link } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const HOW_IT_WORKS_STEPS = [
  {
    number: 1,
    title: "Deposite via PIX",
    description: "Adicione saldo com PIX. Na sequência, a plataforma emite BRL3 on-chain para sua conta."
  },
  {
    number: 2,
    title: "Escolha 'Yes' ou 'No'",
    description: "Comprar 'Yes' ou 'No' é como apostar no resultado. As probabilidades mudam em tempo real conforme outros negociam."
  },
  {
    number: 3,
    title: "Negocie sem taxas",
    description: "Coloque ordens de compra/venda a qualquer momento. Sem limites de aposta e sem taxas de trade."
  },
  {
    number: 4,
    title: "Resgate 1 BRL3 por cota vencedora",
    description: "Quando o mercado encerra, cada cota vencedora vale 1 BRL3. Você também pode vender suas cotas antes do fim."
  }
];

function HowItWorksDialog() {
  const [currentStep, setCurrentStep] = useState(0);
  const [open, setOpen] = useState(false);

  const goToNext = () => {
    if (currentStep < HOW_IT_WORKS_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setCurrentStep(0);
    }
  };

  const step = HOW_IT_WORKS_STEPS[currentStep];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg" className="bg-white hover:bg-gray-50" data-testid="button-how-it-works">
          Como funciona
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-accent text-2xl">Como funciona</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 text-primary rounded-full mb-4">
              <span className="text-2xl font-bold">{step.number}</span>
            </div>
            <h3 className="font-semibold text-xl mb-3">{step.title}</h3>
            <p className="text-muted-foreground leading-relaxed">
              {step.description}
            </p>
          </div>

          <div className="flex items-center justify-center gap-2">
            {HOW_IT_WORKS_STEPS.map((_, idx) => (
              <div
                key={idx}
                className={`h-2 rounded-full transition-all ${
                  idx === currentStep ? "w-8 bg-primary" : "w-2 bg-muted"
                }`}
              />
            ))}
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={goToPrevious}
              disabled={currentStep === 0}
              className="flex-1"
              data-testid="button-wizard-previous"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Anterior
            </Button>
            <Button
              onClick={goToNext}
              disabled={currentStep === HOW_IT_WORKS_STEPS.length - 1}
              className="flex-1"
              data-testid="button-wizard-next"
            >
              Próximo
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function DepositPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-50">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12 space-y-12">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h1 className="font-accent text-4xl md:text-6xl font-bold text-gray-900 dark:text-gray-900 leading-tight">
            Palpite certo.<br />Lucro real.
          </h1>
          <p className="text-gray-600 dark:text-gray-600 text-lg md:text-xl max-w-2xl mx-auto">
            Probabilidade = preço. Cada cota vencedora vale 1 BRL3.
          </p>
          <div className="flex justify-center">
            <HowItWorksDialog />
          </div>
        </div>

        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-6">
          <Card className="p-6 space-y-3 bg-white dark:bg-white border-gray-200 hover-elevate">
            <div className="p-3 bg-primary/10 rounded-lg w-fit">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-lg text-gray-900">Instantâneo</h3>
            <p className="text-gray-600 text-sm">
              Depósitos processados em segundos. Seu BRL3 aparece na carteira instantaneamente.
            </p>
          </Card>

          <Card className="p-6 space-y-3 bg-white dark:bg-white border-gray-200 hover-elevate">
            <div className="p-3 bg-primary/10 rounded-lg w-fit">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-lg text-gray-900">100% Seguro</h3>
            <p className="text-gray-600 text-sm">
              Transações criptografadas e armazenamento on-chain. Seus fundos sempre protegidos.
            </p>
          </Card>

          <Card className="p-6 space-y-3 bg-white dark:bg-white border-gray-200 hover-elevate">
            <div className="p-3 bg-primary/10 rounded-lg w-fit">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-lg text-gray-900">1:1 Lastreado</h3>
            <p className="text-gray-600 text-sm">
              Cada BRL3 vale exatamente 1 real. Totalmente lastreado e auditável.
            </p>
          </Card>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card className="p-8 bg-white dark:bg-white border-gray-200">
            <div className="text-center mb-8">
              <h2 className="font-accent text-2xl font-bold text-gray-900 mb-3">
                Pronto para começar?
              </h2>
              <p className="text-gray-600">
                Deposite via PIX e receba BRL3 na sua carteira em segundos.
              </p>
            </div>

            <Link href="/portfolio?tab=wallet">
              <Button className="w-full bg-primary hover:bg-primary/90 text-white" size="lg" data-testid="button-go-to-wallet">
                Ir para Carteira
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>

            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-gray-500 text-center">
                Depósito mínimo: <span className="font-semibold text-gray-700">R$ 10,00</span>
              </p>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
