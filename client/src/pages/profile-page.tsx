import { useQuery, useMutation } from "@tanstack/react-query";
import { Navbar } from "@/components/navbar";
import { AIAssistant } from "@/components/ai-assistant";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wallet, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { useState, useEffect } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

interface UserProfile {
  id: number;
  email: string;
  username: string;
  walletAddress: string | null;
  balanceBrl: string;
  balanceUsdc: string;
  isAdmin: boolean;
}

export default function ProfilePage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [walletAddress, setWalletAddress] = useState("");
  const [isValid, setIsValid] = useState<boolean | null>(null);

  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: ["/api/user/profile"],
  });

  // Update local state when profile loads
  useEffect(() => {
    if (profile?.walletAddress) {
      setWalletAddress(profile.walletAddress);
      setIsValid(true);
    }
  }, [profile]);

  // Validate Ethereum address format as user types
  useEffect(() => {
    if (!walletAddress) {
      setIsValid(null);
      return;
    }
    
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    setIsValid(ethAddressRegex.test(walletAddress));
  }, [walletAddress]);

  const updateWalletMutation = useMutation({
    mutationFn: async (newWalletAddress: string) => {
      const res = await apiRequest("PUT", "/api/user/wallet", { 
        walletAddress: newWalletAddress 
      });
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
      toast({
        title: "Carteira atualizada!",
        description: `Endereço ${data.walletAddress.slice(0, 6)}...${data.walletAddress.slice(-4)} salvo com sucesso.`,
        duration: 5000,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar carteira",
        description: error.message || "Tente novamente mais tarde",
        variant: "destructive",
      });
    },
  });

  const handleSaveWallet = () => {
    if (!isValid || !walletAddress) {
      toast({
        title: "Endereço inválido",
        description: "Por favor, insira um endereço Polygon válido (0x...)",
        variant: "destructive",
      });
      return;
    }
    updateWalletMutation.mutate(walletAddress);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Skeleton className="h-10 w-48 mb-6" />
          <Skeleton className="h-64 w-full" />
        </div>
        <AIAssistant />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Meu Perfil</h1>
          <p className="text-muted-foreground">
            Gerencie suas informações pessoais e configurações de carteira
          </p>
        </div>

        <div className="space-y-6">
          {/* Informações Básicas */}
          <Card data-testid="card-profile-info">
            <CardHeader>
              <CardTitle>Informações da Conta</CardTitle>
              <CardDescription>
                Suas informações básicas de registro
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm text-muted-foreground">Email</Label>
                <p className="text-base font-medium" data-testid="text-profile-email">
                  {profile?.email}
                </p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Username</Label>
                <p className="text-base font-medium" data-testid="text-profile-username">
                  {profile?.username}
                </p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Status</Label>
                <div>
                  {profile?.isAdmin ? (
                    <Badge variant="default" data-testid="badge-admin">
                      Administrador
                    </Badge>
                  ) : (
                    <Badge variant="secondary" data-testid="badge-user">
                      Usuário
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Carteira Polygon */}
          <Card data-testid="card-wallet-config">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                <CardTitle>Carteira Polygon</CardTitle>
              </div>
              <CardDescription>
                Configure seu endereço de carteira Polygon para depósitos e saques em BRL
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Alert informativo */}
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Por que preciso de uma carteira Polygon?</strong>
                  <br />
                  Seus BRL3 tokens são armazenados na blockchain Polygon. Você precisa de uma carteira
                  para receber tokens quando depositar e assinar saques (gasless - você não paga taxas!).
                </AlertDescription>
              </Alert>

              {/* Campo de endereço */}
              <div className="space-y-2">
                <Label htmlFor="wallet-address">
                  Endereço da Carteira Polygon
                  {profile?.walletAddress && (
                    <Badge variant="outline" className="ml-2">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Configurada
                    </Badge>
                  )}
                </Label>
                <div className="relative">
                  <Input
                    id="wallet-address"
                    data-testid="input-wallet-address"
                    type="text"
                    placeholder="0x..."
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    className={
                      isValid === false 
                        ? "border-destructive focus-visible:ring-destructive pr-10" 
                        : isValid === true
                        ? "border-green-500 focus-visible:ring-green-500 pr-10"
                        : ""
                    }
                  />
                  {isValid === true && (
                    <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
                  )}
                  {isValid === false && (
                    <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-destructive" />
                  )}
                </div>
                {isValid === false && (
                  <p className="text-sm text-destructive">
                    Endereço inválido. Deve começar com 0x e ter 42 caracteres.
                  </p>
                )}
                {isValid === true && walletAddress !== profile?.walletAddress && (
                  <p className="text-sm text-muted-foreground">
                    Clique em "Salvar Carteira" para confirmar o novo endereço.
                  </p>
                )}
              </div>

              <Button
                data-testid="button-save-wallet"
                onClick={handleSaveWallet}
                disabled={!isValid || walletAddress === profile?.walletAddress || updateWalletMutation.isPending}
                className="w-full"
              >
                {updateWalletMutation.isPending ? "Salvando..." : "Salvar Carteira"}
              </Button>

              {/* Tutorial */}
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Como obter um endereço Polygon:</strong>
                  <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                    <li>Instale a extensão MetaMask no seu navegador</li>
                    <li>Crie uma nova conta ou use uma existente</li>
                    <li>Adicione a rede Polygon Mainnet (ChainID: 137)</li>
                    <li>Copie seu endereço público (começa com 0x...)</li>
                    <li>Cole acima e clique em "Salvar Carteira"</li>
                  </ol>
                </AlertDescription>
              </Alert>

              {/* Status de configuração */}
              {!profile?.walletAddress && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Atenção:</strong> Você precisa configurar sua carteira antes de poder
                    fazer depósitos ou saques em BRL.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <AIAssistant />
    </div>
  );
}
