import { WalletAdapter, WalletType } from "../types";
import { FreighterAdapter } from "./FreighterAdapter";

export { FreighterAdapter };

export const createWalletAdapter = (type: WalletType): WalletAdapter => {
  switch (type) {
    case WalletType.FREIGHTER:
      return new FreighterAdapter();
    default:
      throw new Error(`Unsupported wallet type: ${type}`);
  }
};

export const getAvailableAdapters = (): WalletAdapter[] => {
  return [
    new FreighterAdapter()
  ];
};