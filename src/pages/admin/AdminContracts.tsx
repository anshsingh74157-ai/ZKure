import React, { useState, useEffect } from 'react';
import {
  FileCode,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Flame,
  Activity,
  Layers,
  Terminal,
  Search,
  Lock,
  Cpu,
  RefreshCw,
  Zap,
  Clock,
  ArrowUpRight,
  Database,
  Building2,
  FileCheck2,
  LifeBuoy
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useArogyaZK } from '../../context/ArogyaZKContext';
import { fetchContractsFromDB } from '../../services/api';

interface ContractProtocol {
  id: string;
  name: string;
  solFile: string;
  address: string;
  category: 'Vault & Storage' | 'Settlement & ZK' | 'Identity & Registry' | 'Policy & Inclusions' | 'Emergency Access';
  roleSummary: string;
  description: string;
  compiler: string;
  optimization: string;
  evmVersion: string;
  deployedBlock: number;
  gasBenchmark: {
    deploy: string;
    avgCall: string;
    peakCall: string;
    efficiencyRating: string;
  };
  stateMetrics: {
    label: string;
    value: string;
  }[];
  methods: {
    name: string;
    signature: string;
    type: 'read' | 'write';
    gasEstimate: string;
    description: string;
  }[];
  auditStatus: string;
}

const PROTOCOL_CONTRACTS: ContractProtocol[] = [
  {
    id: 'health-vault',
    name: 'HealthVault Core',
    solFile: 'HealthVault.sol',
    address: '0x71C9F474A4B1b783De6d27aA11f4d998F401314B',
    category: 'Vault & Storage',
    roleSummary: 'Anchors AES-256 encrypted records and enforces patient consent tokens.',
    description: 'Implements patient-controlled access lists, cryptographic time-lock expiration, and on-chain SHA-256 integrity digests without storing plaintext PHI.',
    compiler: 'Solidity v0.8.28',
    optimization: 'Enabled (200 runs via IR)',
    evmVersion: 'Cancun',
    deployedBlock: 1839210,
    gasBenchmark: {
      deploy: '1,420,500 gas',
      avgCall: '42,180 gas',
      peakCall: '64,300 gas (anchorRecord)',
      efficiencyRating: 'A+ (Optimized Storage Slots)'
    },
    stateMetrics: [
      { label: 'Anchored Records', value: '14,892 digests' },
      { label: 'Active Consent Tokens', value: '3,421 tokens' },
      { label: 'Integrity Check', value: '100% GCM-matched' },
      { label: 'Re-entrancy Guard', value: 'Enforced' }
    ],
    methods: [
      {
        name: 'anchorRecord',
        signature: 'anchorRecord(bytes32 recordHash, bytes32 ipfsCidDigest) external returns (bytes32)',
        type: 'write',
        gasEstimate: '~64,300 gas',
        description: 'Anchors the cryptographic SHA-256 hash of AES-256 encrypted health record to state.'
      },
      {
        name: 'grantConsent',
        signature: 'grantConsent(address hospital, uint256 durationHours, bytes32[] recordHashes) external returns (bytes32)',
        type: 'write',
        gasEstimate: '~48,900 gas',
        description: 'Mints a cryptographic time-locked consent token for an accredited hospital.'
      },
      {
        name: 'revokeConsent',
        signature: 'revokeConsent(bytes32 consentToken) external',
        type: 'write',
        gasEstimate: '~31,200 gas',
        description: 'Instantly invalidates hospital read privileges prior to scheduled expiration.'
      },
      {
        name: 'isConsentValid',
        signature: 'isConsentValid(address patient, address hospital, bytes32 recordHash) external view returns (bool)',
        type: 'read',
        gasEstimate: '0 gas (View call)',
        description: 'Verifies whether an active, non-expired patient consent exists for record.'
      }
    ],
    auditStatus: 'Veridise Formally Verified · Slither 0-Findings'
  },
  {
    id: 'claim-settlement',
    name: 'ClaimSettlement Engine',
    solFile: 'ClaimSettlement.sol',
    address: '0x3892F7eAc688758d4aB68D6f4AfC572D9848512E',
    category: 'Settlement & ZK',
    roleSummary: 'Verifies Groth16 zk-SNARK proofs and executes automated INR payouts.',
    description: 'On-chain zero-knowledge pairing verifier on BN254 curve. Performs instant cashless settlement from insurer liquidity escrow into hospital treasury without revealing medical diagnosis.',
    compiler: 'Solidity v0.8.28',
    optimization: 'Enabled (200 runs via IR)',
    evmVersion: 'Cancun (Pairing Precompile 0x08)',
    deployedBlock: 1839245,
    gasBenchmark: {
      deploy: '2,150,000 gas',
      avgCall: '212,400 gas',
      peakCall: '228,000 gas (Groth16 Verify + Payout)',
      efficiencyRating: 'A (Sub-250k Groth16 on EVM)'
    },
    stateMetrics: [
      { label: 'Escrow Liquidity', value: '₹1,25,00,000 INR' },
      { label: 'Verified Proofs', value: '2,891 claims' },
      { label: 'Total Disbursed', value: '₹8.42 Cr' },
      { label: 'Nullifier Unique', value: '100% Replay-Safe' }
    ],
    methods: [
      {
        name: 'verifyAndDisburse',
        signature: 'verifyAndDisburse(uint256[2] a, uint256[2][2] b, uint256[2] c, uint256[5] publicSignals) external returns (bytes32)',
        type: 'write',
        gasEstimate: '~212,400 gas',
        description: 'Executes elliptic curve BN254 pairing check and releases INR funds to provider.'
      },
      {
        name: 'depositEscrowLiquidity',
        signature: 'depositEscrowLiquidity(uint256 amountInr) external payable',
        type: 'write',
        gasEstimate: '~44,100 gas',
        description: 'Insurers deposit funds into auto-settlement pool for instant tier-1 cashless claims.'
      },
      {
        name: 'checkNullifierSpent',
        signature: 'checkNullifierSpent(bytes32 nullifierHash) external view returns (bool)',
        type: 'read',
        gasEstimate: '0 gas (View call)',
        description: 'Cryptographically guarantees no double-spending of medical claims.'
      },
      {
        name: 'getEscrowBalance',
        signature: 'getEscrowBalance(address insurer) external view returns (uint256)',
        type: 'read',
        gasEstimate: '0 gas (View call)',
        description: 'Queries active liquidity collateral pledged by an institutional insurer.'
      }
    ],
    auditStatus: 'CertiK ZK-Circuit Audited · Formal Math Soundness Proof'
  },
  {
    id: 'hospital-registry',
    name: 'HospitalRegistry Merkle',
    solFile: 'HospitalRegistry.sol',
    address: '0x94A1F67cb137452d3a39e8B3838E75B46e91E9a2',
    category: 'Identity & Registry',
    roleSummary: 'Maintains Depth-16 Merkle tree of NABH-accredited providers.',
    description: 'Cryptographic registry maintaining Poseidon Merkle tree root of accredited hospitals and their EdDSA public keys. Allows zero-knowledge proofs to assert provider validity in O(1) constraints.',
    compiler: 'Solidity v0.8.28',
    optimization: 'Enabled (200 runs via IR)',
    evmVersion: 'Cancun',
    deployedBlock: 1839280,
    gasBenchmark: {
      deploy: '1,820,000 gas',
      avgCall: '51,200 gas',
      peakCall: '68,400 gas (updateMerkleLeaf)',
      efficiencyRating: 'A+ (Poseidon Precomputed Leaves)'
    },
    stateMetrics: [
      { label: 'Merkle Tree Depth', value: 'Depth-16 (65k capacity)' },
      { label: 'Verified Hospitals', value: '428 empanelled' },
      { label: 'Collateral Bonded', value: '₹21.4 Cr INR' },
      { label: 'Poseidon Root', value: '0x2e8f...c34b' }
    ],
    methods: [
      {
        name: 'registerHospital',
        signature: 'registerHospital(address provider, bytes32 nabhHash, uint256 eddsaKeyX, uint256 eddsaKeyY) external',
        type: 'write',
        gasEstimate: '~89,400 gas',
        description: 'Enrolls an accredited healthcare facility and inserts its leaf into Depth-16 tree.'
      },
      {
        name: 'verifyAccreditationProof',
        signature: 'verifyAccreditationProof(bytes32 leaf, bytes32[16] merkleProof) external view returns (bool)',
        type: 'read',
        gasEstimate: '0 gas (View call)',
        description: 'Checks inclusion in provider tree using Poseidon hashing.'
      },
      {
        name: 'slashCollateral',
        signature: 'slashCollateral(address provider, bytes32 violationDigest) external',
        type: 'write',
        gasEstimate: '~62,100 gas',
        description: 'Governance action to confiscate bonded stake for dishonest diagnosis attestation.'
      }
    ],
    auditStatus: 'Trail of Bits Merkle Protocol Audited'
  },
  {
    id: 'policy-registry',
    name: 'PolicyRegistry Group',
    solFile: 'PolicyRegistry.sol',
    address: '0x5B82Cd1887e2b109D4f3014c24391694A6E4F011',
    category: 'Policy & Inclusions',
    roleSummary: 'Pedersen commitments and Depth-8 procedure inclusion roots.',
    description: 'Anchors insurer-signed policy coverage roots and procedure inclusion trees on BabyJubjub curve. Enables client-side prover to demonstrate treatment inclusion without revealing full policy terms.',
    compiler: 'Solidity v0.8.28',
    optimization: 'Enabled (200 runs via IR)',
    evmVersion: 'Cancun',
    deployedBlock: 1839312,
    gasBenchmark: {
      deploy: '1,640,000 gas',
      avgCall: '38,700 gas',
      peakCall: '55,200 gas (commitPolicyRoot)',
      efficiencyRating: 'A+ (BabyJubjub Curve Optimizations)'
    },
    stateMetrics: [
      { label: 'Active Policies', value: '45,210 commitments' },
      { label: 'Procedure Tree', value: 'Depth-8 (256 codes)' },
      { label: 'Empanelled Insurers', value: '18 IRDAI entities' },
      { label: 'Commitment Scheme', value: 'Pedersen on Edwards' }
    ],
    methods: [
      {
        name: 'commitPolicyRoot',
        signature: 'commitPolicyRoot(bytes32 policyCommitment, uint256 maxCoverage, uint64 expiry) external',
        type: 'write',
        gasEstimate: '~55,200 gas',
        description: 'Records hashed policy commitment and pre-authorized coverage limits.'
      },
      {
        name: 'verifyProcedureLeaf',
        signature: 'verifyProcedureLeaf(bytes32 root, bytes32 procedureLeaf, bytes32[8] proof) external view returns (bool)',
        type: 'read',
        gasEstimate: '0 gas (View call)',
        description: 'Confirms clinical treatment code is covered under active insurer policy leaf.'
      },
      {
        name: 'isPolicyActive',
        signature: 'isPolicyActive(bytes32 policyIdHash) external view returns (bool)',
        type: 'read',
        gasEstimate: '0 gas (View call)',
        description: 'Checks if patient policy is currently in force and unrevoked.'
      }
    ],
    auditStatus: 'OpenZeppelin v5.0.2 Base · Formally Verified'
  },
  {
    id: 'break-glass',
    name: 'BreakGlass Protocol',
    solFile: 'BreakGlass.sol',
    address: '0x1D95A2240954bB4c2b92Ec62d774D4e029302B67',
    category: 'Emergency Access',
    roleSummary: '2-of-3 Shamir Secret Sharing emergency ICU access protocol.',
    description: 'Enables verified emergency physicians to reconstruct AES record keys during critical trauma care upon receiving 2 of 3 cryptographic guardian signatures with automated forensic logging.',
    compiler: 'Solidity v0.8.28',
    optimization: 'Enabled (200 runs via IR)',
    evmVersion: 'Cancun (Lagrange Polynomial Precomputes)',
    deployedBlock: 1839350,
    gasBenchmark: {
      deploy: '1,380,000 gas',
      avgCall: '74,900 gas',
      peakCall: '91,500 gas (reconstructKeyQuorum)',
      efficiencyRating: 'A (GF(256) Constant-Time Math)'
    },
    stateMetrics: [
      { label: 'Threshold Scheme', value: '2-of-3 Shamir SSS' },
      { label: 'Quorum Sessions', value: '12 emergency sessions' },
      { label: 'Audit Telemetry', value: '100% On-Chain Trace' },
      { label: 'Key Collisions', value: '0 (Provably Unique)' }
    ],
    methods: [
      {
        name: 'initiateBreakGlass',
        signature: 'initiateBreakGlass(address patient, address hospital, bytes32 icuReasonHash) external returns (bytes32)',
        type: 'write',
        gasEstimate: '~74,900 gas',
        description: 'Initiates emergency ICU request, emitting alert events to patient guardians.'
      },
      {
        name: 'submitGuardianShare',
        signature: 'submitGuardianShare(bytes32 sessionId, uint8 guardianIndex, bytes32 shareSecret) external',
        type: 'write',
        gasEstimate: '~52,100 gas',
        description: 'Guardian submits Lagrange polynomial share to fulfill 2-of-3 quorum.'
      },
      {
        name: 'verifyReconstructedKey',
        signature: 'verifyReconstructedKey(bytes32 sessionId) external view returns (bool)',
        type: 'read',
        gasEstimate: '0 gas (View call)',
        description: 'Validates that reconstructed master secret tag matches original commitment.'
      }
    ],
    auditStatus: 'Consensys Diligence Cryptographic Review'
  }
];

export const AdminContracts: React.FC = () => {
  const { setActiveTab } = useArogyaZK();
  const [contracts, setContracts] = useState<ContractProtocol[]>(PROTOCOL_CONTRACTS);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeContractId, setActiveContractId] = useState<string | null>(null);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [simulatedCallResult, setSimulatedCallResult] = useState<{
    method: string;
    result: string;
    gasUsed: string;
    timestamp: string;
  } | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadContracts() {
      try {
        const rows = await fetchContractsFromDB();
        if (rows && rows.length > 0 && isMounted) {
          setContracts((prev) =>
            prev.map((c) => {
              const matched = rows.find((r: any) => r.name === c.solFile || r.address === c.address);
              return matched
                ? {
                    ...c,
                    address: matched.address || c.address
                  }
                : c;
            })
          );
        }
      } catch (err) {
        console.warn('Failed to load contracts from DB', err);
      }
    }
    loadContracts();
    return () => {
      isMounted = false;
    };
  }, []);

  const categories = ['All', 'Vault & Storage', 'Settlement & ZK', 'Identity & Registry', 'Policy & Inclusions', 'Emergency Access'];

  const filteredContracts = contracts.filter((c) => {
    const matchesCategory = selectedCategory === 'All' || c.category === selectedCategory;
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.solFile.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.roleSummary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const activeContract = contracts.find((c) => c.id === activeContractId) || null;

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const handleSimulateCall = (contract: ContractProtocol, methodName: string) => {
    setIsSimulating(true);
    setSimulatedCallResult(null);

    setTimeout(() => {
      let resultText = '';
      let gas = '0 gas';

      switch (methodName) {
        case 'isConsentValid':
          resultText = 'SUCCESS: true (Patient PAT-9041 consented to Apollo Spectra HSP-402, expires in 2h 45m)';
          gas = '18,420 gas (Simulated)';
          break;
        case 'checkNullifierSpent':
          resultText = 'SUCCESS: false (Nullifier 0x9f8c...41ba is UNSPENT, eligible for first-time settlement)';
          gas = '12,300 gas (Simulated)';
          break;
        case 'getEscrowBalance':
          resultText = 'SUCCESS: 125,000,000 INR (Star Shield & HDFC ERGO pooled reserves verified)';
          gas = '8,100 gas (Simulated)';
          break;
        case 'verifyAccreditationProof':
          resultText = 'SUCCESS: true (Apollo Spectra NABH-H-2024-8812 verified at leaf #42, depth 16)';
          gas = '24,100 gas (Simulated)';
          break;
        case 'verifyProcedureLeaf':
          resultText = 'SUCCESS: true (Procedure 0x88f2 [Cardiac Consultation & Echo] verified in Policy Tree Root)';
          gas = '19,500 gas (Simulated)';
          break;
        case 'verifyReconstructedKey':
          resultText = 'SUCCESS: true (2-of-3 Shamir shares combined. Reconstructed tag matches patient vault commitment)';
          gas = '31,800 gas (Simulated)';
          break;
        default:
          resultText = `SUCCESS: Execution verified on Sepolia ZK Rollup (State Root unchanged)`;
          gas = '21,000 gas (Simulated)';
      }

      setSimulatedCallResult({
        method: methodName,
        result: resultText,
        gasUsed: gas,
        timestamp: new Date().toLocaleTimeString()
      });
      setIsSimulating(false);
    }, 450);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#142D4E] flex items-center justify-center text-white font-bold shadow-sm">
              <FileCode className="w-4 h-4 text-teal-300" />
            </div>
            <h1 className="text-2xl font-bold text-[#142D4E]">Protocol Smart Contracts</h1>
            <Badge variant="teal">Solidity v0.8.28 · 5 Active Protocols</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Governed Ethereum & ZK Rollup contracts anchoring encrypted health records, Groth16 settlement, and provider registries.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveTab('explorer')}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-[#142D4E] transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-teal-600" /> Open Block Explorer
          </button>
          <Badge variant="navy">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" /> Rollup Chain ID: 74219
          </Badge>
        </div>
      </div>

      {/* Network & Compiler Telemetry Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-slate-50 to-teal-50/30 border-teal-200">
          <div className="flex items-center justify-between text-xs font-semibold text-teal-800">
            <span>Deployed Protocols</span>
            <FileCode className="w-3.5 h-3.5 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-[#142D4E] mt-1">5 / 5</div>
          <div className="text-[11px] text-teal-700 mt-0.5 font-medium">100% Operational & Verified</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Compiler Optimization</span>
            <Cpu className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-xl font-bold text-[#142D4E] mt-1">v0.8.28 (IR)</div>
          <div className="text-[11px] text-slate-500 mt-0.5">200 runs · Cancun Target</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>ZK SNARK Verifier</span>
            <Flame className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-[#142D4E] mt-1">212k Gas</div>
          <div className="text-[11px] text-teal-700 mt-0.5 font-medium">Groth16 BN254 Pairing</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Escrow Settlement Reserve</span>
            <Zap className="w-3.5 h-3.5 text-teal-600" />
          </div>
          <div className="text-xl font-bold text-teal-800 mt-1">₹1.25 Cr</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Instant Payout Escrow</div>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-[#142D4E] text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search contracts or methods..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-teal-500 outline-none"
          />
        </div>
      </div>

      {/* Contract Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filteredContracts.map((contract) => (
          <Card key={contract.id} className="p-5 flex flex-col justify-between hover:border-slate-300 transition-all shadow-sm">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-[#0D9488] flex items-center justify-center shrink-0 mt-0.5 font-bold font-mono">
                    <FileCode className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base font-bold text-[#142D4E]">{contract.name}</h2>
                      <span className="font-mono text-xs text-slate-500 font-semibold">{contract.solFile}</span>
                      <Badge variant="teal">Active</Badge>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {contract.roleSummary}
                    </p>
                  </div>
                </div>
              </div>

              {/* Deployed Address Pill */}
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2 truncate">
                  <span className="text-slate-400 font-sans text-[11px]">Address:</span>
                  <span className="text-[#142D4E] font-semibold truncate">{contract.address}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleCopyAddress(contract.address)}
                    className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-900 transition-colors"
                    title="Copy Address"
                  >
                    {copiedAddress === contract.address ? (
                      <Check className="w-3.5 h-3.5 text-teal-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('explorer')}
                    className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-900 transition-colors"
                    title="View in Explorer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* State Metrics Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                {contract.stateMetrics.map((sm, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-slate-50/70 border border-slate-100">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">{sm.label}</div>
                    <div className="text-xs font-bold text-slate-900 mt-0.5">{sm.value}</div>
                  </div>
                ))}
              </div>

              {/* Gas & Compiler Specs */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                <span className="flex items-center gap-1 font-mono">
                  <Flame className="w-3 h-3 text-amber-500" /> Avg: {contract.gasBenchmark.avgCall}
                </span>
                <span className="font-mono text-slate-600">{contract.compiler}</span>
                <span className="text-teal-700 font-medium">{contract.gasBenchmark.efficiencyRating}</span>
              </div>
            </div>

            {/* Bottom Action Footer */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-medium">
                Block #{contract.deployedBlock.toLocaleString()}
              </span>
              <button
                onClick={() => setActiveContractId(contract.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#142D4E] hover:bg-[#1D3E6B] text-white text-xs font-semibold transition-colors shadow-sm"
              >
                <Terminal className="w-3.5 h-3.5" /> Inspect ABI & State
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* Contract Detail / State Inspector Modal */}
      {activeContract && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="max-w-3xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-[#0D9488] flex items-center justify-center">
                  <FileCode className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-[#142D4E]">{activeContract.name}</h2>
                    <span className="font-mono text-xs text-slate-500 font-semibold">{activeContract.solFile}</span>
                    <Badge variant="teal">Solidity v0.8.28</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{activeContract.description}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setActiveContractId(null);
                  setSimulatedCallResult(null);
                }}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 text-sm"
              >
                ✕
              </button>
            </div>

            {/* Address & Compiler Specification Card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
              <div>
                <span className="text-slate-400 font-sans block text-[11px]">Deployed Contract:</span>
                <span className="font-bold text-[#142D4E] truncate block">{activeContract.address}</span>
              </div>
              <div>
                <span className="text-slate-400 font-sans block text-[11px]">Compiler Settings:</span>
                <span className="text-slate-700 font-medium block">{activeContract.optimization}</span>
              </div>
              <div>
                <span className="text-slate-400 font-sans block text-[11px]">Security Audit:</span>
                <span className="text-teal-800 font-bold block">{activeContract.auditStatus}</span>
              </div>
            </div>

            {/* Gas Telemetry Benchmarks */}
            <div>
              <h3 className="text-xs font-bold text-[#142D4E] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-500" /> Gas Benchmarks & Profiling
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
                <div className="p-3 rounded-lg border border-slate-200 bg-white">
                  <span className="text-slate-400 text-[11px]">Contract Creation:</span>
                  <div className="font-mono font-bold text-slate-900 mt-0.5">{activeContract.gasBenchmark.deploy}</div>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 bg-white">
                  <span className="text-slate-400 text-[11px]">Average Execution:</span>
                  <div className="font-mono font-bold text-slate-900 mt-0.5">{activeContract.gasBenchmark.avgCall}</div>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 bg-white">
                  <span className="text-slate-400 text-[11px]">Peak Function Call:</span>
                  <div className="font-mono font-bold text-amber-700 mt-0.5">{activeContract.gasBenchmark.peakCall}</div>
                </div>
                <div className="p-3 rounded-lg border border-teal-200 bg-teal-50/50">
                  <span className="text-teal-700 text-[11px]">Efficiency Score:</span>
                  <div className="font-mono font-bold text-teal-900 mt-0.5">{activeContract.gasBenchmark.efficiencyRating}</div>
                </div>
              </div>
            </div>

            {/* Interactive Functions / ABI Console */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-[#142D4E] uppercase tracking-wider flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-[#0D9488]" /> Smart Contract ABI & Interactive State Methods
                </h3>
                <span className="text-[11px] text-slate-400">Click &quot;Simulate Read&quot; to test on-chain state query</span>
              </div>

              <div className="space-y-2.5">
                {activeContract.methods.map((method, idx) => (
                  <div key={idx} className="p-3.5 rounded-lg border border-slate-200 bg-white hover:border-slate-300 transition-colors space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          method.type === 'read' ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {method.type}
                        </span>
                        <span className="font-mono font-bold text-xs text-[#142D4E]">{method.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-slate-400">{method.gasEstimate}</span>
                        {method.type === 'read' && (
                          <button
                            onClick={() => handleSimulateCall(activeContract, method.name)}
                            disabled={isSimulating}
                            className="px-2.5 py-1 rounded bg-[#0D9488] hover:bg-[#0F766E] text-white text-[11px] font-semibold transition-colors flex items-center gap-1 shadow-xs"
                          >
                            <RefreshCw className={`w-3 h-3 ${isSimulating ? 'animate-spin' : ''}`} /> Simulate Read
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="p-2 rounded bg-slate-900 text-teal-300 font-mono text-[11px] overflow-x-auto">
                      {method.signature}
                    </div>

                    <p className="text-[11px] text-slate-600">{method.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Simulation Results Output */}
            {simulatedCallResult && (
              <div className="p-4 rounded-xl bg-slate-900 border border-teal-500/40 text-xs space-y-2 font-mono">
                <div className="flex items-center justify-between text-teal-400">
                  <span className="flex items-center gap-1.5 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-teal-400" /> RPC Query Output: {simulatedCallResult.method}()
                  </span>
                  <span className="text-[11px] text-slate-400">{simulatedCallResult.timestamp}</span>
                </div>
                <div className="text-white bg-slate-950 p-2.5 rounded border border-slate-800 text-[11px] leading-relaxed">
                  {simulatedCallResult.result}
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Gas Consumption: {simulatedCallResult.gasUsed}</span>
                  <span className="text-teal-400">State Consensus: Verified</span>
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <span className="text-xs text-slate-500">
                Network: ZKure Sepolia Rollup (Chain ID: 74219)
              </span>
              <button
                onClick={() => {
                  setActiveContractId(null);
                  setSimulatedCallResult(null);
                }}
                className="px-4 py-2 rounded-lg bg-[#142D4E] hover:bg-[#1D3E6B] text-white text-xs font-semibold transition-colors"
              >
                Close Console
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
