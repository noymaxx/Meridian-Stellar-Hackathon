import type { ReserveConfig, Pool } from '@/types/domain';

export type DeployPoolParams = {
	factory: string;
	class: Pool['class'];
	reserves: ReserveConfig[];
	backstopRate: number;
};

export async function deployPool(_params: DeployPoolParams): Promise<string> {
	// TODO: implement when SDK available; return mock address for now
	return 'CBLENDPOOLMOCKADDRESS';
}

export async function setReserve(_pool: string, _reserve: ReserveConfig): Promise<void> {
	// TODO: on-chain call
}

export async function configureIRM(_pool: string, _cfg: NonNullable<ReserveConfig['irm']>): Promise<void> {
	// TODO
}
