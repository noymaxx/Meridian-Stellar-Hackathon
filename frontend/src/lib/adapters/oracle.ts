import { withTxToasts } from '@/lib/txFlow';
import { fetchOracleState } from '@/integrations/reflector';

export async function submit_nav(_adapter: string, _nav: string, _validUntil: number) {
	return withTxToasts('Submit NAV', async () => 'MOCK_TX_HASH_SUBMIT_NAV');
}

export async function get_spot(url: string) {
	return fetchOracleState(url);
}

export async function get_effective_price(url: string) {
	return fetchOracleState(url);
}

export async function is_degraded(url: string) {
	const s = await fetchOracleState(url);
	return !!s.degraded;
}
