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
import { User } from "lucide-react";

interface UsernameSetupModalProps {
  open: boolean;
  onSuccess: () => void;
}

export function UsernameSetupModal({ open, onSuccess }: UsernameSetupModalProps) {
  const [username, setUsername] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const setUsernameMutation = useMutation({
    mutationFn: async (username: string) => {
      const res = await apiRequest("PUT", "/api/user/username", { username });
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Username definido!",
        description: `Bem-vindo, @${username}`,
      });
      queryClient.setQueryData(["/api/user"], data);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao definir username",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.length < 3 || username.length > 20) {
      toast({
        title: "Username inválido",
        description: "Username deve ter entre 3 e 20 caracteres",
        variant: "destructive",
      });
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      toast({
        title: "Username inválido",
        description: "Use apenas letras, números e underscores",
        variant: "destructive",
      });
      return;
    }
    setUsernameMutation.mutate(username);
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Escolha seu username
          </DialogTitle>
          <DialogDescription>
            Seu username será usado para interagir na plataforma (comentários, etc)
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              placeholder="seu_usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              required
              data-testid="input-setup-username"
            />
            <p className="text-xs text-muted-foreground">
              3-20 caracteres • Apenas letras, números e _ • Único e imutável
            </p>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={setUsernameMutation.isPending || username.length < 3}
            data-testid="button-setup-username-submit"
          >
            {setUsernameMutation.isPending ? "Salvando..." : "Confirmar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
