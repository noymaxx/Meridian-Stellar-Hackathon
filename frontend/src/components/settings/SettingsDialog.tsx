import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useSettings } from '@/hooks/useSettings';

export function SettingsButton() {
	const [open, setOpen] = useState(false);
	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button variant="ghost" size="sm">Settings</Button>
			</DialogTrigger>
			<SettingsForm onClose={() => setOpen(false)} />
		</Dialog>
	);
}

function SettingsForm({ onClose }: { onClose: () => void }) {
	const settings = useSettings();

	return (
		<DialogContent className="max-w-2xl">
			<DialogHeader>
				<DialogTitle>Settings</DialogTitle>
			</DialogHeader>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
				<div>
					<Label>Network</Label>
					<Input value={settings.network} onChange={(e) => settings.set({ network: e.target.value as any })} />
				</div>
				<div>
					<Label>Horizon URL</Label>
					<Input value={settings.horizonUrl} onChange={(e) => settings.set({ horizonUrl: e.target.value })} />
				</div>
				<div>
					<Label>RPC URL</Label>
					<Input value={settings.rpcUrl} onChange={(e) => settings.set({ rpcUrl: e.target.value })} />
				</div>
				<div>
					<Label>DeFindex API</Label>
					<Input value={settings.defindexApiBase} onChange={(e) => settings.set({ defindexApiBase: e.target.value })} />
				</div>
				<div>
					<Label>Reflector SRWA/USD</Label>
					<Input value={settings.reflectorFeedSrwaUsd} onChange={(e) => settings.set({ reflectorFeedSrwaUsd: e.target.value })} />
				</div>
				<div>
					<Label>Soroswap Router</Label>
					<Input value={settings.soroswapRouter} onChange={(e) => settings.set({ soroswapRouter: e.target.value })} />
				</div>
				<div>
					<Label>Blend Factory</Label>
					<Input value={settings.blendFactory} onChange={(e) => settings.set({ blendFactory: e.target.value })} />
				</div>
				<div>
					<Label>Default Slippage (bps)</Label>
					<Input type="number" value={settings.defaultSlippageBps}
						onChange={(e) => settings.set({ defaultSlippageBps: Number(e.target.value) })} />
				</div>
			</div>

			<div className="flex gap-2 justify-end">
				<Button variant="outline" onClick={() => settings.resetToEnv()}>Reset to env</Button>
				<Button onClick={onClose}>Close</Button>
			</div>
		</DialogContent>
	);
}
