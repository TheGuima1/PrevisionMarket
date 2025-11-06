import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Navbar } from "@/components/navbar";
import { AIAssistant } from "@/components/ai-assistant";
import { TradePanel } from "@/components/trade-panel";
import { OddsDisplay } from "@/components/odds-display";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, Clock, FileText, MessageSquare, ThumbsUp, ThumbsDown } from "lucide-react";
import type { Market, Comment as CommentType } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const categoryLabels: Record<string, string> = {
  politica: "Política",
  economia: "Economia",
  cultura: "Cultura",
  esportes: "Esportes",
  ciencia: "Ciência",
};

export default function MarketDetailPage() {
  const [, params] = useRoute("/market/:id");
  const { user } = useAuth();
  const { toast } = useToast();
  const [comment, setComment] = useState("");
  
  const marketId = params?.id;

  const { data: market, isLoading: marketLoading } = useQuery<Market>({
    queryKey: ["/api/markets", marketId],
    enabled: !!marketId,
  });

  const { data: comments } = useQuery<(CommentType & { user: { username: string } })[]>({
    queryKey: ["/api/comments", marketId],
    enabled: !!marketId,
  });

  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", "/api/comments", {
        marketId,
        content,
      });
      return await res.json();
    },
    onSuccess: () => {
      setComment("");
      queryClient.invalidateQueries({ queryKey: ["/api/comments", marketId] });
      toast({
        title: "Comentário publicado!",
        description: "Sua opinião foi adicionada à discussão",
      });
    },
  });

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim()) {
      commentMutation.mutate(comment);
    }
  };

  if (marketLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64" />
              <Skeleton className="h-96" />
            </div>
            <div>
              <Skeleton className="h-96" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!market) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8 text-center">
          <h2 className="text-2xl font-bold">Mercado não encontrado</h2>
        </main>
      </div>
    );
  }

  const endDate = new Date(market.endDate);
  const isActive = market.status === "active";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <Badge variant="outline" className="shrink-0">
                    {categoryLabels[market.category]}
                  </Badge>
                  {isActive && (
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                      Ativo
                    </Badge>
                  )}
                </div>

                <h1 className="font-accent text-3xl md:text-4xl font-bold leading-tight" data-testid="text-market-title">
                  {market.title}
                </h1>

                <p className="text-muted-foreground leading-relaxed" data-testid="text-market-description">
                  {market.description}
                </p>
              </div>

              <Separator />

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-muted-foreground">Encerra em</div>
                    <div className="font-medium">{endDate.toLocaleDateString('pt-BR')}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-muted-foreground">Volume Total</div>
                    <div className="font-medium">R$ {parseFloat(market.totalVolume).toLocaleString('pt-BR')}</div>
                  </div>
                </div>
              </div>

              {market.resolutionSource && (
                <div className="p-4 bg-muted/30 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Fonte de Resolução</div>
                  <div className="text-sm">{market.resolutionSource}</div>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-6 pt-4">
                <OddsDisplay probability={parseFloat(market.yesPrice)} />
                <OddsDisplay probability={parseFloat(market.noPrice)} />
              </div>
            </Card>

            <Card className="p-6 space-y-6">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                <h2 className="font-accent text-2xl font-semibold">Discussão</h2>
                <Badge variant="outline" className="ml-auto">{comments?.length || 0}</Badge>
              </div>

              <form onSubmit={handleCommentSubmit} className="space-y-4">
                <Textarea
                  placeholder="Compartilhe sua análise ou opinião sobre este mercado..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="min-h-24"
                  data-testid="textarea-comment"
                />
                <Button
                  type="submit"
                  disabled={!comment.trim() || commentMutation.isPending}
                  data-testid="button-comment-submit"
                >
                  {commentMutation.isPending ? "Publicando..." : "Publicar Comentário"}
                </Button>
              </form>

              <Separator />

              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {comments && comments.length > 0 ? (
                    comments.map((c) => (
                      <div key={c.id} className="p-4 border rounded-lg space-y-2" data-testid={`comment-${c.id}`}>
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">@{c.user.username}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(c.createdAt).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed">{c.content}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <button className="flex items-center gap-1 hover:text-primary transition-colors">
                            <ThumbsUp className="h-3 w-3" />
                            <span>{c.upvotes}</span>
                          </button>
                          <button className="flex items-center gap-1 hover:text-destructive transition-colors">
                            <ThumbsDown className="h-3 w-3" />
                            <span>{c.downvotes}</span>
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Seja o primeiro a comentar neste mercado!
                    </div>
                  )}
                </div>
              </ScrollArea>
            </Card>
          </div>

          <div className="space-y-6">
            <TradePanel 
              market={market} 
              userBalance={{ 
                brl: user?.balanceBrl || "0", 
                usdc: user?.balanceUsdc || "0" 
              }}
            />
          </div>
        </div>
      </main>

      <AIAssistant />
    </div>
  );
}
