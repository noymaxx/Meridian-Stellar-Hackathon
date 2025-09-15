/* Seed script: Spoke #1 (Testnet)
 - Deploy mock SRWA-TBill issuance
 - Configure eligibility (sample CSV)
 - Deploy OracleAdapter (mock Reflector TWAP)
 - Deploy pool via Blend Factory with SRWA/USDC reserves
 - Configure IRM/caps and defaults from Spoke #1
 - Use Friendbot for Testnet accounts
*/

import { Keypair, Asset, Server, TransactionBuilder, Operation, Networks } from '@stellar/stellar-sdk';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

async function friendbot(pubkey: string) {
	const r = await fetch(`https://friendbot.stellar.org/?addr=${pubkey}`);
	if (!r.ok) throw new Error('Friendbot failed');
}

function parseCsvEligibility(csvPath: string): Array<{ address: string; region: string; tier: string; expiry: number; kyc: boolean; frozen: boolean; }> {
	const raw = readFileSync(csvPath, 'utf8');
	const [header, ...rows] = raw.trim().split(/\r?\n/);
	const cols = header.split(',');
	return rows.map((line) => {
		const parts = line.split(',');
		const row: any = {};
		cols.forEach((c, i) => row[c] = parts[i]);
		row.kyc = row.kyc === 'true';
		row.frozen = row.frozen === 'true';
		row.expiry = Number(row.expiry);
		return row;
	});
}

async function main() {
	const horizon = new Server(process.env.VITE_HORIZON_URL || 'https://horizon-testnet.stellar.org');
	const networkPassphrase = Networks.TESTNET;

	// Issuer and treasury accounts
	const issuer = Keypair.random();
	const treasury = Keypair.random();
	await Promise.all([friendbot(issuer.publicKey()), friendbot(treasury.publicKey())]);

	// Create SRWA asset (mock T-Bill)
	const SRWA = new Asset('SRWATBILL', issuer.publicKey());

	// Trustline from treasury and payment of initial supply
	const treasuryAccount = await horizon.loadAccount(treasury.publicKey());
	let tx = new TransactionBuilder(treasuryAccount, { fee: '100', networkPassphrase })
		.addOperation(Operation.changeTrust({ asset: SRWA }))
		.setTimeout(180)
		.build();
	tx.sign(treasury);
	await horizon.submitTransaction(tx);

	const issuerAccount = await horizon.loadAccount(issuer.publicKey());
	tx = new TransactionBuilder(issuerAccount, { fee: '100', networkPassphrase })
		.addOperation(Operation.payment({ destination: treasury.publicKey(), asset: SRWA, amount: '1000000' }))
		.setTimeout(180)
		.build();
	tx.sign(issuer);
	await horizon.submitTransaction(tx);

	// Eligibility from CSV (mock)
	const csvPath = resolve(process.cwd(), 'scripts', 'fixtures', 'eligibility.csv');
	const eligibility = parseCsvEligibility(csvPath);
	console.log('Loaded eligibility rows:', eligibility.length);

	// Oracle adapter deploy (mock)
	console.log('Deploying OracleAdapter (mock Reflector TWAP) ...');

	// Blend Factory pool deploy (mock)
	console.log('Deploying Blend pool with SRWA/USDC reserves (mock) ...');
	console.log('Configure IRM/caps (mock) ...');

	console.log('Seed complete. Issuer:', issuer.publicKey(), 'Treasury:', treasury.publicKey());
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
