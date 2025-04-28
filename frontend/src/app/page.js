'use client';

import {
  CryptoDevsDAOABI,
  CryptoDevsDAOAddress,
  CryptoDevsNFTABI,
  CryptoDevsNFTAddress,
} from '@/constants';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import { formatEther } from 'viem/utils';
import {
  useAccount,
  useBalance,
  useReadContract,
  useConfig,
} from 'wagmi';
import {
  readContract,
  waitForTransactionReceipt,
  writeContract,
} from 'wagmi/actions';
import { Inter } from 'next/font/google';
import './globals.css';
import styles from './page.module.css';
import WalletInfo from '@/components/WalletInfo';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export default function Home() {
  const { address, isConnected } = useAccount();
  const wagmiConfig = useConfig();

  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fakeNftTokenId, setFakeNftTokenId] = useState('');
  const [proposals, setProposals] = useState([]);
  const [selectedTab, setSelectedTab] = useState('');

  const { data: daoOwner, isLoading: isLoadingOwner } = useReadContract({
    abi: CryptoDevsDAOABI,
    address: CryptoDevsDAOAddress,
    functionName: 'owner',
  });

  const { data: daoBalance, isLoading: isLoadingDaoBalance } = useBalance({
    address: CryptoDevsDAOAddress,
  });

  const { data: numOfProposalsInDAO, isLoading: isLoadingNumProposals } = useReadContract({
    abi: CryptoDevsDAOABI,
    address: CryptoDevsDAOAddress,
    functionName: 'numProposals',
  });

  const { data: nftBalanceOfUser, isLoading: isLoadingNftBalance } = useReadContract({
    abi: CryptoDevsNFTABI,
    address: CryptoDevsNFTAddress,
    functionName: 'balanceOf',
    args: [address],
  });

  async function createProposal() {
    setLoading(true);
    try {
      const tx = await writeContract(wagmiConfig, {
        address: CryptoDevsDAOAddress,
        abi: CryptoDevsDAOABI,
        functionName: 'createProposal',
        args: [fakeNftTokenId],
      });
      await waitForTransactionReceipt(wagmiConfig, { hash: tx });
      window.alert("Proposal created successfully!");
      setFakeNftTokenId(''); // Clear input after success
      fetchAllProposals(); // Refresh proposals
    } catch (error) {
      console.error(error);
      if (error.message.includes('User rejected the request')) {
        window.alert('Transaction rejected by user.');
      } else {
        window.alert(`Error creating proposal: ${error.message}`);
      }
    }
    setLoading(false);
  }

  async function fetchProposalById(id) {
    try {
      const proposal = await readContract(wagmiConfig, {
        address: CryptoDevsDAOAddress,
        abi: CryptoDevsDAOABI,
        functionName: 'proposals',
        args: [id],
      });
      const [nftTokenId, deadline, yesVotes, noVotes, executed] = proposal;
      return {
        proposalId: id,
        nftTokenId: String(nftTokenId),
        deadline: new Date(Number(deadline) * 1000),
        yesVotes: String(yesVotes),
        noVotes: String(noVotes),
        executed: Boolean(executed),
      };
    } catch (error) {
      console.error(error);
      window.alert(error);
    }
  }

  async function fetchAllProposals() {
    try {
      const total = Number(numOfProposalsInDAO);
      const proposalsList = [];
      for (let i = 0; i < total; i++) {
        const proposal = await fetchProposalById(i);
        proposalsList.push(proposal);
      }
      setProposals(proposalsList);
      return proposalsList;
    } catch (error) {
      console.error(error);
      window.alert(error);
    }
  }

  async function voteForProposal(proposalId, vote) {
    setLoading(true);
    try {
      const tx = await writeContract(wagmiConfig, {
        address: CryptoDevsDAOAddress,
        abi: CryptoDevsDAOABI,
        functionName: 'voteOnProposal',
        args: [proposalId, vote === 'YES' ? 0 : 1],
      });
      await waitForTransactionReceipt(wagmiConfig, { hash: tx });
      window.alert("Vote cast successfully!");
      fetchAllProposals(); // Refresh proposals
    } catch (error) {
      console.error(error);
      if (error.message.includes('User rejected the request')) {
        window.alert('Transaction rejected by user.');
      } else {
        window.alert(`Error voting on proposal: ${error.message}`);
      }
    }
    setLoading(false);
  }

  async function executeProposal(proposalId) {
    setLoading(true);
    try {
      const tx = await writeContract(wagmiConfig, {
        address: CryptoDevsDAOAddress,
        abi: CryptoDevsDAOABI,
        functionName: 'executeProposal',
        args: [proposalId],
      });
      await waitForTransactionReceipt(wagmiConfig, { hash: tx });
      window.alert("Proposal executed successfully!");
      fetchAllProposals(); // Refresh proposals
    } catch (error) {
      console.error(error);
      if (error.message.includes('User rejected the request')) {
        window.alert('Transaction rejected by user.');
      } else {
        window.alert(`Error executing proposal: ${error.message}`);
      }
    }
    setLoading(false);
  }

  async function withdrawDAOEther() {
    setLoading(true);
    try {
      const tx = await writeContract(wagmiConfig, {
        address: CryptoDevsDAOAddress,
        abi: CryptoDevsDAOABI,
        functionName: 'withdrawEther',
        args: [],
      });
      await waitForTransactionReceipt(wagmiConfig, { hash: tx });
      window.alert("DAO funds withdrawn successfully!");
    } catch (error) {
      console.error(error);
      if (error.message.includes('User rejected the request')) {
        window.alert('Transaction rejected by user.');
      } else {
        window.alert(`Error withdrawing funds: ${error.message}`);
      }
    }
    setLoading(false);
  }

  function renderStats() {
    return (
      <div className={styles.statsContainer}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>DAO Balance</div>
          <div className={styles.statValue}>
            {daoBalance ? formatEther(daoBalance.value) : '0'} ETH
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Your NFTs</div>
          <div className={styles.statValue}>
            {nftBalanceOfUser ? String(nftBalanceOfUser) : '0'}
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Active Proposals</div>
          <div className={styles.statValue}>
            {numOfProposalsInDAO ? String(numOfProposalsInDAO) : '0'}
          </div>
        </div>
      </div>
    );
  }

  function renderTabs() {
    return (
      <div className={styles.tabContainer}>
        <button
          className={`${styles.tabButton} ${selectedTab === 'Create Proposal' ? styles.activeTab : ''}`}
          onClick={() => setSelectedTab('Create Proposal')}
        >
          Create Proposal
        </button>
        <button
          className={`${styles.tabButton} ${selectedTab === 'View Proposals' ? styles.activeTab : ''}`}
          onClick={() => setSelectedTab('View Proposals')}
        >
          View Proposals
        </button>
      </div>
    );
  }

  function renderCreateProposalTab() {
    return (
      <div className={styles.proposalCard}>
        <h3 className={styles.proposalTitle}>Create a New Proposal</h3>
        <div className={styles.proposalInfo}>
          <input
            type="number"
            placeholder="NFT Token ID to Purchase"
            value={fakeNftTokenId}
            onChange={(e) => setFakeNftTokenId(e.target.value)}
            min={0}
            required
          />
          <button
            className={styles.executeButton}
            disabled={loading}
            onClick={createProposal}
          >
            {loading ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    );
  }

  function renderViewProposalsTab() {
    return proposals.map((proposal) => (
      <div key={proposal.proposalId} className={styles.proposalCard}>
        <h3 className={styles.proposalTitle}>Proposal #{proposal.proposalId}</h3>
        <div className={styles.proposalInfo}>
          <div className={styles.proposalStat}>
            <div className={styles.statLabel}>NFT ID</div>
            <div className={styles.statValue}>{proposal.nftTokenId}</div>
          </div>
          <div className={styles.proposalStat}>
            <div className={styles.statLabel}>Deadline</div>
            <div>{proposal.deadline.toLocaleString()}</div>
          </div>
          <div className={styles.proposalStat}>
            <div className={styles.statLabel}>Yes Votes</div>
            <div className={styles.statValue}>{proposal.yesVotes}</div>
          </div>
          <div className={styles.proposalStat}>
            <div className={styles.statLabel}>No Votes</div>
            <div className={styles.statValue}>{proposal.noVotes}</div>
          </div>
          <div className={styles.proposalStat}>
            <div className={styles.statLabel}>Executed</div>
            <div>{proposal.executed ? 'Yes' : 'No'}</div>
          </div>
        </div>
        {!proposal.executed && (
          <>
            <div className={styles.voteButtons}>
              <button
                className={`${styles.tabButton} ${styles.voteYes}`}
                onClick={() => voteForProposal(proposal.proposalId, 'YES')}
                disabled={loading}
              >
                YES
              </button>
              <button
                className={`${styles.tabButton} ${styles.voteNo}`}
                onClick={() => voteForProposal(proposal.proposalId, 'NO')}
                disabled={loading}
              >
                NO
              </button>
            </div>
            <button
              className={styles.executeButton}
              onClick={() => executeProposal(proposal.proposalId)}
              disabled={loading}
            >
              Execute Proposal
            </button>
          </>
        )}
      </div>
    ));
  }

  function renderLoadingOverlay() {
    if (!loading) return null;
    return (
      <div className={styles.loadingOverlay}>
        <div className={styles.loadingSpinner} />
      </div>
    );
  }

  useEffect(() => {
    console.log("Connection Status:", isConnected);
    if (isConnected && address) {
      console.log("Connected Address:", address);
      console.log("Fetching Balances for address:", address);
    } else {
      console.log("Not Connected or Address not available yet.");
    }
  }, [isConnected, address]);

  useEffect(() => {
    if (isConnected) {
      console.log("DAO Balance Data:", daoBalance ? formatEther(daoBalance.value) : 'Loading...');
      console.log("NFT Balance Data:", nftBalanceOfUser !== undefined ? String(nftBalanceOfUser) : 'Loading...');
      console.log("Number of Proposals:", numOfProposalsInDAO !== undefined ? String(numOfProposalsInDAO) : 'Loading...');
      console.log("DAO Owner:", daoOwner);
      console.log("Connected Address:", address);
      console.log("Is Owner:", daoOwner?.toLowerCase() === address?.toLowerCase());
    }
  }, [daoBalance, nftBalanceOfUser, numOfProposalsInDAO, daoOwner, isConnected, address]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (selectedTab === 'View Proposals' && isConnected) {
      fetchAllProposals();
    }
  }, [selectedTab, isConnected]);

  if (!isMounted) return null;

  if (!isConnected) {
    return (
      <div className={styles.main}>
        <div className={styles.container}>
          <h1 className={styles.title}>Welcome to CryptoDevs DAO</h1>
          <p className="text-center">Connect your wallet to get started</p>
          <div className="flex justify-center mt-8">
            <WalletInfo />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.main}>
      <Head>
        <title>CryptoDevs DAO</title>
        <meta name="description" content="CryptoDevs DAO - A Decentralized Autonomous Organization" />
      </Head>
      <WalletInfo />
      <div className={styles.container}>
        <h1 className={styles.title}>Welcome to CryptoDevs DAO</h1>
        <p className="text-center mb-8">A Decentralized Autonomous Organization for CryptoDevs NFT Holders</p>
        {renderStats()}
        {renderTabs()}
        {selectedTab === 'Create Proposal' && renderCreateProposalTab()}
        {selectedTab === 'View Proposals' && renderViewProposalsTab()}
        {daoOwner && address && daoOwner.toLowerCase() === address.toLowerCase() && (
          <div className={styles.proposalCard}>
            <h3 className={styles.proposalTitle}>Admin Panel</h3>
            <button
              className={styles.executeButton}
              onClick={withdrawDAOEther}
              disabled={loading}
            >
              Withdraw DAO ETH
            </button>
          </div>
        )}
        {renderLoadingOverlay()}
      </div>
    </div>
  );
}
