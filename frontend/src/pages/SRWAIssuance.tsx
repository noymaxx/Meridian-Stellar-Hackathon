import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import * as SRWA from '@/lib/adapters/srwa';

export default function SRWAIssuance() {
	return (
		<div>
			<Header />
			<div className="container mx-auto max-w-3xl p-6 space-y-4">
				<h1 className="text-2xl font-semibold">SRWA Issuance</h1>
				<div className="border rounded-md p-4 space-y-2">
					<div className="text-sm text-muted-foreground">Admin/Issuer actions</div>
					<div className="flex gap-2">
						<Button onClick={() => SRWA.mint('TOKEN','GDEST','100')}>Mint</Button>
						<Button variant="outline" onClick={() => SRWA.burn('TOKEN','GDEST','10')}>Burn</Button>
						<Button variant="outline" onClick={() => SRWA.set_eligibility('TOKEN','/fixtures/eligibility.csv')}>Set Eligibility</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
