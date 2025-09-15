import { withTxToasts } from '@/lib/txFlow';
import * as Blend from '@/integrations/blend';
import type { ReserveConfig } from '@/types/domain';

export async function deploy_pool_via_factory(factory: string, cls: 'TBill'|'Receivables'|'CRE', reserves: ReserveConfig[], backstopRate: number) {
	return withTxToasts('Deploy pool', async () => Blend.deployPool({ factory, class: cls, reserves, backstopRate }));
}

export async function set_reserve(pool: string, reserve: ReserveConfig) {
	return withTxToasts('Set reserve', async () => { await Blend.setReserve(pool, reserve); return 'OK'; });
}

export async function set_irm(pool: string, cfg: NonNullable<ReserveConfig['irm']>) {
	return withTxToasts('Set IRM', async () => { await Blend.configureIRM(pool, cfg); return 'OK'; });
}

export async function activate_pool(_pool: string) {
	return withTxToasts('Activate pool', async () => 'MOCK_TX_HASH_ACTIVATE');
}

export async function supply_collateral(_pool: string, _amount: string) {
	return withTxToasts('Supply', async () => 'MOCK_TX_HASH_SUPPLY');
}

export async function borrow(_pool: string, _amount: string) {
	return withTxToasts('Borrow', async () => 'MOCK_TX_HASH_BORROW');
}

export async function repay(_pool: string, _amount: string) {
	return withTxToasts('Repay', async () => 'MOCK_TX_HASH_REPAY');
}

export async function withdraw_collateral(_pool: string, _amount: string) {
	return withTxToasts('Withdraw', async () => 'MOCK_TX_HASH_WITHDRAW');
}
