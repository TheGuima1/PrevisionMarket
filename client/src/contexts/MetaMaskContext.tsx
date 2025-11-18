import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';

interface MetaMaskContextType {
  account: string | null;
  isConnected: boolean;
  isCorrectNetwork: boolean;
  isLoading: boolean;
  error: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchToPolygon: () => Promise<void>;
}

const MetaMaskContext = createContext<MetaMaskContextType | undefined>(undefined);

const POLYGON_CHAIN_ID = '0x89';
const POLYGON_MAINNET = {
  chainId: POLYGON_CHAIN_ID,
  chainName: 'Polygon Mainnet',
  nativeCurrency: {
    name: 'MATIC',
    symbol: 'MATIC',
    decimals: 18,
  },
  rpcUrls: ['https://polygon-rpc.com/'],
  blockExplorerUrls: ['https://polygonscan.com/'],
};

export function MetaMaskProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkNetwork = async () => {
    if (!window.ethereum) return false;
    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const correct = chainId === POLYGON_CHAIN_ID;
      setIsCorrectNetwork(correct);
      return correct;
    } catch (err) {
      console.error('Error checking network:', err);
      return false;
    }
  };

  const switchToPolygon = async () => {
    if (!window.ethereum) {
      setError('MetaMask não está instalado. Por favor, instale a extensão MetaMask.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: POLYGON_CHAIN_ID }],
      });
      setIsCorrectNetwork(true);
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [POLYGON_MAINNET],
          });
          setIsCorrectNetwork(true);
        } catch (addError: any) {
          setError('Erro ao adicionar rede Polygon: ' + addError.message);
        }
      } else {
        setError('Erro ao trocar para rede Polygon: ' + switchError.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      setError('MetaMask não está instalado. Por favor, instale a extensão MetaMask.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length > 0) {
        setAccount(accounts[0]);
        setIsConnected(true);
        await checkNetwork();
      }
    } catch (err: any) {
      console.error('Error connecting wallet:', err);
      setError(err.message || 'Erro ao conectar carteira');
      setIsConnected(false);
      setAccount(null);
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setIsConnected(false);
    setIsCorrectNetwork(false);
    setError(null);
  };

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else if (accounts[0] !== account) {
        setAccount(accounts[0]);
        setIsConnected(true);
        checkNetwork();
      }
    };

    const handleChainChanged = () => {
      checkNetwork();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    window.ethereum
      .request({ method: 'eth_accounts' })
      .then((accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setIsConnected(true);
          checkNetwork();
        }
      })
      .catch((err: any) => {
        console.error('Error checking existing connection:', err);
      });

    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  return (
    <MetaMaskContext.Provider
      value={{
        account,
        isConnected,
        isCorrectNetwork,
        isLoading,
        error,
        connectWallet,
        disconnectWallet,
        switchToPolygon,
      }}
    >
      {children}
    </MetaMaskContext.Provider>
  );
}

export function useMetaMask() {
  const context = useContext(MetaMaskContext);
  if (context === undefined) {
    throw new Error('useMetaMask must be used within a MetaMaskProvider');
  }
  return context;
}
