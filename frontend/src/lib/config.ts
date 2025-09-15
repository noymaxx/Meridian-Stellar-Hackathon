export type AppConfig = {
	network: 'testnet' | 'public';
	horizonUrl: string;
	rpcUrl: string;
	defindexApiBase: string;
	reflectorFeedSrwaUsd: string;
	soroswapRouter: string;
	blendFactory: string;
	appName: string;
	defaultSlippageBps: number;
};

const env = import.meta.env as unknown as Record<string, string | undefined>;

export function loadEnvConfig(): AppConfig {
	return {
		network: (env.VITE_STELLAR_NETWORK as 'testnet' | 'public') ?? 'testnet',
		horizonUrl: env.VITE_HORIZON_URL ?? 'https://horizon-testnet.stellar.org',
		rpcUrl: env.VITE_RPC_URL ?? 'https://soroban-testnet.stellar.org',
		defindexApiBase: env.VITE_DEFINDEX_API_BASE ?? '',
		reflectorFeedSrwaUsd: env.VITE_REFLECTOR_FEED_SRWA_USD ?? '',
		soroswapRouter: env.VITE_SOROSWAP_ROUTER ?? '',
		blendFactory: env.VITE_BLEND_FACTORY ?? '',
		appName: env.VITE_APP_NAME ?? 'PanoramaBlock',
		defaultSlippageBps: Number(env.VITE_DEFAULT_SLIPPAGE_BPS ?? '50'),
	};
}
