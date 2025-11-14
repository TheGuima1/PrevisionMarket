import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TrendingUp, BarChart3, Users, Zap, Shield } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [registerData, setRegisterData] = useState({ email: "", password: "", confirmPassword: "" });
  const [adminPassword, setAdminPassword] = useState("");
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);

  const adminLoginMutation = useMutation({
    mutationFn: async (password: string) => {
      const res = await apiRequest("POST", "/api/auth/admin-login", { password });
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/user"], data);
      setAdminDialogOpen(false);
      setAdminPassword("");
      setLocation("/admin");
    },
    onError: (error: any) => {
      toast({
        title: "Erro no login de administrador",
        description: error.message || "Senha incorreta",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(loginData);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (registerData.password !== registerData.confirmPassword) {
      return;
    }
    registerMutation.mutate({
      email: registerData.email,
      password: registerData.password,
    });
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    adminLoginMutation.mutate(adminPassword);
  };

  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="font-accent text-4xl font-bold bg-gradient-to-r from-brand-400 via-brand-500 to-brand-600 bg-clip-text text-transparent">
              Palpites.AI
            </h1>
            <p className="text-muted-foreground">
              Mercado de previsões brasileiro
            </p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" data-testid="tab-login">Entrar</TabsTrigger>
              <TabsTrigger value="register" data-testid="tab-register">Criar Conta</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Bem-vindo de volta!</CardTitle>
                  <CardDescription>Entre na sua conta para continuar</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={loginData.email}
                        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                        required
                        data-testid="input-login-email"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="login-password">Senha</Label>
                        <Link href="/forgot-password">
                          <span className="text-xs text-primary hover:underline cursor-pointer" data-testid="link-forgot-password">
                            Esqueci minha senha
                          </span>
                        </Link>
                      </div>
                      <Input
                        id="login-password"
                        type="password"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        required
                        data-testid="input-login-password"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loginMutation.isPending}
                      data-testid="button-login-submit"
                    >
                      {loginMutation.isPending ? "Entrando..." : "Entrar"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Crie sua conta</CardTitle>
                  <CardDescription>Junte-se ao mercado de previsões</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-email">E-mail</Label>
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={registerData.email}
                        onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                        required
                        data-testid="input-register-email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-password">Senha</Label>
                      <Input
                        id="register-password"
                        type="password"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                        required
                        data-testid="input-register-password"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-confirm-password">Confirmar Senha</Label>
                      <Input
                        id="register-confirm-password"
                        type="password"
                        value={registerData.confirmPassword}
                        onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                        required
                        data-testid="input-register-confirm-password"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={registerMutation.isPending || registerData.password !== registerData.confirmPassword}
                      data-testid="button-register-submit"
                    >
                      {registerMutation.isPending ? "Criando conta..." : "Criar Conta"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Dialog open={adminDialogOpen} onOpenChange={setAdminDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full gap-2 border-[var(--primary-blue)]/30 text-[var(--primary-blue)] hover:bg-[var(--glass-blue)]"
                data-testid="button-admin-access"
              >
                <Shield className="h-4 w-4" />
                Acesso Admin
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Acesso Administrativo</DialogTitle>
                <DialogDescription>
                  Digite a senha de administrador para acessar o painel
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-password">Senha de Administrador</Label>
                  <Input
                    id="admin-password"
                    type="password"
                    placeholder="Digite a senha"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                    data-testid="input-admin-password"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setAdminDialogOpen(false);
                      setAdminPassword("");
                    }}
                    data-testid="button-admin-cancel"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={adminLoginMutation.isPending}
                    data-testid="button-admin-login-submit"
                  >
                    {adminLoginMutation.isPending ? "Entrando..." : "Entrar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="hidden lg:flex items-center justify-center bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10 p-12">
        <div className="max-w-lg space-y-8">
          <div className="space-y-4">
            <h2 className="font-accent text-4xl font-bold">
              Aposte no Futuro do Brasil
            </h2>
            <p className="text-lg text-muted-foreground">
              Negocie previsões sobre política, economia, cultura, esportes e ciência
            </p>
          </div>

          <div className="grid gap-4">
            {[
              { icon: TrendingUp, title: "Mercados em tempo real", desc: "Preços refletem a sabedoria coletiva" },
              { icon: BarChart3, title: "Transparência total", desc: "Todas as transações são verificáveis" },
              { icon: Users, title: "Comunidade ativa", desc: "Discuta e analise com outros traders" },
              { icon: Zap, title: "Pix & Crypto", desc: "Depósitos e saques instantâneos" },
            ].map((feature) => (
              <div key={feature.title} className="flex gap-4 p-4 rounded-lg bg-background/50 backdrop-blur">
                <div className="bg-primary/10 p-3 rounded-lg shrink-0">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
