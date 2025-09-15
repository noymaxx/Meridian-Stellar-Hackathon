import * as Freighter from '@stellar/freighter-api';
import { TransactionBuilder, Memo, Networks, Operation, Asset, Keypair } from '@stellar/stellar-sdk';
import { getHorizon, getNetworkPassphrase } from './client';

export async function isFreighterInstalled(): Promise<boolean> {
	try { return await Freighter.isConnected(); } catch { return false; }
}

export async function getPublicKey(): Promise<string> {
	const allowed = await Freighter.isAllowed();
	if (!allowed) await Freighter.setAllowed();
	return await Freighter.getPublicKey();
}

export async function simulateAndSignPayment(params: { to: string; amount: string; asset?: Asset; memo?: string; }): Promise<string> {
	const horizon = getHorizon();
	const source = await getPublicKey();
	const account = await horizon.loadAccount(source);
	const networkPassphrase = getNetworkPassphrase();

	const tx = new TransactionBuilder(account, { fee: '100', networkPassphrase })
		.addOperation(Operation.payment({
			destination: params.to,
			amount: params.amount,
			asset: params.asset ?? Asset.native(),
		}))
		.addMemo(params.memo ? Memo.text(params.memo) : Memo.none())
		.setTimeout(180)
		.build();

	// Freighter doesn't do server-side simulate; this is a placeholder for RPC simulate step if needed
	const xdr = tx.toXDR();
	const signed = await Freighter.signTransaction(xdr, { networkPassphrase });
	const result = await horizon.submitTransaction(signed);
	return result.hash;
}
