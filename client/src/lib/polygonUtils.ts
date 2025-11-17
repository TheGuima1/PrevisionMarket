// client/src/lib/polygonUtils.ts
// Utilitários para interação com Polygon via MetaMask
// Implementa assinatura EIP-2612 (permit) para queimas gasless

import { ethers } from 'ethers';

interface PermitSignature {
  deadline: string; // BigInt como string para JSON
  v: number;
  r: string;
  s: string;
}

/**
 * Assina uma autorização EIP-2612 (permit) para permitir que o admin queime tokens
 * do usuário sem que o usuário pague gas. Requer MetaMask ou outra carteira web3.
 * 
 * @param amount - Quantidade de tokens (valor decimal, ex: 10.50)
 * @param tokenDecimals - Decimais do token (geralmente 18)
 * @param tokenContractAddress - Endereço do contrato BRL3 na Polygon
 * @param spenderAddress - Endereço da carteira do admin (quem vai executar o burn)
 * @returns Objeto com deadline, v, r, s para enviar ao servidor
 */
export async function signPermit(
  amount: number,
  tokenDecimals: number,
  tokenContractAddress: string,
  spenderAddress: string
): Promise<PermitSignature> {
  // Verificar se MetaMask está disponível
  if (!window.ethereum) {
    throw new Error('MetaMask não detectado. Por favor, instale MetaMask para continuar.');
  }

  // Conectar ao provedor MetaMask
  const provider = new ethers.BrowserProvider(window.ethereum);
  
  // Solicitar permissão para acessar a conta
  await provider.send("eth_requestAccounts", []);
  
  const signer = await provider.getSigner();
  const ownerAddress = await signer.getAddress();

  // Conectar ao contrato do token
  const tokenAbi = [
    'function nonces(address owner) view returns (uint256)',
    'function name() view returns (string)'
  ];
  const tokenContract = new ethers.Contract(tokenContractAddress, tokenAbi, signer);

  // Converter quantidade para unidades do token
  const value = ethers.parseUnits(amount.toString(), tokenDecimals);
  
  // Obter nonce atual do usuário no contrato
  const nonce = await tokenContract.nonces(ownerAddress);
  
  // Deadline: 1 hora a partir de agora
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 60);

  // Obter informações do domínio EIP-712
  const network = await provider.getNetwork();
  const domain = {
    name: await tokenContract.name(),
    version: '1',
    chainId: network.chainId,
    verifyingContract: tokenContractAddress,
  };

  // Tipos EIP-712 para Permit
  const types = {
    Permit: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
    ],
  };

  // Mensagem a ser assinada
  const message = {
    owner: ownerAddress,
    spender: spenderAddress,
    value: value,
    nonce: nonce,
    deadline: deadline,
  };

  // Solicitar assinatura do usuário via MetaMask
  const signature = await signer.signTypedData(domain, types, message);
  
  // Extrair componentes v, r, s da assinatura
  const { v, r, s } = ethers.Signature.from(signature);

  return {
    deadline: deadline.toString(),
    v,
    r,
    s,
  };
}

/**
 * Verifica se o usuário está conectado à rede Polygon.
 * Retorna true se está na Polygon Mainnet (chainId 137).
 */
export async function isPolygonNetwork(): Promise<boolean> {
  if (!window.ethereum) return false;
  
  const provider = new ethers.BrowserProvider(window.ethereum);
  const network = await provider.getNetwork();
  
  // Polygon Mainnet chainId = 137
  return network.chainId === BigInt(137);
}

/**
 * Solicita ao usuário trocar para a rede Polygon.
 */
export async function switchToPolygon(): Promise<void> {
  if (!window.ethereum) {
    throw new Error('MetaMask não detectado');
  }

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x89' }], // 137 em hexadecimal
    });
  } catch (switchError: any) {
    // Se a rede não estiver adicionada, adicionar
    if (switchError.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0x89',
          chainName: 'Polygon Mainnet',
          nativeCurrency: {
            name: 'MATIC',
            symbol: 'MATIC',
            decimals: 18,
          },
          rpcUrls: ['https://polygon-rpc.com/'],
          blockExplorerUrls: ['https://polygonscan.com/'],
        }],
      });
    } else {
      throw switchError;
    }
  }
}

// Declaração de tipo para window.ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}
