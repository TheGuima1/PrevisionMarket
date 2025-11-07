import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { ChevronRight, ChevronLeft, X } from "lucide-react";

const HOW_TO_BET_STEPS = [
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

interface HowToBetDialogProps {
  trigger?: React.ReactNode;
}

export function HowToBetDialog({ trigger }: HowToBetDialogProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [open, setOpen] = useState(false);

  const goToNext = () => {
    if (currentStep < HOW_TO_BET_STEPS.length - 1) {
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

  const step = HOW_TO_BET_STEPS[currentStep];

  const defaultTrigger = (
    <Button variant="ghost" size="sm" data-testid="button-how-to-bet">
      Como Palpitar
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="relative">
          <DialogTitle className="font-accent text-2xl">Como Palpitar</DialogTitle>
          <DialogClose className="absolute right-0 top-0" data-testid="button-close-dialog">
            <X className="h-4 w-4" />
            <span className="sr-only">Fechar</span>
          </DialogClose>
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
            {HOW_TO_BET_STEPS.map((_, idx) => (
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
              disabled={currentStep === HOW_TO_BET_STEPS.length - 1}
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
