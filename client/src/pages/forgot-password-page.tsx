import { useState } from "react";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Email obrigatório",
        description: "Por favor, insira seu email.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/request-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Falha ao solicitar reset de senha");
      }

      setIsSuccess(true);
      toast({
        title: "Email enviado!",
        description: data.message,
      });
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold font-accent">Esqueci minha senha</h1>
          <p className="text-sm text-muted-foreground">
            Digite seu email e enviaremos um link para redefinir sua senha.
          </p>
        </div>

        {!isSuccess ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  data-testid="input-email"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              data-testid="button-submit"
            >
              {isLoading ? "Enviando..." : "Enviar link de redefinição"}
            </Button>
          </form>
        ) : (
          <div className="text-center space-y-4">
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
              <p className="text-sm">
                📧 Email enviado com sucesso! Verifique sua caixa de entrada e spam.
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Não recebeu o email? Verifique sua caixa de spam ou tente novamente.
            </p>
          </div>
        )}

        <div className="pt-4 border-t">
          <Link href="/auth">
            <Button variant="ghost" className="w-full" data-testid="button-back-to-login">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para o login
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
