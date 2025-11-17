import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Lock, CheckCircle2 } from "lucide-react";

export default function ResetPasswordPage() {
  const [, navigate] = useLocation();
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get("token");
    
    if (!tokenParam) {
      toast({
        title: "Token inválido",
        description: "Link de reset inválido ou expirado.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    
    setToken(tokenParam);
  }, [navigate, toast]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!newPassword || newPassword.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter no mínimo 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Senhas não coincidem",
        description: "As senhas digitadas não são iguais.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Falha ao redefinir senha");
      }

      setIsSuccess(true);
      toast({
        title: "Senha atualizada!",
        description: data.message,
      });

      setTimeout(() => {
        navigate("/auth");
      }, 3000);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (!token) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0F0C34]">
      <Card className="glass-card w-full max-w-md p-8 space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold font-accent text-white">Redefinir senha</h1>
          <p className="text-sm text-purple-light">
            Digite sua nova senha abaixo.
          </p>
        </div>

        {!isSuccess ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-white">Nova senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-muted" />
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Digite sua nova senha"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-10 bg-white/5 backdrop-blur-sm border-white/10 text-white placeholder:text-purple-muted focus-visible:ring-primary focus-visible:border-white/30"
                  data-testid="input-new-password"
                  disabled={isLoading}
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-white">Confirmar senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-muted" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Digite novamente a senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 bg-white/5 backdrop-blur-sm border-white/10 text-white placeholder:text-purple-muted focus-visible:ring-primary focus-visible:border-white/30"
                  data-testid="input-confirm-password"
                  disabled={isLoading}
                  required
                  minLength={6}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full gradient-purple border border-primary shadow-purple"
              disabled={isLoading}
              data-testid="button-submit"
            >
              {isLoading ? "Salvando..." : "Salvar nova senha"}
            </Button>
          </form>
        ) : (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <CheckCircle2 className="h-16 w-16 text-primary" />
            </div>
            <div className="bg-primary/20 border border-primary/30 rounded-lg p-4 backdrop-blur-sm">
              <p className="text-sm font-medium text-white">
                ✅ Senha atualizada com sucesso!
              </p>
              <p className="text-xs text-purple-light mt-2">
                Redirecionando para o login...
              </p>
            </div>
            <Link href="/auth">
              <Button variant="outline" className="w-full" data-testid="button-go-to-login">
                Ir para o login
              </Button>
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
}
