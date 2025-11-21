import { useState } from "react";
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
  const [location, setLocation] = useLocation();
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
      queryClient.setQueryData(["/api/user/profile"], data);
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
      {/* Left Side - Auth Forms */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="font-accent text-4xl font-bold text-white">
              Palpites.AI
            </h1>
            <p className="text-purple-light">
              Mercado de previsões brasileiro
            </p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 glass-card">
              <TabsTrigger value="login" data-testid="tab-login">Entrar</TabsTrigger>
              <TabsTrigger value="register" data-testid="tab-register">Criar Conta</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <div className="glass-card rounded-2xl p-6 space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-white">Bem-vindo de volta!</h3>
                  <p className="text-purple-light text-sm">Entre na sua conta para continuar</p>
                </div>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-purple-light">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      required
                      className="bg-white/5 border-white/10 text-white placeholder:text-purple-muted"
                      data-testid="input-login-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-password" className="text-purple-light">Senha</Label>
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
                      className="bg-white/5 border-white/10 text-white"
                      data-testid="input-login-password"
                    />
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full bg-gradient-purple text-white font-semibold shadow-purple border border-primary"
                    disabled={loginMutation.isPending}
                    data-testid="button-login-submit"
                  >
                    {loginMutation.isPending ? "Entrando..." : "Entrar"}
                  </Button>
                </form>
              </div>
            </TabsContent>

            <TabsContent value="register">
              <div className="glass-card rounded-2xl p-6 space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-white">Crie sua conta</h3>
                  <p className="text-purple-light text-sm">Junte-se ao mercado de previsões</p>
                </div>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-email" className="text-purple-light">E-mail</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                      required
                      className="bg-white/5 border-white/10 text-white placeholder:text-purple-muted"
                      data-testid="input-register-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password" className="text-purple-light">Senha</Label>
                    <Input
                      id="register-password"
                      type="password"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      required
                      className="bg-white/5 border-white/10 text-white"
                      data-testid="input-register-password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-confirm-password" className="text-purple-light">Confirmar Senha</Label>
                    <Input
                      id="register-confirm-password"
                      type="password"
                      value={registerData.confirmPassword}
                      onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                      required
                      className="bg-white/5 border-white/10 text-white"
                      data-testid="input-register-confirm-password"
                    />
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full bg-gradient-purple text-white font-semibold shadow-purple border border-primary"
                    disabled={registerMutation.isPending || registerData.password !== registerData.confirmPassword}
                    data-testid="button-register-submit"
                  >
                    {registerMutation.isPending ? "Criando conta..." : "Criar Conta"}
                  </Button>
                </form>
              </div>
            </TabsContent>
          </Tabs>

          <Dialog open={adminDialogOpen} onOpenChange={setAdminDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full gap-2 border-white/20 text-white"
                data-testid="button-admin-access"
              >
                <Shield className="h-4 w-4" />
                Acesso Admin
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card border-white/10">
              <DialogHeader>
                <DialogTitle className="text-white">Acesso Administrativo</DialogTitle>
                <DialogDescription className="text-purple-light">
                  Digite a senha de administrador para acessar o painel
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-password" className="text-purple-light">Senha de Administrador</Label>
                  <Input
                    id="admin-password"
                    type="password"
                    placeholder="Digite a senha"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                    className="bg-white/5 border-white/10 text-white"
                    data-testid="input-admin-password"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 border-white/20 text-white"
                    onClick={() => {
                      setAdminDialogOpen(false);
                      setAdminPassword("");
                    }}
                    data-testid="button-admin-cancel"
                  >
                    Cancelar
                  </Button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-purple text-white py-2 rounded-xl font-semibold"
                    disabled={adminLoginMutation.isPending}
                    data-testid="button-admin-login-submit"
                  >
                    {adminLoginMutation.isPending ? "Entrando..." : "Entrar"}
                  </button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Right Side - Features */}
      <div className="hidden lg:flex items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-purple-radial opacity-20"></div>
        <div className="max-w-lg space-y-8 relative z-10">
          <div className="space-y-4">
            <h2 className="font-accent text-4xl font-bold text-white">
              Aposte no Futuro do Brasil
            </h2>
            <p className="text-lg text-purple-light">
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
              <div key={feature.title} className="flex gap-4 p-4 rounded-xl glass-card">
                <div className="bg-gradient-purple/30 p-3 rounded-lg shrink-0">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{feature.title}</h3>
                  <p className="text-sm text-purple-light">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
