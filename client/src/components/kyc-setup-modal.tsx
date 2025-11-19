import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck } from "lucide-react";

interface KYCSetupModalProps {
  open: boolean;
  onSuccess: () => void;
}

interface KYCFormData {
  fullName: string;
  cpf: string;
  birthDate: string;
  phone: string;
  addressZipCode: string;
  addressStreet: string;
  addressNumber: string;
  addressComplement: string;
  addressDistrict: string;
  addressCity: string;
  addressState: string;
}

export function KYCSetupModal({ open, onSuccess }: KYCSetupModalProps) {
  const [formData, setFormData] = useState<KYCFormData>({
    fullName: "",
    cpf: "",
    birthDate: "",
    phone: "",
    addressZipCode: "",
    addressStreet: "",
    addressNumber: "",
    addressComplement: "",
    addressDistrict: "",
    addressCity: "",
    addressState: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const kycMutation = useMutation({
    mutationFn: async (data: KYCFormData) => {
      const res = await apiRequest("PUT", "/api/user/kyc", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "KYC enviado com sucesso!",
        description: "Seus dados estão sendo analisados pela equipe",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao enviar KYC",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleChange = (field: keyof KYCFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    kycMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" 
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Verificação de Identidade (KYC)
          </DialogTitle>
          <DialogDescription>
            Complete seu cadastro para começar a apostar. Seus dados são protegidos e seguros.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Dados Pessoais */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Dados Pessoais</h3>
            
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome Completo</Label>
              <Input
                id="fullName"
                placeholder="João Silva Santos"
                value={formData.fullName}
                onChange={(e) => handleChange("fullName", e.target.value)}
                required
                data-testid="input-kyc-fullname"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  placeholder="12345678900"
                  maxLength={11}
                  value={formData.cpf}
                  onChange={(e) => handleChange("cpf", e.target.value.replace(/\D/g, ''))}
                  required
                  data-testid="input-kyc-cpf"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthDate">Data de Nascimento</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => handleChange("birthDate", e.target.value)}
                  required
                  data-testid="input-kyc-birthdate"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone (com DDD)</Label>
              <Input
                id="phone"
                placeholder="11987654321"
                maxLength={11}
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value.replace(/\D/g, ''))}
                required
                data-testid="input-kyc-phone"
              />
            </div>
          </div>

          {/* Endereço */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Endereço</h3>
            
            <div className="space-y-2">
              <Label htmlFor="addressZipCode">CEP</Label>
              <Input
                id="addressZipCode"
                placeholder="01310100"
                maxLength={8}
                value={formData.addressZipCode}
                onChange={(e) => handleChange("addressZipCode", e.target.value.replace(/\D/g, ''))}
                required
                data-testid="input-kyc-zipcode"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="addressStreet">Rua</Label>
                <Input
                  id="addressStreet"
                  placeholder="Av. Paulista"
                  value={formData.addressStreet}
                  onChange={(e) => handleChange("addressStreet", e.target.value)}
                  required
                  data-testid="input-kyc-street"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="addressNumber">Número</Label>
                <Input
                  id="addressNumber"
                  placeholder="1000"
                  value={formData.addressNumber}
                  onChange={(e) => handleChange("addressNumber", e.target.value)}
                  required
                  data-testid="input-kyc-number"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="addressComplement">Complemento (opcional)</Label>
              <Input
                id="addressComplement"
                placeholder="Apto 101, Bloco A"
                value={formData.addressComplement}
                onChange={(e) => handleChange("addressComplement", e.target.value)}
                data-testid="input-kyc-complement"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="addressDistrict">Bairro</Label>
              <Input
                id="addressDistrict"
                placeholder="Bela Vista"
                value={formData.addressDistrict}
                onChange={(e) => handleChange("addressDistrict", e.target.value)}
                required
                data-testid="input-kyc-district"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="addressCity">Cidade</Label>
                <Input
                  id="addressCity"
                  placeholder="São Paulo"
                  value={formData.addressCity}
                  onChange={(e) => handleChange("addressCity", e.target.value)}
                  required
                  data-testid="input-kyc-city"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="addressState">UF</Label>
                <Input
                  id="addressState"
                  placeholder="SP"
                  maxLength={2}
                  value={formData.addressState}
                  onChange={(e) => handleChange("addressState", e.target.value.toUpperCase())}
                  required
                  data-testid="input-kyc-state"
                />
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={kycMutation.isPending}
            data-testid="button-kyc-submit"
          >
            {kycMutation.isPending ? "Enviando..." : "Enviar Verificação"}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Ao enviar, você concorda com nossa política de privacidade e aceita que seus dados sejam verificados.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
