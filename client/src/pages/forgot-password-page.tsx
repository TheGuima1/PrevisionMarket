import { useState } from "react";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Mail, Copy, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resetLink, setResetLink] = useState("");
  const [copied, setCopied] = useState(false);
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

      if (data.resetLink) {
        setResetLink(data.resetLink);
      }
      
      toast({
        title: "Link gerado!",
        description: data.message || "Use o link abaixo para redefinir sua senha.",
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

  async function handleCopyLink() {
    if (resetLink) {
      await navigator.clipboard.writeText(resetLink);
      setCopied(true);
      toast({
        title: "Link copiado!",
        description: "Cole o link no navegador para redefinir sua senha.",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0F0C34]">
      <Card className="glass-card w-full max-w-md p-8 space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold font-accent text-white">Esqueci minha senha</h1>
          <p className="text-sm text-purple-light">
            Digite seu email e você receberá um link para redefinir sua senha.
          </p>
        </div>

        {!resetLink ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-muted" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-white/5 backdrop-blur-sm border-white/10 text-white placeholder:text-purple-muted focus-visible:ring-primary focus-visible:border-white/30"
                  data-testid="input-email"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full gradient-purple border border-primary shadow-purple"
              disabled={isLoading}
              data-testid="button-submit"
            >
              {isLoading ? "Enviando..." : "Enviar link de redefinição"}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="bg-primary/20 border border-primary/30 rounded-lg p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-5 w-5 text-primary" />
                <p className="text-sm font-medium text-white">
                  Link de reset gerado!
                </p>
              </div>
              <p className="text-xs text-purple-light mb-3">
                Copie e cole o link abaixo no navegador para redefinir sua senha:
              </p>
              <div className="bg-[#1F1B2E] border border-white/10 rounded-lg p-3 mb-3">
                <p className="text-xs text-white font-mono break-all">
                  {resetLink}
                </p>
              </div>
              <Button
                onClick={handleCopyLink}
                variant="outline"
                size="sm"
                className="w-full"
                data-testid="button-copy-link"
              >
                {copied ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar Link
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-purple-muted text-center">
              O link expira em 1 hora.
            </p>
            <Button
              onClick={() => {
                setResetLink("");
                setEmail("");
              }}
              variant="outline"
              className="w-full"
              data-testid="button-generate-another"
            >
              Gerar outro link
            </Button>
          </div>
        )}

        <div className="pt-4 border-t border-white/10">
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
