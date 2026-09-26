/** Thin MetaMask/injected-wallet glue. Isolated from chain.ts on purpose: this
 * is the only file that touches window.ethereum, so it stays small and is the
 * one piece of the live-event integration that cannot be exercised by an
 * automated test (it needs a real browser wallet extension).
 */
import { BrowserProvider } from "ethers";

export const MONAD_TESTNET_PARAMS = {
  chainId: "0x279f",
  chainName: "Monad Testnet",
  nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
  rpcUrls: ["https://testnet-rpc.monad.xyz"],
  blockExplorerUrls: ["https://testnet.monadscan.com"],
};

type Eip1193Provider = {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  on(event: string, handler: (...args: unknown[]) => void): void;
  removeListener(event: string, handler: (...args: unknown[]) => void): void;
};

function ethereum(): Eip1193Provider | undefined {
  return (globalThis as { ethereum?: Eip1193Provider }).ethereum;
}

export function hasInjectedWallet(): boolean {
  return typeof window !== "undefined" && !!ethereum();
}

export async function connectWallet(): Promise<string> {
  const provider = ethereum();
  if (!provider) throw new Error("No wallet extension detected.");
  const accounts = (await provider.request({
    method: "eth_requestAccounts",
  })) as string[];
  if (!accounts?.[0]) throw new Error("No account was authorized.");
  return accounts[0];
}

export async function ensureMonadTestnet(): Promise<void> {
  const provider = ethereum();
  if (!provider) throw new Error("No wallet extension detected.");
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: MONAD_TESTNET_PARAMS.chainId }],
    });
  } catch (err) {
    const code = (err as { code?: number })?.code;
    if (code === 4902) {
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [MONAD_TESTNET_PARAMS],
      });
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: MONAD_TESTNET_PARAMS.chainId }],
      });
    } else {
      throw err;
    }
  }
}

export function watchWallet(
  onAccounts: (accounts: string[]) => void,
  onChain: (chainId: string) => void,
  onDisconnect: () => void,
): () => void {
  const provider = ethereum();
  if (!provider) return () => {};
  const accountsHandler = (...args: unknown[]) =>
    onAccounts(args[0] as string[]);
  const chainHandler = (...args: unknown[]) => onChain(args[0] as string);
  const disconnectHandler = () => onDisconnect();
  provider.on("accountsChanged", accountsHandler);
  provider.on("chainChanged", chainHandler);
  provider.on("disconnect", disconnectHandler);
  return () => {
    provider.removeListener("accountsChanged", accountsHandler);
    provider.removeListener("chainChanged", chainHandler);
    provider.removeListener("disconnect", disconnectHandler);
  };
}

export function getBrowserProvider(): BrowserProvider {
  const provider = ethereum();
  if (!provider) throw new Error("No wallet extension detected.");
  return new BrowserProvider(provider);
}
