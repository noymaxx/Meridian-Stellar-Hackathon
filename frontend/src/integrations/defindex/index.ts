import type { Pool, Position } from '@/types/domain';

export async function fetchPositions(apiBase: string, account: string): Promise<Position[]> {
	const r = await fetch(`${apiBase}/positions?account=${account}`);
	if (!r.ok) return [];
	return (await r.json()) as Position[];
}

export async function fetchPool(apiBase: string, address: string): Promise<Pool | null> {
	const r = await fetch(`${apiBase}/pools/${address}`);
	if (!r.ok) return null;
	return (await r.json()) as Pool;
}

export async function fetchApy(apiBase: string, address: string): Promise<number | null> {
	const r = await fetch(`${apiBase}/pools/${address}/apy`);
	if (!r.ok) return null;
	const { apy } = await r.json();
	return apy as number;
}
