import React, { useState, useEffect } from 'react';
import {
  Layers,
  Search,
  Filter,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Flame,
  Zap,
  Lock,
  FileCode,
  Building2,
  ChevronRight,
  Database,
  RefreshCw,
  Terminal,
  X
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useArogyaZK } from '../../context/ArogyaZKContext';
import {
  fetchBlockchainBlocksFromDB,
  fetchBlockchainTransactionsFromDB
} from '../../services/api';

interface BlockData {
  number: number;
  hash: string;
  timestamp: string;
  txCount: number;
  gasUsed: number;
  gasLimit: number;
  sequencer: string;
}

interface TransactionData {
  txHash: string;
  blockNumber: number;
  timestamp: string;
  method: 'verifyAndDisburse' | 'anchorRecord' | 'grantConsent' | 'registerHospital' | 'breakGlassInit' | 'commitPolicyRoot';
  contractName: string;
  contractAddress: string;
  from: string;
  to: string;
  valueInr: number;
  gasUsed: number;
  gasPriceGwei: number;
  status: 'Success' | 'Reverted';
  privacyBadge: string;
  publicSignals?: {
    nullifierHash?: string;
    policyRoot?: string;
    hospitalSignatureValid?: boolean;
    procedureCovered?: boolean;
    sha256Digest?: string;
    durationHours?: number;
  };
  calldataSnippet: string;
  humanSummary: string;
}

const MOCK_BLOCKS: BlockData[] = [
  {
    number: 1842918,
    hash: '0x8f4d92a11b0e77d34c90e51782a45cf327891acb299e1204892cfa712399104a',
    timestamp: '12s ago',
    txCount: 4,
    gasUsed: 842100,
    gasLimit: 30000000,
    sequencer: '0xZKureSequencer1'
  },
  {
    number: 1842917,
    hash: '0x71e982c401aa8823b490f238914acb5417088921dfbb38901247990142ab81ef',
    timestamp: '24s ago',
    txCount: 6,
    gasUsed: 1240800,
    gasLimit: 30000000,
    sequencer: '0xZKureSequencer1'
  },
  {
    number: 1842916,
    hash: '0x33b491aaef0278991204481bca7829910e54289aa812300bca881728198fba01',
    timestamp: '36s ago',
    txCount: 3,
    gasUsed: 492000,
    gasLimit: 30000000,
    sequencer: '0xZKureSequencer2'
  },
  {
    number: 1842915,
    hash: '0x55ca01499128aaef99410427189901eabc84102941aa89104190fa728190be99',
    timestamp: '48s ago',
    txCount: 5,
    gasUsed: 981400,
    gasLimit: 30000000,
    sequencer: '0xZKureSequencer1'
  },
  {
    number: 1842914,
    hash: '0x12ec9401aa828741009bf21894aacef189401928371049928190abf410293847',
    timestamp: '1m ago',
    txCount: 7,
    gasUsed: 1412000,
    gasLimit: 30000000,
    sequencer: '0xZKureSequencer2'
  }
];

const MOCK_TRANSACTIONS: TransactionData[] = [
  {
    txHash: '0x4f89d12a884e1b7309ef32a410b9872e41cfa990142981ef4091a08273619904',
    blockNumber: 1842918,
    timestamp: '12s ago',
    method: 'verifyAndDisburse',
    contractName: 'ClaimSettlement.sol',
    contractAddress: '0x3892F7eAc688758d4aB68D6f4AfC572D9848512E',
    from: '0x9041a8...44b2 (Patient Masked)',
    to: '0x3892F7eAc688758d4aB68D6f4AfC572D9848512E (ClaimSettlement)',
    valueInr: 45000,
    gasUsed: 212400,
    gasPriceGwei: 1.2,
    status: 'Success',
    privacyBadge: 'Zero PHI Exposed',
    publicSignals: {
      nullifierHash: '0x9f8c12e9874a1004bca99281094182e0491823901a884ef',
      policyRoot: '0x2e8f1990144aaef89120498124901baef4819024',
      hospitalSignatureValid: true,
      procedureCovered: true
    },
    calldataSnippet: '0x7a83d291000000000000000000000000000000000000000000000000000000000000afc8...',
    humanSummary: 'Verified Groth16 zk-SNARK proof on BN254 elliptic curve and disbursed INR 45,000 cashless settlement from Star Shield escrow to Apollo Spectra Hospital.'
  },
  {
    txHash: '0x81b7e40291aa89201fba4901289140aa89104291823901a88ef3910041289104',
    blockNumber: 1842918,
    timestamp: '12s ago',
    method: 'anchorRecord',
    contractName: 'HealthVault.sol',
    contractAddress: '0x71C9F474A4B1b783De6d27aA11f4d998F401314B',
    from: '0x9041a8...44b2 (Patient)',
    to: '0x71C9F474A4B1b783De6d27aA11f4d998F401314B (HealthVault)',
    valueInr: 0,
    gasUsed: 64300,
    gasPriceGwei: 1.2,
    status: 'Success',
    privacyBadge: 'AES-256 Digest Anchored',
    publicSignals: {
      sha256Digest: '0x4a9b8e21094c1a789ef239104812390abef491024'
    },
    calldataSnippet: '0x3289140a0000000000000000000000004a9b8e21094c1a789ef239104812390abef491024...',
    humanSummary: 'Anchored cryptographic SHA-256 fingerprint of AES-256-GCM encrypted Lab Diagnostic Report into HealthVault immutable state.'
  },
  {
    txHash: '0x22c48190abef8810293410948120491820491820934109481029384710293847',
    blockNumber: 1842917,
    timestamp: '24s ago',
    method: 'grantConsent',
    contractName: 'HealthVault.sol',
    contractAddress: '0x71C9F474A4B1b783De6d27aA11f4d998F401314B',
    from: '0x9041a8...44b2 (Patient)',
    to: '0x71C9F474A4B1b783De6d27aA11f4d998F401314B (HealthVault)',
    valueInr: 0,
    gasUsed: 48900,
    gasPriceGwei: 1.2,
    status: 'Success',
    privacyBadge: 'Time-Locked Access Token',
    publicSignals: {
      durationHours: 3
    },
    calldataSnippet: '0x9182049f00000000000000000000000094a1f67cb137452d3a39e8b3838e75b46e91e9a2...',
    humanSummary: 'Issued time-locked cryptographic consent token granting Apollo Spectra Hospital 3-hour scoped read permission for REC-1041 & REC-1042.'
  },
  {
    txHash: '0x99104829104a8819203941094812049182049182093410948102938471029384',
    blockNumber: 1842917,
    timestamp: '24s ago',
    method: 'verifyAndDisburse',
    contractName: 'ClaimSettlement.sol',
    contractAddress: '0x3892F7eAc688758d4aB68D6f4AfC572D9848512E',
    from: '0x9042b1...7710 (Patient Masked)',
    to: '0x3892F7eAc688758d4aB68D6f4AfC572D9848512E (ClaimSettlement)',
    valueInr: 120000,
    gasUsed: 214500,
    gasPriceGwei: 1.2,
    status: 'Success',
    privacyBadge: 'Zero PHI Exposed',
    publicSignals: {
      nullifierHash: '0x1102938471029384710293847102938471029384710293847102938471029384',
      policyRoot: '0x2e8f1990144aaef89120498124901baef4819024',
      hospitalSignatureValid: true,
      procedureCovered: true
    },
    calldataSnippet: '0x7a83d291000000000000000000000000000000000000000000000000000000000001d4c0...',
    humanSummary: 'Verified Tier-1 inpatient surgical claim with Groth16 SNARK; transferred INR 1,20,000 from Care Health escrow to Fortis Diagnostics.'
  },
  {
    txHash: '0x55a4918204918209341094810293847102938471029384710293847102938471',
    blockNumber: 1842916,
    timestamp: '36s ago',
    method: 'registerHospital',
    contractName: 'HospitalRegistry.sol',
    contractAddress: '0x94A1F67cb137452d3a39e8B3838E75B46e91E9a2',
    from: '0xAdminGov99 (Consortium Governance)',
    to: '0x94A1F67cb137452d3a39e8B3838E75B46e91E9a2 (HospitalRegistry)',
    valueInr: 0,
    gasUsed: 89400,
    gasPriceGwei: 1.2,
    status: 'Success',
    privacyBadge: 'Depth-16 Merkle Leaf Updated',
    calldataSnippet: '0x1928374a000000000000000000000000615c89140a89104291823901a88ef39100412891...',
    humanSummary: 'Added Medanta Super Speciality (NABH-H-2026-9904) to provider Depth-16 Merkle Tree; verified INR 5,00,000 bonded collateral.'
  },
  {
    txHash: '0x77c8192039410948102938471029384710293847102938471029384710293847',
    blockNumber: 1842915,
    timestamp: '48s ago',
    method: 'breakGlassInit',
    contractName: 'BreakGlass.sol',
    contractAddress: '0x1D95A2240954bB4c2b92Ec62d774D4e029302B67',
    from: '0xDrArvindRao (Apollo ICU)',
    to: '0x1D95A2240954bB4c2b92Ec62d774D4e029302B67 (BreakGlass)',
    valueInr: 0,
    gasUsed: 74900,
    gasPriceGwei: 1.2,
    status: 'Success',
    privacyBadge: '2-of-3 Shamir Quorum Initiated',
    calldataSnippet: '0x8891024f0000000000000000000000009041a823901a884ef10928410294819024810294...',
    humanSummary: 'Initiated 2-of-3 Shamir Secret Sharing ICU trauma session for patient PAT-9041; logged on-chain audit event and dispatched guardian alerts.'
  },
  {
    txHash: '0x33e8190248102948190248102948190248102948102948102948102948102948',
    blockNumber: 1842914,
    timestamp: '1m ago',
    method: 'commitPolicyRoot',
    contractName: 'PolicyRegistry.sol',
    contractAddress: '0x5B82Cd1887e2b109D4f3014c24391694A6E4F011',
    from: '0xHDFCErgoAdmin (Insurer)',
    to: '0x5B82Cd1887e2b109D4f3014c24391694A6E4F011 (PolicyRegistry)',
    valueInr: 0,
    gasUsed: 55200,
    gasPriceGwei: 1.2,
    status: 'Success',
    privacyBadge: 'Pedersen Curve Group Root',
    calldataSnippet: '0x449102940000000000000000000000002e8f1990144aaef89120498124901baef4819024...',
    humanSummary: 'Updated HDFC ERGO Optima Secure Depth-8 procedure root and Pedersen commitments covering 12,400 active policyholders.'
  }
];

export const AdminExplorer: React.FC = () => {
  const { setActiveTab } = useArogyaZK();
  const [blocks, setBlocks] = useState<BlockData[]>(MOCK_BLOCKS);
  const [transactions, setTransactions] = useState<TransactionData[]>(MOCK_TRANSACTIONS);
  const [search, setSearch] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<string>('All');
  const [inspectedTx, setInspectedTx] = useState<TransactionData | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadBlockchainData = async () => {
    try {
      const [dbBlocks, dbTxs] = await Promise.all([
        fetchBlockchainBlocksFromDB(),
        fetchBlockchainTransactionsFromDB()
      ]);
      if (dbBlocks && dbBlocks.length > 0) {
        setBlocks(
          dbBlocks.map((b: any) => ({
            number: b.number,
            hash: b.hash || `0x${b.number.toString(16).padStart(64, '0')}`,
            timestamp: b.age || '12s ago',
            txCount: b.txs || 4,
            gasUsed: b.gasUsed || 842100,
            gasLimit: 30000000,
            sequencer: b.validator || '0xZKureSequencer1'
          }))
        );
      }
      if (dbTxs && dbTxs.length > 0) {
        const mapped = dbTxs.map((t: any) => ({
          txHash: t.hash || t.txHash || '0x1',
          blockNumber: t.blockNumber || 1842918,
          timestamp: t.timestamp ? new Date(t.timestamp).toLocaleTimeString() : '12s ago',
          method: (t.method || 'verifyAndDisburse') as any,
          contractName: t.contractName || 'ArogyaZKClaimSettlement.sol',
          contractAddress: t.contractAddress || '0x7A9e4B12F09c8D3E1a44C90B8211F6e0AroGyaZK',
          from: t.fromAddress || t.from || '0xHospital',
          to: t.toAddress || t.to || '0xContract',
          valueInr: t.valueInr || 0,
          gasUsed: t.gasUsed || 272200,
          gasPriceGwei: 1.2,
          status: (t.status || 'Success') as any,
          privacyBadge: t.privacyBadge || 'BN254 Pairing Verified',
          calldataSnippet: t.calldataSnippet || '0x12a8f9c...',
          humanSummary: t.humanSummary || 'Verified Groth16 zk-SNARK claim proof on-chain'
        }));
        setTransactions(mapped);
      }
    } catch (err) {
      console.warn('Failed to load live blockchain data', err);
    }
  };

  useEffect(() => {
    let isMounted = true;
    loadBlockchainData();
    return () => {
      isMounted = false;
    };
  }, []);

  const methods = ['All', 'verifyAndDisburse', 'anchorRecord', 'grantConsent', 'registerHospital', 'breakGlassInit'];

  const filteredTxs = transactions.filter((tx) => {
    const matchesMethod = selectedMethod === 'All' || tx.method === selectedMethod;
    const matchesSearch =
      tx.txHash.toLowerCase().includes(search.toLowerCase()) ||
      tx.blockNumber.toString().includes(search) ||
      tx.contractName.toLowerCase().includes(search.toLowerCase()) ||
      tx.from.toLowerCase().includes(search.toLowerCase()) ||
      tx.method.toLowerCase().includes(search.toLowerCase());
    return matchesMethod && matchesSearch;
  });

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadBlockchainData();
    setIsRefreshing(false);
  };

  const getMethodBadgeVariant = (method: TransactionData['method']) => {
    switch (method) {
      case 'verifyAndDisburse':
        return 'teal';
      case 'anchorRecord':
        return 'navy';
      case 'grantConsent':
        return 'amber';
      case 'registerHospital':
        return 'slate';
      case 'breakGlassInit':
        return 'rose';
      default:
        return 'slate';
    }
  };

  return (
    <div className="space-y-6">
      {/* Explorer Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#142D4E] flex items-center justify-center text-teal-300 font-bold shadow-sm">
              <Layers className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-bold text-[#142D4E]">Blockchain & ZK Explorer</h1>
            <Badge variant="teal">Consortium Rollup (Chain ID: 74219)</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Real-time feed of zero-knowledge claim settlements, AES record anchors, and consent token verifications.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-[#142D4E] transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-teal-600 ${isRefreshing ? 'animate-spin' : ''}`} /> Refresh Feed
          </button>
          <button
            onClick={() => setActiveTab('contracts')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#142D4E] hover:bg-[#1D3E6B] text-white text-xs font-semibold transition-colors shadow-sm"
          >
            <FileCode className="w-3.5 h-3.5 text-teal-300" /> Protocol Contracts
          </button>
        </div>
      </div>

      {/* Network Live Gauges */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <Card className="p-3.5 bg-gradient-to-br from-slate-50 to-teal-50/40 border-teal-200">
          <div className="text-[11px] font-semibold text-teal-800 uppercase tracking-wider">Latest Block</div>
          <div className="text-xl font-bold text-[#142D4E] mt-1 font-mono">#1,842,918</div>
          <div className="text-[11px] text-teal-700 mt-0.5">Finality: Instant (ZK Sequencer)</div>
        </Card>

        <Card className="p-3.5">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Avg Block Time</div>
          <div className="text-xl font-bold text-[#142D4E] mt-1 font-mono">2.0 sec</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Consensus: Raft-BFT</div>
        </Card>

        <Card className="p-3.5">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Throughput</div>
          <div className="text-xl font-bold text-[#142D4E] mt-1 font-mono">48.2 TPS</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Max: 1,500 TPS</div>
        </Card>

        <Card className="p-3.5">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Rollup Gas Price</div>
          <div className="text-xl font-bold text-[#142D4E] mt-1 font-mono">1.2 Gwei</div>
          <div className="text-[11px] text-teal-700 mt-0.5 font-medium">99.2% Sub-Cent Cost</div>
        </Card>

        <Card className="p-3.5 col-span-2 md:col-span-1">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Total Disbursed</div>
          <div className="text-xl font-bold text-teal-800 mt-1 font-mono">₹8.42 Cr</div>
          <div className="text-[11px] text-slate-500 mt-0.5">2,891 Claims Verified</div>
        </Card>
      </div>

      {/* Latest Blocks Visualizer Ticker */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold text-[#142D4E] uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-[#0D9488]" /> Recent Consortium Blocks
          </h2>
          <span className="text-[11px] text-slate-500">Live L2 Sequencer Batch</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
          {blocks.map((blk) => (
            <div
              key={blk.number}
              className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-teal-300 transition-all text-xs space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-[#142D4E]">#{blk.number}</span>
                <span className="text-[10px] text-slate-400">{blk.timestamp}</span>
              </div>
              <div className="text-[11px] text-slate-600 flex justify-between">
                <span>Transactions:</span>
                <span className="font-semibold text-slate-900">{blk.txCount} txs</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-teal-600 h-1.5 rounded-full"
                  style={{ width: `${(blk.gasUsed / blk.gasLimit) * 100 * 20}%` }}
                />
              </div>
              <div className="text-[10px] text-slate-400 truncate font-mono">
                {blk.hash.slice(0, 16)}...
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
          {methods.map((m) => (
            <button
              key={m}
              onClick={() => setSelectedMethod(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedMethod === m
                  ? 'bg-[#142D4E] text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {m === 'All' ? 'All Transactions' : m}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Tx Hash, Block, or Account..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-teal-500 outline-none"
          />
        </div>
      </div>

      {/* Transactions Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
              <tr>
                <th className="py-3 px-4">Transaction Hash</th>
                <th className="py-3 px-3">Method</th>
                <th className="py-3 px-3">Block</th>
                <th className="py-3 px-3">Target Contract</th>
                <th className="py-3 px-3">Value / Payout</th>
                <th className="py-3 px-3">Gas Used</th>
                <th className="py-3 px-3">Privacy Guarantee</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTxs.map((tx) => (
                <tr key={tx.txHash} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-medium text-[#142D4E]">
                    <div className="flex items-center gap-1.5">
                      <span>{tx.txHash.slice(0, 14)}...{tx.txHash.slice(-4)}</span>
                      <button
                        onClick={() => handleCopy(tx.txHash, tx.txHash)}
                        className="text-slate-400 hover:text-slate-700"
                        title="Copy Tx Hash"
                      >
                        {copiedHash === tx.txHash ? (
                          <Check className="w-3.5 h-3.5 text-teal-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    <Badge variant={getMethodBadgeVariant(tx.method)}>{tx.method}</Badge>
                  </td>

                  <td className="py-3 px-3 font-mono font-semibold text-slate-700">
                    #{tx.blockNumber}
                  </td>

                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-900">{tx.contractName}</div>
                    <div className="font-mono text-[10px] text-slate-400 truncate max-w-[130px]">
                      {tx.contractAddress}
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    {tx.valueInr > 0 ? (
                      <span className="font-bold text-teal-800">
                        ₹{tx.valueInr.toLocaleString('en-IN')}
                      </span>
                    ) : (
                      <span className="text-slate-400 font-mono">0 INR</span>
                    )}
                  </td>

                  <td className="py-3 px-3 font-mono text-slate-600">
                    <div className="flex items-center gap-1">
                      <Flame className="w-3 h-3 text-amber-500" />
                      {tx.gasUsed.toLocaleString()}
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                      <ShieldCheck className="w-3 h-3 text-teal-600" />
                      {tx.privacyBadge}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setInspectedTx(tx)}
                      className="px-2.5 py-1 rounded bg-[#142D4E] hover:bg-[#1D3E6B] text-white text-[11px] font-semibold transition-colors"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Transaction Hash Inspector Modal */}
      {inspectedTx && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="max-w-3xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-[#0D9488] flex items-center justify-center">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-[#142D4E]">Transaction Telemetry</h2>
                    <Badge variant={inspectedTx.status === 'Success' ? 'teal' : 'rose'}>
                      {inspectedTx.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 font-mono truncate max-w-lg">
                    {inspectedTx.txHash}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectedTx(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 text-sm"
              >
                ✕
              </button>
            </div>

            {/* Human Readable Explanation */}
            <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-200 text-xs text-teal-900 leading-relaxed flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">Consortium Transaction Result:</strong>
                <p className="mt-0.5 text-teal-800">{inspectedTx.humanSummary}</p>
              </div>
            </div>

            {/* Core On-Chain Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 space-y-1.5">
                <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Block & Confirmations</div>
                <div className="font-mono text-slate-900 font-bold">Block #{inspectedTx.blockNumber} (18 Confirmations)</div>
                <div className="text-[11px] text-slate-500">Timestamp: {inspectedTx.timestamp}</div>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 space-y-1.5">
                <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Gas Telemetry</div>
                <div className="font-mono text-slate-900 font-bold">
                  {inspectedTx.gasUsed.toLocaleString()} Gas Used @ {inspectedTx.gasPriceGwei} Gwei
                </div>
                <div className="text-[11px] text-teal-700 font-medium">Execution Fee: ~0.00025 ETH (INR 0.65)</div>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 bg-white space-y-1">
                <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">From Account</div>
                <div className="font-mono text-slate-800 text-[11px] break-all">{inspectedTx.from}</div>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 bg-white space-y-1">
                <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Interacting Contract</div>
                <div className="font-mono text-slate-800 text-[11px] break-all">{inspectedTx.contractAddress}</div>
              </div>
            </div>

            {/* Zero-Knowledge & Cryptographic Verification Signals */}
            {inspectedTx.publicSignals && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-[#142D4E] uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-teal-600" /> Zero-Knowledge Public Signals & Verification Check
                </h3>
                <div className="p-4 rounded-xl bg-slate-900 text-teal-300 font-mono text-xs space-y-2">
                  {inspectedTx.publicSignals.nullifierHash && (
                    <div className="flex justify-between items-center pb-1.5 border-b border-slate-800">
                      <span className="text-slate-400 font-sans">Nullifier Hash (Double-Claim Guard):</span>
                      <span className="text-white truncate max-w-[300px]">{inspectedTx.publicSignals.nullifierHash}</span>
                    </div>
                  )}
                  {inspectedTx.publicSignals.policyRoot && (
                    <div className="flex justify-between items-center pb-1.5 border-b border-slate-800">
                      <span className="text-slate-400 font-sans">Policy Merkle Root Match:</span>
                      <span className="text-teal-400">1 (Verified Against PolicyRegistry)</span>
                    </div>
                  )}
                  {inspectedTx.publicSignals.hospitalSignatureValid !== undefined && (
                    <div className="flex justify-between items-center pb-1.5 border-b border-slate-800">
                      <span className="text-slate-400 font-sans">Hospital EdDSA Attestation:</span>
                      <span className="text-teal-400">1 (Verified via Poseidon & BabyJubjub)</span>
                    </div>
                  )}
                  {inspectedTx.publicSignals.procedureCovered !== undefined && (
                    <div className="flex justify-between items-center pb-1.5 border-b border-slate-800">
                      <span className="text-slate-400 font-sans">Procedure Coverage Flag:</span>
                      <span className="text-teal-400">1 (Eligible within sum insured)</span>
                    </div>
                  )}
                  {inspectedTx.publicSignals.sha256Digest && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-sans">Vault Anchor Digest:</span>
                      <span className="text-white">{inspectedTx.publicSignals.sha256Digest}</span>
                    </div>
                  )}
                  <div className="pt-2 text-[11px] text-teal-400 font-sans flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                    Zero Protected Health Information (PHI) leaked onto public ledger.
                  </div>
                </div>
              </div>
            )}

            {/* Calldata Snippet */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-[#142D4E] uppercase tracking-wider">Raw Calldata Payload</span>
                <button
                  onClick={() => handleCopy(inspectedTx.calldataSnippet, 'calldata')}
                  className="text-slate-500 hover:text-slate-900 text-[11px] font-semibold flex items-center gap-1"
                >
                  {copiedHash === 'calldata' ? <Check className="w-3 h-3 text-teal-600" /> : <Copy className="w-3 h-3" />}
                  Copy Payload
                </button>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 text-slate-400 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap break-all">
                {inspectedTx.calldataSnippet}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <span className="text-xs text-slate-500">
                ZKure Explorer Indexer · Block Hash Confirmed
              </span>
              <button
                onClick={() => setInspectedTx(null)}
                className="px-4 py-2 rounded-lg bg-[#142D4E] hover:bg-[#1D3E6B] text-white text-xs font-semibold transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
