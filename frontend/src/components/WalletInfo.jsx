'use client';

import { useState } from 'react';
import { useAccount, useDisconnect, useBalance } from 'wagmi';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import styles from '../app/page.module.css';

const WalletInfo = () => {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { open } = useWeb3Modal();
  const [showActivity, setShowActivity] = useState(false);
  const { data: balanceData } = useBalance({ address });

  if (!isConnected) {
    return (
      <button 
        onClick={() => open()} 
        className={styles.customConnectButton}
      >
        <span className={styles.buttonGlow}></span>
        Connect Wallet
      </button>
    );
  }

  const formatAddress = (addr) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const handleShowActivity = () => {
    setShowActivity(!showActivity);
  };

  return (
    <div className={styles.walletInfoPill}>
      <span className={styles.ethBalance}>
        {balanceData ? `${parseFloat(balanceData.formatted).toFixed(3)} ETH` : '...'}
      </span>
      <span className={styles.statusDot} />
      <button 
        onClick={handleShowActivity}
        className={styles.walletAddressButton}
        style={{ background: 'transparent', border: 'none', padding: 0, color: 'inherit' }}
      >
        {formatAddress(address)}
      </button>
      {showActivity && (
        <div className={styles.walletActivityContainer}>
          <h3>Wallet Activity</h3>
          <div className={styles.activityList}>
            {/* You can add actual transaction history here */}
            <p>No recent activity</p>
            <button 
              onClick={handleDisconnect}
              className={styles.disconnectButton}
              style={{ marginTop: '1rem' }}
            >
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletInfo; 