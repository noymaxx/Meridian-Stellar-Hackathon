import React, { useState, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useBlendOperations, BLEND_CONTRACTS, RequestType } from '@/hooks/useBlendOperations';
import { toast } from 'sonner';

interface FormData {
  poolAddress: string;
  tokenAddress: string;
  collateralAmount: string;
  borrowAmount: string;
  repayAmount: string;
  withdrawAmount: string;
}

export default function BlendOperationsSimple() {
  const { wallet, connect, isConnected } = useWallet();
  const blendOps = useBlendOperations();
  
  const [formData, setFormData] = useState<FormData>({
    poolAddress: BLEND_CONTRACTS.blendPool,
    tokenAddress: BLEND_CONTRACTS.srwaToken,
    collateralAmount: '1000000',
    borrowAmount: '500000',
    repayAmount: '500000',
    withdrawAmount: '500000',
  });

  const [result, setResult] = useState<any>(null);
  const [position, setPosition] = useState<any>(null);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Load user position
  const loadPosition = async () => {
    if (!wallet?.publicKey) return;
    try {
      const userPosition = await blendOps.getPosition({
        user: wallet.publicKey,
        poolAddress: formData.poolAddress,
      });
      setPosition(userPosition);
    } catch (error) {
      console.log("No position found or error:", error);
    }
  };

  useEffect(() => {
    console.log("🔗 [Blend UI] Wallet state:", { isConnected, wallet: wallet?.publicKey });
    if (isConnected && wallet?.publicKey) {
      loadPosition();
    }
  }, [isConnected, wallet?.publicKey]);

  const handleOperation = async (operation: () => Promise<any>, operationName: string) => {
    if (!isConnected || !wallet) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      const result = await operation();
      setResult(result);
      toast.success(`${operationName} completed successfully!`);
      setTimeout(loadPosition, 2000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      toast.error(`${operationName} failed: ${errorMessage}`);
    }
  };

  if (!isConnected) {
    return (
      <div style={{ 
        maxWidth: '800px', 
        margin: '50px auto', 
        padding: '40px', 
        background: '#1a1a1a', 
        borderRadius: '12px',
        color: 'white',
        position: 'relative',
        zIndex: 1000
      }}>
        <h1 style={{ textAlign: 'center', marginBottom: '20px', fontSize: '2rem' }}>
          🚀 Blend Protocol Integration
        </h1>
        <p style={{ textAlign: 'center', marginBottom: '30px', color: '#888' }}>
          Connect your wallet to access SRWA-powered lending operations
        </p>
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={connect}
            disabled={blendOps.isLoading}
            style={{
              background: '#4f46e5',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer',
              position: 'relative',
              zIndex: 1001
            }}
          >
            {blendOps.isLoading ? 'Connecting...' : 'Connect Wallet'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: '1200px', 
      margin: '20px auto', 
      padding: '20px',
      position: 'relative',
      zIndex: 1000,
      background: 'rgba(0,0,0,0.9)',
      minHeight: '100vh'
    }}>
      <div style={{ marginBottom: '30px', textAlign: 'center', color: 'white' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>
          🚀 Blend Protocol Integration
        </h1>
        <p style={{ color: '#888', marginBottom: '20px' }}>
          Real integration with Blend Protocol using SRWA tokens as collateral
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap' }}>
          <span style={{ 
            background: '#22c55e20', 
            border: '1px solid #22c55e', 
            padding: '5px 12px', 
            borderRadius: '20px',
            fontSize: '14px',
            color: '#22c55e'
          }}>
            Wallet: {wallet?.publicKey.slice(0, 8)}...
          </span>
          <span style={{ 
            background: '#3b82f620', 
            border: '1px solid #3b82f6', 
            padding: '5px 12px', 
            borderRadius: '20px',
            fontSize: '14px',
            color: '#3b82f6'
          }}>
            Pool: {formData.poolAddress.slice(0, 8)}...
          </span>
        </div>
      </div>

      {/* User Position */}
      {position && (
        <div style={{ 
          background: '#1e293b', 
          border: '1px solid #334155', 
          borderRadius: '12px', 
          padding: '20px', 
          marginBottom: '30px',
          color: 'white'
        }}>
          <h3 style={{ marginBottom: '15px', color: '#f1f5f9' }}>🛡️ Your Position</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '5px' }}>Collateral</p>
              <p style={{ fontSize: '1.2rem', color: '#22c55e' }}>
                {(Number(position.collateral) / 10000000).toFixed(2)} SRWA
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '5px' }}>Borrowed</p>
              <p style={{ fontSize: '1.2rem', color: '#f97316' }}>
                {(Number(position.borrowed) / 10000000).toFixed(2)} SRWA
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '5px' }}>Health Factor</p>
              <p style={{ fontSize: '1.2rem', color: '#f1f5f9' }}>
                {(position.health_factor / 100).toFixed(1)}%
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '5px' }}>Can Borrow</p>
              <p style={{ fontSize: '1.2rem', color: position.can_borrow ? '#22c55e' : '#ef4444' }}>
                {position.can_borrow ? 'Yes' : 'No'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Admin Setup Section */}
      <div style={{ 
        background: '#1e293b', 
        border: '1px solid #f59e0b', 
        borderRadius: '12px', 
        padding: '20px', 
        marginBottom: '20px',
        color: 'white'
      }}>
        <h3 style={{ marginBottom: '15px', color: '#f59e0b' }}>⚙️ Admin Setup (One-time)</h3>
        <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '15px' }}>
          Configure the SRWA token in the Blend pool (required before first use)
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
          <button
            onClick={() => handleOperation(() => 
              blendOps.addTokenToPool({
                poolAddress: formData.poolAddress,
                token: formData.tokenAddress,
                ltvRatio: 8000,
                liqThreshold: 8500,
              }), "Add Token to Pool"
            )}
            disabled={blendOps.isLoading}
            style={{
              background: '#f59e0b',
              color: 'white',
              border: 'none',
              padding: '10px 16px',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
              position: 'relative',
              zIndex: 1001
            }}
          >
            {blendOps.isLoading ? 'Loading...' : 'Add Token to Pool'}
          </button>
          <button
            onClick={() => handleOperation(() => 
              blendOps.setupPoolReserve({
                poolAddress: formData.poolAddress,
                asset: formData.tokenAddress,
              }), "Setup Reserve"
            )}
            disabled={blendOps.isLoading}
            style={{
              background: '#f59e0b',
              color: 'white',
              border: 'none',
              padding: '10px 16px',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
              position: 'relative',
              zIndex: 1001
            }}
          >
            {blendOps.isLoading ? 'Loading...' : 'Setup Reserve'}
          </button>
        </div>
      </div>

      {/* Operations Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        
        {/* Supply Collateral */}
        <div style={{ 
          background: '#1e293b', 
          border: '1px solid #334155', 
          borderRadius: '12px', 
          padding: '20px',
          color: 'white'
        }}>
          <h3 style={{ marginBottom: '15px', color: '#22c55e' }}>💰 Supply Collateral</h3>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#94a3b8' }}>
              Amount (stroops)
            </label>
            <input
              type="text"
              value={formData.collateralAmount}
              onChange={(e) => handleInputChange('collateralAmount', e.target.value)}
              placeholder="1000000"
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #475569',
                background: '#0f172a',
                color: 'white',
                fontSize: '14px',
                position: 'relative',
                zIndex: 1001
              }}
            />
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '5px' }}>
              = {(Number(formData.collateralAmount) / 10000000).toFixed(2)} SRWA
            </p>
          </div>
          <button
            onClick={() => handleOperation(() => 
              blendOps.supplyCollateral({
                poolAddress: formData.poolAddress,
                token: formData.tokenAddress,
                amount: formData.collateralAmount,
              }), "Supply Collateral"
            )}
            disabled={blendOps.isLoading}
            style={{
              width: '100%',
              background: '#22c55e',
              color: 'white',
              border: 'none',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer',
              position: 'relative',
              zIndex: 1001
            }}
          >
            {blendOps.isLoading ? 'Loading...' : 'Supply Collateral'}
          </button>
        </div>

        {/* Borrow */}
        <div style={{ 
          background: '#1e293b', 
          border: '1px solid #334155', 
          borderRadius: '12px', 
          padding: '20px',
          color: 'white'
        }}>
          <h3 style={{ marginBottom: '15px', color: '#3b82f6' }}>💸 Borrow</h3>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#94a3b8' }}>
              Amount (stroops)
            </label>
            <input
              type="text"
              value={formData.borrowAmount}
              onChange={(e) => handleInputChange('borrowAmount', e.target.value)}
              placeholder="500000"
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #475569',
                background: '#0f172a',
                color: 'white',
                fontSize: '14px',
                position: 'relative',
                zIndex: 1001
              }}
            />
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '5px' }}>
              = {(Number(formData.borrowAmount) / 10000000).toFixed(2)} SRWA
            </p>
          </div>
          <button
            onClick={() => handleOperation(() => 
              blendOps.borrowAmount({
                poolAddress: formData.poolAddress,
                token: formData.tokenAddress,
                amount: formData.borrowAmount,
              }), "Borrow"
            )}
            disabled={blendOps.isLoading || !position?.can_borrow}
            style={{
              width: '100%',
              background: position?.can_borrow ? '#3b82f6' : '#6b7280',
              color: 'white',
              border: 'none',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: position?.can_borrow ? 'pointer' : 'not-allowed',
              position: 'relative',
              zIndex: 1001
            }}
          >
            {blendOps.isLoading ? 'Loading...' : 'Borrow'}
          </button>
        </div>

        {/* Repay */}
        <div style={{ 
          background: '#1e293b', 
          border: '1px solid #334155', 
          borderRadius: '12px', 
          padding: '20px',
          color: 'white'
        }}>
          <h3 style={{ marginBottom: '15px', color: '#f97316' }}>💳 Repay</h3>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#94a3b8' }}>
              Amount (stroops)
            </label>
            <input
              type="text"
              value={formData.repayAmount}
              onChange={(e) => handleInputChange('repayAmount', e.target.value)}
              placeholder="500000"
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #475569',
                background: '#0f172a',
                color: 'white',
                fontSize: '14px',
                position: 'relative',
                zIndex: 1001
              }}
            />
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '5px' }}>
              = {(Number(formData.repayAmount) / 10000000).toFixed(2)} SRWA
            </p>
          </div>
          <button
            onClick={() => handleOperation(() => 
              blendOps.repayAmount({
                poolAddress: formData.poolAddress,
                token: formData.tokenAddress,
                amount: formData.repayAmount,
              }), "Repay"
            )}
            disabled={blendOps.isLoading}
            style={{
              width: '100%',
              background: '#f97316',
              color: 'white',
              border: 'none',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer',
              position: 'relative',
              zIndex: 1001
            }}
          >
            {blendOps.isLoading ? 'Loading...' : 'Repay'}
          </button>
        </div>

        {/* Withdraw */}
        <div style={{ 
          background: '#1e293b', 
          border: '1px solid #334155', 
          borderRadius: '12px', 
          padding: '20px',
          color: 'white'
        }}>
          <h3 style={{ marginBottom: '15px', color: '#ef4444' }}>🏦 Withdraw</h3>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#94a3b8' }}>
              Amount (stroops)
            </label>
            <input
              type="text"
              value={formData.withdrawAmount}
              onChange={(e) => handleInputChange('withdrawAmount', e.target.value)}
              placeholder="500000"
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #475569',
                background: '#0f172a',
                color: 'white',
                fontSize: '14px',
                position: 'relative',
                zIndex: 1001
              }}
            />
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '5px' }}>
              = {(Number(formData.withdrawAmount) / 10000000).toFixed(2)} SRWA
            </p>
          </div>
          <button
            onClick={() => handleOperation(() => 
              blendOps.withdrawCollateral({
                poolAddress: formData.poolAddress,
                token: formData.tokenAddress,
                amount: formData.withdrawAmount,
              }), "Withdraw"
            )}
            disabled={blendOps.isLoading}
            style={{
              width: '100%',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer',
              position: 'relative',
              zIndex: 1001
            }}
          >
            {blendOps.isLoading ? 'Loading...' : 'Withdraw'}
          </button>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div style={{ 
          background: '#064e3b', 
          border: '1px solid #22c55e', 
          borderRadius: '12px', 
          padding: '20px',
          color: 'white'
        }}>
          <h3 style={{ marginBottom: '15px', color: '#22c55e' }}>✅ Operation Successful</h3>
          <p style={{ marginBottom: '10px' }}>
            <strong>Operation:</strong> {result.operation || 'Unknown'}
          </p>
          {result.transactionHash && (
            <div>
              <p style={{ marginBottom: '10px' }}>
                <strong>Transaction:</strong> {
                  typeof result.transactionHash === 'string' 
                    ? result.transactionHash.slice(0, 12) + '...'
                    : result.transactionHash?.sendTransactionResponse?.hash?.slice(0, 12) + '...' || 'Unknown'
                }
              </p>
              <button
                onClick={() => {
                  const hash = typeof result.transactionHash === 'string' 
                    ? result.transactionHash 
                    : result.transactionHash?.sendTransactionResponse?.hash || '';
                  if (hash) {
                    window.open(
                      `https://stellar.expert/explorer/testnet/tx/${hash}`,
                      '_blank'
                    );
                  }
                }}
                style={{
                  background: '#22c55e',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  position: 'relative',
                  zIndex: 1001
                }}
              >
                View on Explorer →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Contract Info */}
      <div style={{ 
        background: '#1e293b', 
        border: '1px solid #334155', 
        borderRadius: '12px', 
        padding: '20px',
        marginTop: '30px',
        color: 'white'
      }}>
        <h3 style={{ marginBottom: '15px', color: '#f1f5f9' }}>📋 Contract References</h3>
        <div style={{ display: 'grid', gap: '10px' }}>
          {Object.entries(BLEND_CONTRACTS).map(([name, id]) => (
            <div key={name} style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '8px 12px',
              background: '#0f172a',
              borderRadius: '6px'
            }}>
              <span style={{ fontSize: '14px', textTransform: 'capitalize' }}>
                {name.replace(/([A-Z])/g, ' $1').toLowerCase()}:
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <code style={{ fontSize: '12px', color: '#94a3b8' }}>
                  {id.slice(0, 8)}...{id.slice(-4)}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(id)}
                  style={{
                    background: 'transparent',
                    border: '1px solid #475569',
                    color: '#94a3b8',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    position: 'relative',
                    zIndex: 1001
                  }}
                >
                  Copy
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
