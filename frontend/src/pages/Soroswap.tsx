import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { getBestRoute, swap } from '@/integrations/soroswap';
import { useState } from 'react';

export default function SoroswapPage() {
	const [amount, setAmount] = useState('100');
	return (
		<div>
			<Header />
			<div className="container mx-auto max-w-md p-6 space-y-4">
				<h1 className="text-2xl font-semibold">Soroswap</h1>
				<input className="border rounded p-2 w-full" value={amount} onChange={(e) => setAmount(e.target.value)} />
				<div className="flex gap-2">
					<Button onClick={async () => { await getBestRoute('SRWA','USDC',amount); }}>Quote</Button>
					<Button variant="outline" onClick={async () => { const r = await getBestRoute('SRWA','USDC',amount); if (r) await swap(r,50); }}>Swap</Button>
				</div>
			</div>
		</div>
	);
}
