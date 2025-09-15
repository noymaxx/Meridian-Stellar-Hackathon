import { Server, Networks } from '@stellar/stellar-sdk';
import { useSettings } from '@/hooks/useSettings';

let cached: Server | null = null;

export function getHorizon(): Server {
	if (cached) return cached;
	const horizonUrl = (typeof window !== 'undefined')
		? useSettings.getState().horizonUrl
		: (import.meta.env.VITE_HORIZON_URL ?? 'https://horizon-testnet.stellar.org');
	cached = new Server(horizonUrl);
	return cached;
}

export function getNetworkPassphrase(): string {
	const network = (typeof window !== 'undefined')
		? useSettings.getState().network
		: (import.meta.env.VITE_STELLAR_NETWORK ?? 'testnet');
	return network === 'public' ? Networks.PUBLIC : Networks.TESTNET;
}
