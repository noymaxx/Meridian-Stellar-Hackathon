import { withTxToasts } from '@/lib/txFlow';
import { getBestRoute, swap } from '@/integrations/soroswap';

export async function partial_close(user: string, portion: number, routeHint?: { from: string; to: string; amountIn: string; }) {
	return withTxToasts('Partial close', async () => {
		const route = routeHint ? { path: [routeHint.from, routeHint.to], amountOut: routeHint.amountIn } : await getBestRoute('SRWA','USDC','100');
		if (!route) throw new Error('No route');
		const tx = await swap(route, 50);
		return tx;
	});
}
