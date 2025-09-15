import type { OracleState } from '@/types/domain';

export async function fetchOracleState(url: string): Promise<OracleState> {
	const res = await fetch(url);
	if (!res.ok) throw new Error('Failed to fetch oracle state');
	const data = await res.json();
	return data as OracleState;
}
