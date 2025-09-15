import { NetworkType, NetworkInfo, WalletAdapter } from "../types";
import { NETWORKS } from "../config";
import { detectNetworkFromPassphrase, createLogger } from "../utils";

const logger = createLogger('NetworkService');

export class NetworkService {
  private adapter: WalletAdapter;

  constructor(adapter: WalletAdapter) {
    this.adapter = adapter;
  }

  async getCurrentNetwork(): Promise<NetworkInfo> {
    try {
      return await this.adapter.getNetwork();
    } catch (error) {
      logger.error('Failed to get current network:', error);
      throw error;
    }
  }

  async detectNetwork(): Promise<NetworkType | null> {
    try {
      const network = await this.getCurrentNetwork();
      return detectNetworkFromPassphrase(network.networkPassphrase);
    } catch (error) {
      logger.error('Failed to detect network:', error);
      return null;
    }
  }

  getNetworkConfig(type: NetworkType): NetworkInfo {
    return NETWORKS[type];
  }

  getAllNetworks(): Record<NetworkType, NetworkInfo> {
    return NETWORKS;
  }

  isTestnet(network: NetworkInfo): boolean {
    return network.type === NetworkType.TESTNET;
  }

  isMainnet(network: NetworkInfo): boolean {
    return network.type === NetworkType.MAINNET;
  }

  async validateNetworkCompatibility(requiredNetwork: NetworkType): Promise<boolean> {
    try {
      const currentNetwork = await this.detectNetwork();
      return currentNetwork === requiredNetwork;
    } catch (error) {
      logger.error('Failed to validate network compatibility:', error);
      return false;
    }
  }

  getNetworkDisplayName(network: NetworkInfo): string {
    return network.name;
  }

  getExplorerUrl(address: string, network: NetworkInfo): string {
    const baseUrl = network.type === NetworkType.MAINNET
      ? "https://stellar.expert/explorer/public"
      : "https://stellar.expert/explorer/testnet";
    return `${baseUrl}/account/${address}`;
  }
}