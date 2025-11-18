import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/navbar";
import { AIAssistant } from "@/components/ai-assistant";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface UserProfile {
  id: number;
  email: string;
  username: string;
  balanceBrl: string;
  balanceUsdc: string;
  isAdmin: boolean;
}

export default function ProfilePage() {
  const { user } = useAuth();

  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: ["/api/user/profile"],
  });

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
            Gerencie suas informações pessoais
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

          {/* Informação sobre custódia */}
          <Card>
            <CardHeader>
              <CardTitle>Custódia de Tokens BRL3</CardTitle>
              <CardDescription>
                Como funcionam os depósitos e saques
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Modelo de Custódia Simplificado</strong>
                  <br />
                  Seus tokens BRL3 ficam custodiados em nossa plataforma de forma segura.
                  <br /><br />
                  <strong>Como funciona:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                    <li>Depósito PIX → Aprovação admin → Saldo creditado automaticamente</li>
                    <li>Saque → Aprovação admin → Transferência PIX para sua conta</li>
                    <li>Tokens ficam seguros em custódia</li>
                    <li>Você gerencia tudo pela plataforma de forma simples</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>

      <AIAssistant />
    </div>
  );
}
