export type Route = { path: string[]; amountOut: string };

export async function getBestRoute(_from: string, _to: string, _amountIn: string): Promise<Route | null> {
	return { path: [_from, _to], amountOut: _amountIn };
}

export async function swap(_route: Route, _slippageBps: number): Promise<string> {
	// return mock tx hash
	return 'SOROSWAPMOCKTXHASH';
}
