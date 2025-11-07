interface StepProps {
  num: number;
  title: string;
  desc: string;
}

function Step({ num, title, desc }: StepProps) {
  return (
    <div className="bg-surface-2 rounded-xl2 p-5 shadow-soft hover:bg-surface-3 transition-colors">
      <div className="text-brand-300 text-sm font-medium mb-1">
        {num}. {title}
      </div>
      <div className="text-white/90 text-sm leading-relaxed">
        {desc}
      </div>
    </div>
  );
}

export default function HowItWorks() {
  return (
    <section className="max-w-5xl mx-auto mb-8 px-4" data-testid="section-how-it-works">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-semibold text-white">Como funciona</h2>
        <p className="text-white/70 text-sm mt-2">
          Rápido, simples e 100% lastreado em BRL3.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Step
          num={1}
          title="Deposite via PIX"
          desc="Adicione saldo com PIX. Na sequência, a plataforma emite BRL3 on-chain para sua conta."
        />
        <Step
          num={2}
          title="Escolha 'Yes' ou 'No'"
          desc="Comprar 'Yes' ou 'No' é como apostar no resultado. As probabilidades mudam em tempo real conforme outros negociam."
        />
        <Step
          num={3}
          title="Negocie sem taxas"
          desc="Coloque ordens de compra/venda a qualquer momento. Sem limites de aposta e sem taxas de trade."
        />
        <Step
          num={4}
          title="Resgate 1 BRL3 por cota vencedora"
          desc="Quando o mercado encerra, cada cota vencedora vale 1 BRL3. Você também pode vender suas cotas antes do fim."
        />
      </div>
    </section>
  );
}
