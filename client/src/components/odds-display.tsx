import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface OddsDisplayProps {
  probability: number; // 0-1
  className?: string;
}

type OddsFormat = "decimal" | "american" | "percentage";

export function OddsDisplay({ probability, className = "" }: OddsDisplayProps) {
  const [format, setFormat] = useState<OddsFormat>("percentage");

  // Convert probability to different formats
  const getDecimalOdds = () => {
    return (1 / probability).toFixed(2);
  };

  const getAmericanOdds = () => {
    if (probability >= 0.5) {
      return `-${Math.round((probability / (1 - probability)) * 100)}`;
    } else {
      return `+${Math.round(((1 - probability) / probability) * 100)}`;
    }
  };

  const getPercentage = () => {
    return `${Math.round(probability * 100)}%`;
  };

  const displayValue = {
    decimal: getDecimalOdds(),
    american: getAmericanOdds(),
    percentage: getPercentage(),
  };

  const formatLabels = {
    decimal: "Decimal",
    american: "Americano",
    percentage: "Probabilidade",
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Tabs value={format} onValueChange={(v) => setFormat(v as OddsFormat)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="percentage" className="text-xs" data-testid="tab-percentage">
            %
          </TabsTrigger>
          <TabsTrigger value="decimal" className="text-xs" data-testid="tab-decimal">
            Dec
          </TabsTrigger>
          <TabsTrigger value="american" className="text-xs" data-testid="tab-american">
            US
          </TabsTrigger>
        </TabsList>
      </Tabs>
      
      <div className="text-center space-y-1">
        <div className="text-3xl font-bold tabular-nums" data-testid="text-odds-value">
          {displayValue[format]}
        </div>
        <div className="text-xs text-muted-foreground">
          {formatLabels[format]}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground pt-2">
        <div className="text-center">
          <div className="text-primary font-medium">{getPercentage()}</div>
          <div>Prob</div>
        </div>
        <div className="text-center">
          <div className="text-chart-1 font-medium">{getDecimalOdds()}</div>
          <div>Dec</div>
        </div>
        <div className="text-center">
          <div className="text-chart-2 font-medium">{getAmericanOdds()}</div>
          <div>US</div>
        </div>
      </div>
    </div>
  );
}
