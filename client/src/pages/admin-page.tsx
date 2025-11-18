import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Market, Transaction } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  CreditCard,
  Wallet,
  Users,
  TrendingUp,
  Bell,
  FileText,
  Settings,
  CheckCircle,
  XCircle,
  ExternalLink,
  Download,
  Clock,
  ChevronRight,
  PlusCircle,
  Link2,
  Trash2,
  AlertCircle,
  DollarSign,
  CircleDollarSign,
  LogOut,
} from "lucide-react";
import { formatBRL3, formatDateTimeBR } from "@shared/utils/currency";

// Interfaces
interface PendingDeposit {
  id: string;
  userId: string;
  amount: string;
  currency: string;
  proofFilePath: string | null;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
  user: {
    username: string;
    email: string;
  };
}

interface AdminUser {
  id: string;
  username: string;
  email: string;
  balanceBrl: string;
  balanceUsdc: string;
  isAdmin: boolean;
  createdAt: Date;
}

interface UserDetails {
  user: AdminUser;
  transactions: Transaction[];
}

interface PolymarketPreview {
  valid: boolean;
  slug?: string;
  title?: string;
  probYes?: number;
  probNo?: number;
  volumeUsd?: number;
  error?: string;
}

type AdminView = 
  | "depositos" 
  | "saques" 
  | "saldos" 
  | "mercados" 
  | "polymarket" 
  | "usuarios" 
  | "historico" 
  | "notificacoes" 
  | "relatorios" 
  | "configuracoes";

export default function AdminPage() {
  const { toast } = useToast();
  const [currentView, setCurrentView] = useState<AdminView>("depositos");
  const [selectedDeposit, setSelectedDeposit] = useState<PendingDeposit | null>(null);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  
  // Market creation state
  const [newMarket, setNewMarket] = useState({
    title: "",
    description: "",
    category: "politica" as const,
    resolutionSource: "",
    endDate: "",
  });

  // Polymarket mirror state
  const [polySlug, setPolySlug] = useState("");
  const [polyPreview, setPolyPreview] = useState<PolymarketPreview | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Queries
  const { data: adminUser } = useQuery<AdminUser>({
    queryKey: ["/api/user/profile"],
  });

  const { data: markets } = useQuery<Market[]>({
    queryKey: ["/api/admin/markets"],
  });

  const { data: pendingDeposits } = useQuery<PendingDeposit[]>({
    queryKey: ["/api/deposits/pending"],
    refetchInterval: 30000,
  });

  const { data: pendingWithdrawals } = useQuery<any[]>({
    queryKey: ["/api/withdrawals/pending"],
    refetchInterval: 30000,
  });

  const { data: allUsers } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
    refetchInterval: 60000,
  });

  const { data: userDetails } = useQuery<UserDetails>({
    queryKey: ["/api/admin/users", selectedUserId],
    enabled: !!selectedUserId,
  });

  // Mutations
  const approveDepositMutation = useMutation({
    mutationFn: async (depositId: string) => {
      const res = await apiRequest("POST", `/api/deposits/${depositId}/approve`, {});
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Depósito aprovado!",
        description: "BRL3 foi creditado na carteira do usuário.",
      });
      setSelectedDeposit(null);
      queryClient.invalidateQueries({ queryKey: ["/api/deposits/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao aprovar depósito",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const rejectDepositMutation = useMutation({
    mutationFn: async ({ depositId, reason }: { depositId: string; reason?: string }) => {
      const res = await apiRequest("POST", `/api/deposits/${depositId}/reject`, { reason });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Depósito rejeitado",
        description: "O usuário foi notificado sobre a rejeição.",
      });
      setSelectedDeposit(null);
      queryClient.invalidateQueries({ queryKey: ["/api/deposits/pending"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao rejeitar depósito",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const approveWithdrawalMutation = useMutation({
    mutationFn: async (withdrawalId: string) => {
      const res = await apiRequest("POST", `/api/withdrawals/${withdrawalId}/approve`, {});
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Saque aprovado!",
        description: "BRL3 foi queimado e saldo atualizado.",
      });
      setSelectedWithdrawal(null);
      queryClient.invalidateQueries({ queryKey: ["/api/withdrawals/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao aprovar saque",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const rejectWithdrawalMutation = useMutation({
    mutationFn: async ({ withdrawalId, reason }: { withdrawalId: string; reason?: string }) => {
      const res = await apiRequest("POST", `/api/withdrawals/${withdrawalId}/reject`, { reason });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Saque rejeitado",
        description: "O usuário foi notificado sobre a rejeição.",
      });
      setSelectedWithdrawal(null);
      queryClient.invalidateQueries({ queryKey: ["/api/withdrawals/pending"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao rejeitar saque",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createMarketMutation = useMutation({
    mutationFn: async (market: typeof newMarket) => {
      const res = await apiRequest("POST", "/api/admin/markets", market);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Mercado criado!",
        description: "O mercado foi publicado com sucesso",
      });
      setNewMarket({
        title: "",
        description: "",
        category: "politica",
        resolutionSource: "",
        endDate: "",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/markets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/markets"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar mercado",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resolveMarketMutation = useMutation({
    mutationFn: async ({
      marketId,
      outcome,
    }: {
      marketId: string;
      outcome: "YES" | "NO";
    }) => {
      const res = await apiRequest("POST", `/api/admin/markets/${marketId}/resolve`, {
        outcome,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Mercado resolvido!",
        description: "Os vencedores receberão seus pagamentos automaticamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/markets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/markets"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao resolver mercado",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createMirrorMarketMutation = useMutation({
    mutationFn: async (data: { polymarketSlug: string; title?: string; description?: string }) => {
      const res = await apiRequest("POST", "/api/admin/markets/mirror", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Mercado espelhado criado!",
        description: "O mercado do Polymarket foi adicionado e já está sincronizando.",
      });
      setPolySlug("");
      setPolyPreview(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/markets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/markets"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar mercado espelhado",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMarketMutation = useMutation({
    mutationFn: async (marketId: string) => {
      const res = await apiRequest("DELETE", `/api/admin/markets/${marketId}`, {});
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Mercado removido!",
        description: "O mercado foi excluído com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/markets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/markets"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao remover mercado",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const [, setLocation] = useLocation();

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/logout", {});
      return res;
    },
    onSuccess: () => {
      toast({
        title: "Logout realizado",
        description: "Você saiu da área administrativa.",
      });
      queryClient.clear();
      setLocation("/auth");
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao fazer logout",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handlers
  const handleValidateSlug = async () => {
    if (!polySlug.trim()) {
      setPolyPreview(null);
      return;
    }

    setIsValidating(true);
    try {
      const res = await apiRequest("POST", "/api/admin/markets/validate-slug", { slug: polySlug.trim() });
      const data = await res.json();
      setPolyPreview(data);
    } catch (error: any) {
      setPolyPreview({
        valid: false,
        error: error.message || "Erro ao validar slug",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleCreateMirrorMarket = () => {
    if (!polyPreview?.valid || !polyPreview.slug) return;
    
    createMirrorMarketMutation.mutate({
      polymarketSlug: polyPreview.slug,
      title: polyPreview.title,
    });
  };

  const handleCreateMarket = (e: React.FormEvent) => {
    e.preventDefault();
    createMarketMutation.mutate(newMarket);
  };

  const pendingCount = pendingDeposits?.filter(d => d.status === "pending").length || 0;
  const pendingMarkets = markets?.filter(m => m.status === "active" && new Date(m.endDate) < new Date());
  
  const menuItems = [
    { id: "depositos" as AdminView, label: "Depósitos", icon: CreditCard, badge: pendingCount },
    { id: "saques" as AdminView, label: "Saques", icon: CircleDollarSign },
    { id: "saldos" as AdminView, label: "Saldos dos Usuários", icon: DollarSign },
    { id: "mercados" as AdminView, label: "Mercados", icon: TrendingUp },
    { id: "polymarket" as AdminView, label: "Polymarket Oráculo", icon: Link2 },
    { id: "usuarios" as AdminView, label: "Usuários", icon: Users, badge: allUsers?.length },
    { id: "historico" as AdminView, label: "Histórico / Logs", icon: FileText },
    { id: "notificacoes" as AdminView, label: "Notificações", icon: Bell },
    { id: "relatorios" as AdminView, label: "Relatórios", icon: FileText },
    { id: "configuracoes" as AdminView, label: "Configurações", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#1F1B2E] flex">
      {/* Sidebar */}
      <div className="w-72 bg-[#2A2640] border-r border-white/5 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <div className="w-6 h-6 rounded-full border-4 border-white/90" />
            </div>
            <h1 className="text-white font-bold text-xl">Palpites.AI</h1>
          </div>
        </div>

        {/* Título */}
        <div className="px-6 py-4 border-b border-white/5">
          <h2 className="text-white/70 text-sm font-medium">AO Panteel Administrativo</h2>
        </div>

        {/* Menu */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              data-testid={`nav-${item.id}`}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors
                ${currentView === item.id 
                  ? "bg-primary/20 text-white" 
                  : "text-white/60 hover:text-white hover:bg-white/5"
                }
              `}
            >
              <item.icon className="w-5 h-5 text-primary shrink-0" />
              <span className="flex-1 font-medium">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <Badge variant="secondary" className="bg-primary text-white">
                  {item.badge}
                </Badge>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-[#2A2640] border-b border-white/5 px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Button variant="ghost" className="text-white/80 hover:text-white gap-2" size="sm" data-testid="button-admin-balance">
              Saldo da Carteira Admin:
              <span className="font-mono font-bold text-white">
                {formatBRL3(adminUser?.balanceBrl || "0")}
              </span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-white/60">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              Status, Conectado 3 JBitX
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              className="text-white/80 hover:text-white gap-2"
              data-testid="button-admin-logout"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8">
          {/* Depósitos Pendentes */}
          {currentView === "depositos" && (
            <div className="space-y-6">
              <h1 className="text-white text-3xl font-bold">Depósitos Pendentes</h1>

              <Card className="bg-[#2A2640] border-white/10 overflow-hidden">
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                  <h3 className="text-white font-semibold text-lg">Depósitos Pendentes</h3>
                  <ChevronRight className="w-5 h-5 text-white/40" />
                </div>

                {/* Tabela */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#1F1B2E]/50">
                      <tr className="text-white/60 text-sm">
                        <th className="px-6 py-4 text-left font-medium">Usuário</th>
                        <th className="px-6 py-4 text-left font-medium">Valor PIX</th>
                        <th className="px-6 py-4 text-left font-medium">Comprovante</th>
                        <th className="px-6 py-4 text-left font-medium">Data/Hora</th>
                        <th className="px-6 py-4 text-left font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {pendingDeposits?.filter(d => d.status === "pending").map((deposit) => (
                        <tr
                          key={deposit.id}
                          onClick={() => setSelectedDeposit(deposit)}
                          className={`
                            cursor-pointer transition-colors
                            ${selectedDeposit?.id === deposit.id 
                              ? "bg-primary/10" 
                              : "hover:bg-white/5"
                            }
                          `}
                          data-testid={`deposit-row-${deposit.id}`}
                        >
                          <td className="px-6 py-4 text-white">{deposit.user.username}</td>
                          <td className="px-6 py-4 text-white font-mono">
                            {formatBRL3(deposit.amount)}
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-primary underline text-sm">ver img</span>
                          </td>
                          <td className="px-6 py-4 text-white/60 text-sm">
                            {new Date(deposit.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-500 border-yellow-500/20">
                              PENDENTE
                            </Badge>
                          </td>
                        </tr>
                      ))}
                      {(!pendingDeposits || pendingDeposits.filter(d => d.status === "pending").length === 0) && (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-white/40">
                            Nenhum depósito pendente no momento
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Detalhes do comprovante */}
              {selectedDeposit && (
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Comprovante Info */}
                  <Card className="bg-[#2A2640] border-white/10 p-6">
                    <h3 className="text-white font-semibold mb-6">Comprovante</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-white text-2xl font-bold">{selectedDeposit.user.username}</p>
                        <p className="text-white/60 text-sm">{selectedDeposit.user.email}</p>
                      </div>
                      
                      <Separator className="bg-white/10" />
                      
                      <div className="flex items-center justify-between">
                        <span className="text-white/60">Valor</span>
                        <span className="text-white font-mono text-xl font-bold">
                          {formatBRL3(selectedDeposit.amount)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-white/60">Data</span>
                        <span className="text-white">
                          {formatDateTimeBR(new Date(selectedDeposit.createdAt))}
                        </span>
                      </div>

                      <Button
                        variant="ghost"
                        className="w-full text-primary hover:text-primary hover:bg-primary/10 gap-2"
                        asChild
                        data-testid="button-download-proof"
                      >
                        <a
                          href={`/api/deposits/${selectedDeposit.id}/proof`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Download className="w-4 h-4" />
                          Baixar Comprovante
                        </a>
                      </Button>
                    </div>
                  </Card>

                  {/* Preview */}
                  <Card className="bg-white border-white/10 p-6">
                    <h3 className="text-gray-900 font-semibold mb-4">Comprovante de depósito</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-gray-900 font-semibold text-lg">
                          {selectedDeposit.user.username}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-900 font-mono text-2xl font-bold">
                          {formatBRL3(selectedDeposit.amount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">
                          {formatDateTimeBR(new Date(selectedDeposit.createdAt))}
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              {/* Botões de ação */}
              {selectedDeposit && (
                <div className="flex gap-4">
                  <Button
                    size="lg"
                    className="flex-1 bg-primary hover:bg-primary/90 text-white gap-2"
                    onClick={() => approveDepositMutation.mutate(selectedDeposit.id)}
                    disabled={approveDepositMutation.isPending}
                    data-testid="button-approve-deposit"
                  >
                    <CheckCircle className="w-5 h-5" />
                    APROVAR → Mint BRL3
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="flex-1 border-white/20 text-white hover:bg-white/5"
                    onClick={() => {
                      if (confirm("Tem certeza que deseja recusar este depósito?")) {
                        rejectDepositMutation.mutate({ depositId: selectedDeposit.id });
                      }
                    }}
                    disabled={rejectDepositMutation.isPending}
                    data-testid="button-reject-deposit"
                  >
                    <XCircle className="w-5 h-5" />
                    RECUSAR
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* View: Saques */}
          {currentView === "saques" && (
            <div className="space-y-6">
              <h1 className="text-white text-3xl font-bold">Saques Pendentes</h1>

              <Card className="bg-[#2A2640] border-white/10 overflow-hidden">
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                  <h3 className="text-white font-semibold text-lg">Saques Pendentes</h3>
                  <ChevronRight className="w-5 h-5 text-white/40" />
                </div>

                {/* Tabela */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#1F1B2E]/50">
                      <tr className="text-white/60 text-sm">
                        <th className="px-6 py-4 text-left font-medium">Usuário</th>
                        <th className="px-6 py-4 text-left font-medium">Valor</th>
                        <th className="px-6 py-4 text-left font-medium">Chave PIX</th>
                        <th className="px-6 py-4 text-left font-medium">Data/Hora</th>
                        <th className="px-6 py-4 text-left font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {pendingWithdrawals?.filter(w => w.status === "pending").map((withdrawal) => (
                        <tr
                          key={withdrawal.id}
                          onClick={() => setSelectedWithdrawal(withdrawal)}
                          className={`
                            cursor-pointer transition-colors
                            ${selectedWithdrawal?.id === withdrawal.id 
                              ? "bg-primary/10" 
                              : "hover:bg-white/5"
                            }
                          `}
                          data-testid={`withdrawal-row-${withdrawal.id}`}
                        >
                          <td className="px-6 py-4 text-white">{withdrawal.user.username}</td>
                          <td className="px-6 py-4 text-white font-mono">
                            {formatBRL3(withdrawal.amount)}
                          </td>
                          <td className="px-6 py-4 text-white/60 text-sm font-mono">
                            {withdrawal.pixKey}
                          </td>
                          <td className="px-6 py-4 text-white/60 text-sm">
                            {new Date(withdrawal.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-500 border-yellow-500/20">
                              PENDENTE
                            </Badge>
                          </td>
                        </tr>
                      ))}
                      {!pendingWithdrawals || pendingWithdrawals.filter(w => w.status === "pending").length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-white/40">
                            Nenhum saque pendente
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Detalhes do Saque */}
              {selectedWithdrawal && (
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Informações do Saque */}
                  <Card className="bg-[#2A2640] border-white/10 p-6">
                    <h3 className="text-white font-semibold mb-6">Informações do Saque</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-white text-2xl font-bold">{selectedWithdrawal.user.username}</p>
                        <p className="text-white/60 text-sm">{selectedWithdrawal.user.email}</p>
                      </div>
                      
                      <Separator className="bg-white/10" />
                      
                      <div className="flex items-center justify-between">
                        <span className="text-white/60">Valor</span>
                        <span className="text-white font-mono text-xl font-bold">
                          {formatBRL3(selectedWithdrawal.amount)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-white/60">Data</span>
                        <span className="text-white">
                          {formatDateTimeBR(new Date(selectedWithdrawal.createdAt))}
                        </span>
                      </div>

                      <div className="flex flex-col gap-2">
                        <span className="text-white/60">Chave PIX</span>
                        <div className="bg-[#1F1B2E] border border-white/10 rounded-lg p-3">
                          <p className="text-white font-mono text-sm break-all">
                            {selectedWithdrawal.pixKey}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Preview */}
                  <Card className="bg-white border-white/10 p-6">
                    <h3 className="text-gray-900 font-semibold mb-4">Resumo do Saque</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-gray-900 font-semibold text-lg">
                          {selectedWithdrawal.user.username}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-900 font-mono text-2xl font-bold">
                          {formatBRL3(selectedWithdrawal.amount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">
                          {formatDateTimeBR(new Date(selectedWithdrawal.createdAt))}
                        </p>
                      </div>
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-xs text-yellow-800">
                          ⚠️ Ao aprovar, BRL3 será queimado e o saldo do usuário será reduzido.
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              {/* Botões de ação */}
              {selectedWithdrawal && (
                <div className="flex gap-4">
                  <Button
                    size="lg"
                    className="flex-1 bg-primary hover:bg-primary/90 text-white gap-2"
                    onClick={() => approveWithdrawalMutation.mutate(selectedWithdrawal.id)}
                    disabled={approveWithdrawalMutation.isPending}
                    data-testid="button-approve-withdrawal"
                  >
                    <CheckCircle className="w-5 h-5" />
                    APROVAR → Burn BRL3
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="flex-1 border-white/20 text-white hover:bg-white/5"
                    onClick={() => {
                      if (confirm("Tem certeza que deseja recusar este saque?")) {
                        rejectWithdrawalMutation.mutate({ withdrawalId: selectedWithdrawal.id });
                      }
                    }}
                    disabled={rejectWithdrawalMutation.isPending}
                    data-testid="button-reject-withdrawal"
                  >
                    <XCircle className="w-5 h-5" />
                    RECUSAR
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* View: Mercados */}
          {currentView === "mercados" && (
            <div className="space-y-6">
              <h1 className="text-white text-3xl font-bold">Gerenciar Mercados</h1>

              {/* Criar Novo Mercado */}
              <Card className="bg-[#2A2640] border-white/10">
                <div className="p-6 border-b border-white/10">
                  <h3 className="text-white font-semibold text-lg">Criar Novo Mercado</h3>
                </div>
                <div className="p-6">
                  <form onSubmit={handleCreateMarket} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-white">Título do Mercado</Label>
                      <Input
                        id="title"
                        placeholder="Ex: Lula vencerá as eleições de 2026?"
                        value={newMarket.title}
                        onChange={(e) => setNewMarket({ ...newMarket, title: e.target.value })}
                        required
                        data-testid="input-market-title"
                        className="bg-[#1F1B2E] border-white/10 text-white placeholder:text-white/40"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-white">Descrição</Label>
                      <Textarea
                        id="description"
                        placeholder="Descreva os critérios de resolução e detalhes importantes..."
                        value={newMarket.description}
                        onChange={(e) => setNewMarket({ ...newMarket, description: e.target.value })}
                        className="min-h-32 bg-[#1F1B2E] border-white/10 text-white placeholder:text-white/40"
                        required
                        data-testid="textarea-market-description"
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="category" className="text-white">Categoria</Label>
                        <Select
                          value={newMarket.category}
                          onValueChange={(value: any) => setNewMarket({ ...newMarket, category: value })}
                        >
                          <SelectTrigger data-testid="select-market-category" className="bg-[#1F1B2E] border-white/10 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#2A2640] border-white/10">
                            <SelectItem value="politica">Política</SelectItem>
                            <SelectItem value="economia">Economia</SelectItem>
                            <SelectItem value="cultura">Cultura</SelectItem>
                            <SelectItem value="esportes">Esportes</SelectItem>
                            <SelectItem value="ciencia">Ciência</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="endDate" className="text-white">Data de Encerramento</Label>
                        <Input
                          id="endDate"
                          type="datetime-local"
                          value={newMarket.endDate}
                          onChange={(e) => setNewMarket({ ...newMarket, endDate: e.target.value })}
                          required
                          data-testid="input-market-enddate"
                          className="bg-[#1F1B2E] border-white/10 text-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="resolutionSource" className="text-white">Fonte de Resolução (opcional)</Label>
                      <Input
                        id="resolutionSource"
                        placeholder="Ex: Resultado oficial do TSE"
                        value={newMarket.resolutionSource}
                        onChange={(e) => setNewMarket({ ...newMarket, resolutionSource: e.target.value })}
                        data-testid="input-market-resolution-source"
                        className="bg-[#1F1B2E] border-white/10 text-white placeholder:text-white/40"
                      />
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      disabled={createMarketMutation.isPending}
                      data-testid="button-create-market"
                      className="bg-primary hover:bg-primary/90 text-white"
                    >
                      <PlusCircle className="w-5 h-5 mr-2" />
                      {createMarketMutation.isPending ? "Criando..." : "Criar Mercado"}
                    </Button>
                  </form>
                </div>
              </Card>

              {/* Mercados para Resolver */}
              {pendingMarkets && pendingMarkets.length > 0 && (
                <Card className="bg-[#2A2640] border-white/10">
                  <div className="p-6 border-b border-white/10 flex items-center justify-between">
                    <h3 className="text-white font-semibold text-lg">Mercados Aguardando Resolução</h3>
                    <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-500">
                      {pendingMarkets.length}
                    </Badge>
                  </div>
                  <div className="p-6 space-y-4">
                    {pendingMarkets.map((market) => (
                      <Card key={market.id} className="bg-[#1F1B2E] border-white/10 p-4">
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-white font-semibold mb-2">{market.title}</h4>
                            <p className="text-white/60 text-sm">{market.description}</p>
                          </div>
                          
                          <Separator className="bg-white/10" />
                          
                          <div className="flex gap-3">
                            <Button
                              onClick={() => {
                                if (confirm(`Resolver como SIM: "${market.title}"?`)) {
                                  resolveMarketMutation.mutate({ marketId: market.id, outcome: "YES" });
                                }
                              }}
                              disabled={resolveMarketMutation.isPending}
                              className="flex-1 bg-primary hover:bg-primary/90 text-white"
                              data-testid={`button-resolve-yes-${market.id}`}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Resolver como SIM
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                if (confirm(`Resolver como NÃO: "${market.title}"?`)) {
                                  resolveMarketMutation.mutate({ marketId: market.id, outcome: "NO" });
                                }
                              }}
                              disabled={resolveMarketMutation.isPending}
                              className="flex-1 border-white/20 text-white hover:bg-white/5"
                              data-testid={`button-resolve-no-${market.id}`}
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Resolver como NÃO
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </Card>
              )}

              {/* Todos os Mercados */}
              <Card className="bg-[#2A2640] border-white/10">
                <div className="p-6 border-b border-white/10">
                  <h3 className="text-white font-semibold text-lg">Todos os Mercados</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#1F1B2E]/50">
                      <tr className="text-white/60 text-sm">
                        <th className="px-6 py-4 text-left font-medium">Título</th>
                        <th className="px-6 py-4 text-left font-medium">Categoria</th>
                        <th className="px-6 py-4 text-left font-medium">Status</th>
                        <th className="px-6 py-4 text-left font-medium">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {markets?.map((market) => (
                        <tr key={market.id} className="hover:bg-white/5" data-testid={`market-row-${market.id}`}>
                          <td className="px-6 py-4 text-white">{market.title}</td>
                          <td className="px-6 py-4">
                            <Badge variant="outline" className="border-white/20 text-white">
                              {market.category}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <Badge 
                              variant="secondary" 
                              className={
                                market.status === "active" 
                                  ? "bg-green-500/20 text-green-500" 
                                  : "bg-white/10 text-white/60"
                              }
                            >
                              {market.status === "active" ? "Ativo" : "Resolvido"}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm(`Remover mercado "${market.title}"?`)) {
                                  deleteMarketMutation.mutate(market.id);
                                }
                              }}
                              disabled={deleteMarketMutation.isPending}
                              className="text-white/60 hover:text-white"
                              data-testid={`button-delete-market-${market.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {(!markets || markets.length === 0) && (
                        <tr>
                          <td colSpan={4} className="px-6 py-12 text-center text-white/40">
                            Nenhum mercado criado ainda
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* View: Polymarket */}
          {currentView === "polymarket" && (
            <div className="space-y-6">
              <h1 className="text-white text-3xl font-bold">Polymarket Oráculo</h1>

              <Card className="bg-[#2A2640] border-white/10">
                <div className="p-6 border-b border-white/10">
                  <h3 className="text-white font-semibold text-lg">Espelhar Mercado do Polymarket</h3>
                  <p className="text-white/60 text-sm mt-1">
                    Adicione mercados do Polymarket com sincronização automática de odds
                  </p>
                </div>

                <div className="p-6 space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="polySlug" className="text-white">Slug do Polymarket</Label>
                    <div className="flex gap-2">
                      <Input
                        id="polySlug"
                        placeholder="Ex: us-recession-in-2025"
                        value={polySlug}
                        onChange={(e) => setPolySlug(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleValidateSlug();
                          }
                        }}
                        data-testid="input-poly-slug"
                        className="bg-[#1F1B2E] border-white/10 text-white placeholder:text-white/40"
                      />
                      <Button
                        type="button"
                        onClick={handleValidateSlug}
                        disabled={isValidating || !polySlug.trim()}
                        data-testid="button-validate-slug"
                        className="bg-primary hover:bg-primary/90 text-white"
                      >
                        {isValidating ? "Validando..." : "Validar"}
                      </Button>
                    </div>
                    <p className="text-xs text-white/40">
                      Cole o slug do mercado do Polymarket (última parte da URL)
                    </p>
                  </div>

                  {polyPreview && !polyPreview.valid && (
                    <Alert variant="destructive" data-testid="alert-invalid-slug" className="bg-red-500/10 border-red-500/20">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-white">
                        {polyPreview.error || "Slug inválido ou mercado não encontrado"}
                      </AlertDescription>
                    </Alert>
                  )}

                  {polyPreview && polyPreview.valid && (
                    <Card className="bg-[#1F1B2E] border-white/10 p-4 space-y-4" data-testid="card-poly-preview">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-white/60 mb-1">
                              Título do Mercado
                            </p>
                            <p className="font-medium text-white">{polyPreview.title}</p>
                          </div>
                          <Badge variant="outline" className="shrink-0 bg-green-500/10 border-green-500/20 text-green-500">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Válido
                          </Badge>
                        </div>
                        
                        <Separator className="bg-white/10" />
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-white/60 mb-1">Odds YES</p>
                            <p className="text-2xl font-mono font-bold text-primary">
                              {((polyPreview.probYes || 0) * 100).toFixed(1)}%
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-white/60 mb-1">Odds NO</p>
                            <p className="text-2xl font-mono font-bold text-red-500">
                              {((polyPreview.probNo || 0) * 100).toFixed(1)}%
                            </p>
                          </div>
                        </div>

                        {polyPreview.volumeUsd && (
                          <div>
                            <p className="text-sm text-white/60">Volume Polymarket</p>
                            <p className="text-lg font-mono text-white">
                              ${(polyPreview.volumeUsd / 1000000).toFixed(2)}M
                            </p>
                          </div>
                        )}
                      </div>

                      <Button
                        onClick={handleCreateMirrorMarket}
                        disabled={createMirrorMarketMutation.isPending}
                        size="lg"
                        className="w-full bg-primary hover:bg-primary/90 text-white"
                        data-testid="button-create-mirror-market"
                      >
                        <Link2 className="w-4 h-4 mr-2" />
                        {createMirrorMarketMutation.isPending ? "Criando..." : "Criar Mercado Espelhado"}
                      </Button>
                    </Card>
                  )}

                  <Alert className="bg-[#1F1B2E] border-white/10">
                    <AlertDescription className="text-sm space-y-2">
                      <p className="font-semibold text-white">Como funciona:</p>
                      <ul className="list-disc list-inside space-y-1 text-white/60">
                        <li>Mercados espelhados sincronizam odds automaticamente a cada 60s</li>
                        <li>Você pode personalizar título e descrição em PT-BR</li>
                        <li>Odds do Polymarket + 2% spread transparente na execução</li>
                        <li>Resolução manual pelo admin quando o evento ocorrer</li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                </div>
              </Card>

              <Card className="bg-[#2A2640] border-white/10">
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-white">Mercados Espelhados Ativos</h4>
                    <p className="text-sm text-white/60 mt-1">
                      {markets?.filter(m => m.origin === "polymarket").length || 0} mercados sincronizando
                    </p>
                  </div>
                </div>

                <div className="p-6 space-y-3">
                  {markets?.filter(m => m.origin === "polymarket").map(market => (
                    <div
                      key={market.id}
                      className="flex items-center justify-between p-4 bg-[#1F1B2E] border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
                      data-testid={`market-row-${market.id}`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white truncate">{market.title}</p>
                        <p className="text-sm text-white/60">
                          Slug: {market.polymarketSlug}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Remover mercado "${market.title}"?`)) {
                            deleteMarketMutation.mutate(market.id);
                          }
                        }}
                        disabled={deleteMarketMutation.isPending}
                        className="border-white/20 text-white hover:bg-white/5"
                        data-testid={`button-delete-market-${market.id}`}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remover
                      </Button>
                    </div>
                  ))}
                  
                  {markets?.filter(m => m.origin === "polymarket").length === 0 && (
                    <div className="text-center py-8 text-white/40">
                      Nenhum mercado espelhado ainda. Adicione um acima!
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* View: Usuários */}
          {currentView === "usuarios" && (
            <div className="space-y-6">
              <h1 className="text-white text-3xl font-bold">Gerenciar Usuários</h1>

              <Card className="bg-[#2A2640] border-white/10 overflow-hidden">
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                  <h3 className="text-white font-semibold text-lg">Todos os Usuários</h3>
                  <Badge variant="secondary" className="bg-primary/20 text-primary">
                    {allUsers?.length || 0} usuários
                  </Badge>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#1F1B2E]/50">
                      <tr className="text-white/60 text-sm">
                        <th className="px-6 py-4 text-left font-medium">Usuário</th>
                        <th className="px-6 py-4 text-left font-medium">Email</th>
                        <th className="px-6 py-4 text-left font-medium">Saldo BRL3</th>
                        <th className="px-6 py-4 text-left font-medium">Cadastro</th>
                        <th className="px-6 py-4 text-left font-medium">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {allUsers?.map((user) => (
                        <tr
                          key={user.id}
                          className="hover:bg-white/5 cursor-pointer transition-colors"
                          onClick={() => setSelectedUserId(user.id)}
                          data-testid={`user-row-${user.id}`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                <span className="text-primary font-semibold text-sm">
                                  {user.username.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <span className="text-white font-medium">{user.username}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-white/60">{user.email}</td>
                          <td className="px-6 py-4">
                            <span className="text-white font-mono font-semibold">
                              {formatBRL3(user.balanceBrl)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-white/60 text-sm">
                            {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-6 py-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedUserId(user.id);
                              }}
                              className="text-primary hover:text-primary"
                              data-testid={`button-view-user-${user.id}`}
                            >
                              Ver Detalhes
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {(!allUsers || allUsers.length === 0) && (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-white/40">
                            Nenhum usuário cadastrado
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Detalhes do Usuário Selecionado */}
              {selectedUserId && userDetails && (
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="bg-[#2A2640] border-white/10 p-6">
                    <h3 className="text-white font-semibold text-lg mb-4">Informações do Usuário</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-white/60 text-sm mb-1">Nome de Usuário</p>
                        <p className="text-white font-semibold text-xl">{userDetails.user.username}</p>
                      </div>

                      <Separator className="bg-white/10" />

                      <div>
                        <p className="text-white/60 text-sm mb-1">Email</p>
                        <p className="text-white">{userDetails.user.email}</p>
                      </div>

                      <Separator className="bg-white/10" />

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-white/60 text-sm mb-1">Saldo BRL3</p>
                          <p className="text-white font-mono font-bold text-lg">
                            {formatBRL3(userDetails.user.balanceBrl)}
                          </p>
                        </div>
                        <div>
                          <p className="text-white/60 text-sm mb-1">Saldo USDC</p>
                          <p className="text-white font-mono font-bold text-lg">
                            {formatBRL3(userDetails.user.balanceUsdc)}
                          </p>
                        </div>
                      </div>

                      <Separator className="bg-white/10" />

                      <div>
                        <p className="text-white/60 text-sm mb-1">Cadastrado em</p>
                        <p className="text-white">{formatDateTimeBR(new Date(userDetails.user.createdAt))}</p>
                      </div>

                      {userDetails.user.isAdmin && (
                        <>
                          <Separator className="bg-white/10" />
                          <Badge className="bg-primary/20 text-primary border-primary/20">
                            Administrador
                          </Badge>
                        </>
                      )}
                    </div>
                  </Card>

                  <Card className="bg-[#2A2640] border-white/10 p-6">
                    <h3 className="text-white font-semibold text-lg mb-4">Transações Recentes</h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {userDetails.transactions.map((tx) => (
                        <div
                          key={tx.id}
                          className="p-3 bg-[#1F1B2E] border border-white/10 rounded-lg"
                          data-testid={`transaction-${tx.id}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="text-white text-sm font-medium">
                                {tx.type === "deposit_pix" && "Depósito PIX"}
                                {tx.type === "deposit_usdc" && "Depósito USDC"}
                                {tx.type === "withdrawal_pix" && "Saque PIX"}
                                {tx.type === "withdrawal_usdc" && "Saque USDC"}
                                {tx.type === "trade_buy" && "Compra"}
                                {tx.type === "trade_sell" && "Venda"}
                                {tx.type === "market_resolution" && "Resolução de Mercado"}
                                {tx.type === "platform_fee" && "Taxa da Plataforma"}
                              </p>
                              <p className="text-white/60 text-xs mt-1">
                                {new Date(tx.createdAt).toLocaleString('pt-BR')}
                              </p>
                            </div>
                            <p className={`font-mono font-bold text-sm ${
                              tx.type.startsWith("deposit") || tx.type === "market_resolution"
                                ? "text-green-500" 
                                : "text-red-500"
                            }`}>
                              {tx.type.startsWith("deposit") || tx.type === "market_resolution" ? "+" : "-"}
                              {formatBRL3(tx.amount)}
                            </p>
                          </div>
                        </div>
                      ))}
                      {userDetails.transactions.length === 0 && (
                        <div className="text-center py-8 text-white/40 text-sm">
                          Nenhuma transação registrada
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              )}
            </div>
          )}

          {/* Outras views (placeholder) */}
          {!["depositos", "mercados", "polymarket", "usuarios"].includes(currentView) && (
            <div className="text-white/40 text-center py-12">
              <p className="text-xl mb-2">{menuItems.find(m => m.id === currentView)?.label}</p>
              <p className="text-sm">Em desenvolvimento...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
