import { createContext, useContext, useReducer, useEffect, ReactNode } from "react";
import { ethers } from "ethers";
import { useToast } from "@/hooks/use-toast";
import { BRL3_TOKEN_ADDRESS, POLYGON_CHAIN_ID_HEX, TOKEN_DECIMALS as BRL3_TOKEN_DECIMALS } from "@/blockchain/config";
import { BRL3_ABI } from "@/blockchain/brl3Abi";

declare global {
  interface Window {
    ethereum?: any;
  }
}

export type MetaMaskStatus =
  | "not-installed"
  | "iframe-blocked" 
  | "locked"
  | "needs-approval"
  | "ready"
  | "wrong-network"
  | "connecting";

interface MetaMaskState {
  status: MetaMaskStatus;
  account: string | null;
  chainId: string | null;
  balance: string | null;
  error: string | null;
}

type MetaMaskAction =
  | { type: "SET_STATUS"; status: MetaMaskStatus }
  | { type: "SET_ACCOUNT"; account: string | null }
  | { type: "SET_CHAIN_ID"; chainId: string | null }
  | { type: "SET_BALANCE"; balance: string | null }
  | { type: "SET_ERROR"; error: string | null }
  | { type: "CONNECT_SUCCESS"; account: string; chainId: string }
  | { type: "DISCONNECT" }
  | { type: "RESET" };

const POLYGON_CHAIN_ID = POLYGON_CHAIN_ID_HEX;
const CONTRACT_ADDRESS = BRL3_TOKEN_ADDRESS;
const TOKEN_DECIMALS = BRL3_TOKEN_DECIMALS;

const initialState: MetaMaskState = {
  status: "not-installed",
  account: null,
  chainId: null,
  balance: null,
  error: null,
};

function metaMaskReducer(
  state: MetaMaskState,
  action: MetaMaskAction
): MetaMaskState {
  switch (action.type) {
    case "SET_STATUS":
      return { ...state, status: action.status };
    case "SET_ACCOUNT":
      return { ...state, account: action.account };
    case "SET_CHAIN_ID":
      return { ...state, chainId: action.chainId };
    case "SET_BALANCE":
      return { ...state, balance: action.balance };
    case "SET_ERROR":
      return { ...state, error: action.error };
    case "CONNECT_SUCCESS":
      return {
        ...state,
        status: action.chainId === POLYGON_CHAIN_ID ? "ready" : "wrong-network",
        account: action.account,
        chainId: action.chainId,
        error: null,
      };
    case "DISCONNECT":
      // Return to needs-approval if MetaMask is still available, otherwise check why it's unavailable
      const nextStatus = state.status === "iframe-blocked" ? "iframe-blocked" : 
                         state.status === "not-installed" ? "not-installed" :
                         "needs-approval";
      return {
        ...state,
        status: nextStatus,
        account: null,
        chainId: null,
        balance: null,
      };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

interface MetaMaskContextValue {
  state: MetaMaskState;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchToPolygon: () => Promise<void>;
  refreshBalance: () => Promise<void>;
}

const MetaMaskContext = createContext<MetaMaskContextValue | undefined>(
  undefined
);

export function MetaMaskProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(metaMaskReducer, initialState);
  const { toast } = useToast();

  // Check if running in iframe
  function isInIframe(): boolean {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  }

  // Initialize MetaMask detection
  useEffect(() => {
    async function initializeMetaMask() {
      // Check if in iframe first
      if (isInIframe()) {
        dispatch({ type: "SET_STATUS", status: "iframe-blocked" });
        dispatch({
          type: "SET_ERROR",
          error: "MetaMask não funciona em iframe. Abra em uma nova aba.",
        });
        return;
      }

      // Check if MetaMask is installed
      if (typeof window.ethereum === "undefined") {
        dispatch({ type: "SET_STATUS", status: "not-installed" });
        dispatch({
          type: "SET_ERROR",
          error: "MetaMask não está instalado. Instale a extensão e recarregue a página.",
        });
        return;
      }

      // MetaMask is installed, check if we have previous connection
      try {
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });
        const chainId = await window.ethereum.request({ method: "eth_chainId" });

        if (accounts.length > 0) {
          // User previously connected
          dispatch({
            type: "CONNECT_SUCCESS",
            account: accounts[0],
            chainId,
          });
        } else {
          // Not connected yet
          dispatch({ type: "SET_STATUS", status: "needs-approval" });
        }
      } catch (error: any) {
        console.error("Error checking MetaMask status:", error);
        if (error.code === -32002) {
          dispatch({ type: "SET_STATUS", status: "locked" });
          dispatch({
            type: "SET_ERROR",
            error: "MetaMask está bloqueado. Desbloqueie a extensão e tente novamente.",
          });
        } else {
          dispatch({ type: "SET_STATUS", status: "needs-approval" });
        }
      }
    }

    initializeMetaMask();
  }, []);

  // Setup event listeners
  useEffect(() => {
    if (!window.ethereum || state.status === "iframe-blocked" || state.status === "not-installed") return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        dispatch({ type: "DISCONNECT" });
        toast({
          title: "MetaMask desconectado",
          description: "Sua carteira foi desconectada",
        });
      } else {
        dispatch({ type: "SET_ACCOUNT", account: accounts[0] });
        // Safely refresh chain ID in case it changed
        if (window.ethereum) {
          window.ethereum
            .request({ method: "eth_chainId" })
            .then((chainId: string) => {
              dispatch({ type: "SET_CHAIN_ID", chainId });
              if (chainId !== POLYGON_CHAIN_ID) {
                dispatch({ type: "SET_STATUS", status: "wrong-network" });
              } else if (state.status === "wrong-network") {
                dispatch({ type: "SET_STATUS", status: "ready" });
              }
            })
            .catch(() => {
              // Silently fail if MetaMask request fails during cleanup
            });
        }
      }
    };

    const handleChainChanged = (chainId: string) => {
      dispatch({ type: "SET_CHAIN_ID", chainId });
      if (chainId !== POLYGON_CHAIN_ID) {
        dispatch({ type: "SET_STATUS", status: "wrong-network" });
        toast({
          title: "Rede incorreta",
          description: "Por favor, conecte à rede Polygon Mainnet",
          variant: "destructive",
        });
      } else {
        // If we're connected and on Polygon, status should be ready
        if (state.account) {
          dispatch({ type: "SET_STATUS", status: "ready" });
          toast({
            title: "Conectado à Polygon",
            description: "Rede correta!",
          });
        }
      }
    };

    const handleDisconnect = () => {
      dispatch({ type: "DISCONNECT" });
      toast({
        title: "Desconectado",
        description: "MetaMask foi desconectado",
      });
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);
    window.ethereum.on("disconnect", handleDisconnect);

    return () => {
      // Safe cleanup without async calls
      if (window.ethereum && window.ethereum.removeListener) {
        try {
          window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
          window.ethereum.removeListener("chainChanged", handleChainChanged);
          window.ethereum.removeListener("disconnect", handleDisconnect);
        } catch (error) {
          // Silently fail if removeListener fails during unmount
          console.error("Error removing MetaMask listeners:", error);
        }
      }
    };
  }, [state.status, state.account, toast]);

  async function connect() {
    if (state.status === "iframe-blocked") {
      toast({
        title: "Abra em nova aba",
        description: "MetaMask não funciona em iframe. Abra esta página em uma nova aba do navegador.",
        variant: "destructive",
      });
      return;
    }

    if (state.status === "not-installed") {
      toast({
        title: "MetaMask não instalado",
        description: "Instale a extensão MetaMask no seu navegador.",
        variant: "destructive",
      });
      return;
    }

    try {
      dispatch({ type: "SET_STATUS", status: "connecting" });

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const chainId = await window.ethereum.request({ method: "eth_chainId" });

      if (accounts.length === 0) {
        throw new Error("Nenhuma conta selecionada");
      }

      dispatch({
        type: "CONNECT_SUCCESS",
        account: accounts[0],
        chainId,
      });

      if (chainId !== POLYGON_CHAIN_ID) {
        toast({
          title: "Rede incorreta",
          description: "Você está conectado, mas precisa trocar para a rede Polygon",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Conectado com sucesso!",
          description: `Carteira ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)} conectada à Polygon`,
        });
      }
    } catch (error: any) {
      console.error("Error connecting to MetaMask:", error);
      
      if (error.code === 4001) {
        dispatch({ type: "SET_STATUS", status: "needs-approval" });
        toast({
          title: "Conexão recusada",
          description: "Você recusou a conexão no MetaMask",
          variant: "destructive",
        });
      } else if (error.code === -32002) {
        dispatch({ type: "SET_STATUS", status: "locked" });
        toast({
          title: "MetaMask bloqueado",
          description: "Já existe uma solicitação pendente. Abra o MetaMask para aprovar ou rejeitar.",
          variant: "destructive",
        });
      } else {
        dispatch({ type: "SET_STATUS", status: "needs-approval" });
        dispatch({ type: "SET_ERROR", error: error.message });
        toast({
          title: "Erro ao conectar",
          description: error.message || "Não foi possível conectar ao MetaMask",
          variant: "destructive",
        });
      }
    }
  }

  function disconnect() {
    dispatch({ type: "DISCONNECT" });
  }

  async function switchToPolygon() {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: POLYGON_CHAIN_ID }],
      });
    } catch (switchError: any) {
      // Chain not added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: POLYGON_CHAIN_ID,
                chainName: "Polygon Mainnet",
                nativeCurrency: {
                  name: "MATIC",
                  symbol: "MATIC",
                  decimals: 18,
                },
                rpcUrls: ["https://polygon-rpc.com"],
                blockExplorerUrls: ["https://polygonscan.com"],
              },
            ],
          });
        } catch (addError: any) {
          toast({
            title: "Erro ao adicionar rede",
            description: addError.message,
            variant: "destructive",
          });
          throw addError;
        }
      } else {
        toast({
          title: "Erro ao trocar de rede",
          description: switchError.message,
          variant: "destructive",
        });
        throw switchError;
      }
    }
  }

  async function refreshBalance() {
    if (!state.account || !window.ethereum) return;

    try {
      if (!CONTRACT_ADDRESS) return;

      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, BRL3_ABI, provider);
      const balanceWei = await contract.balanceOf(state.account);
      const balanceFormatted = ethers.formatUnits(balanceWei, TOKEN_DECIMALS);
      
      dispatch({ type: "SET_BALANCE", balance: balanceFormatted });
    } catch (error) {
      console.error("Error refreshing balance:", error);
    }
  }

  const value: MetaMaskContextValue = {
    state,
    connect,
    disconnect,
    switchToPolygon,
    refreshBalance,
  };

  return (
    <MetaMaskContext.Provider value={value}>
      {children}
    </MetaMaskContext.Provider>
  );
}

export function useMetaMask() {
  const context = useContext(MetaMaskContext);
  if (!context) {
    throw new Error("useMetaMask must be used within MetaMaskProvider");
  }
  return context;
}
