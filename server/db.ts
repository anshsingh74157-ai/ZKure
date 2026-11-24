import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { prototypeCases, prototypeHospitals, prototypeInsurers, prototypePatients } from './prototypeDataset';

const dbPath = process.env.DATABASE_PATH ? path.resolve(process.env.DATABASE_PATH) : path.resolve(process.cwd(), 'data', 'arogyazk.db');
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const db = new DatabaseSync(dbPath);

// Enable WAL mode for high performance
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS app_users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      passwordHash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('Patient','Hospital','Insurer','Admin')),
      linkedId TEXT,
      createdAt INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS auth_sessions (
      tokenHash TEXT PRIMARY KEY,
      userId TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
      expiresAt INTEGER NOT NULL,
      createdAt INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_auth_sessions_expiry ON auth_sessions(expiresAt);
  `);
  // 1. Patients Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      zkId TEXT NOT NULL,
      policyNumber TEXT NOT NULL,
      insurerName TEXT NOT NULL,
      planName TEXT NOT NULL,
      coverageLimit INTEGER NOT NULL,
      spentAmount INTEGER NOT NULL DEFAULT 0,
      validTill TEXT NOT NULL,
      secretPolicySalt TEXT NOT NULL,
      policyCommitment TEXT NOT NULL,
      didUri TEXT NOT NULL
    );
  `);

  // 2. Medical Records Table (FHIR JSON + AES-256-GCM encrypted payload)
  db.exec(`
    CREATE TABLE IF NOT EXISTS medical_records (
      id TEXT PRIMARY KEY,
      patientId TEXT NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      date TEXT NOT NULL,
      hospitalName TEXT NOT NULL,
      encryptionStatus TEXT NOT NULL,
      sha256Hash TEXT NOT NULL,
      ipfsCid TEXT NOT NULL,
      anchorTxHash TEXT NOT NULL,
      sharedWithHospitalId TEXT,
      sharedWithHospitalName TEXT,
      accessExpiresAt INTEGER,
      clinicalNotesEncrypted TEXT,
      ciphertext TEXT,
      encryptionIv TEXT,
      authenticationTag TEXT,
      fhirPayload TEXT,
      createdAt INTEGER NOT NULL,
      FOREIGN KEY (patientId) REFERENCES patients(id)
    );
  `);

  const medicalRecordColumns = db.prepare('PRAGMA table_info(medical_records)').all() as Array<{ name: string }>;
  for (const [name, type] of [['ciphertext', 'TEXT'], ['encryptionIv', 'TEXT'], ['authenticationTag', 'TEXT'], ['keyVersion', 'INTEGER'], ['wrappedDataKey', 'TEXT'], ['wrappedKeyIv', 'TEXT'], ['wrappedKeyTag', 'TEXT']] as const) {
    if (!medicalRecordColumns.some((column) => column.name === name)) db.exec(`ALTER TABLE medical_records ADD COLUMN ${name} ${type}`);
  }

  // 3. Hospital Registry (Depth-16 Merkle Tree leaves)
  db.exec(`
    CREATE TABLE IF NOT EXISTS hospitals (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      nabhRegistration TEXT NOT NULL,
      city TEXT NOT NULL,
      status TEXT NOT NULL,
      walletAddress TEXT NOT NULL,
      eddsaPublicKey TEXT NOT NULL,
      merkleLeafIndex INTEGER NOT NULL,
      bondedCollateralInr INTEGER NOT NULL DEFAULT 500000
    );
  `);

  // 4. Procedures Registry (Depth-8 Merkle Tree leaves)
  db.exec(`
    CREATE TABLE IF NOT EXISTS procedures (
      code TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      isCovered INTEGER NOT NULL, -- 1 = Covered, 0 = Excluded
      merkleLeafIndex INTEGER NOT NULL,
      standardRateInr INTEGER NOT NULL
    );
  `);

  // 5. Access Permissions (ABDM / DPDP Consent Tokens)
  db.exec(`
    CREATE TABLE IF NOT EXISTS access_permissions (
      id TEXT PRIMARY KEY,
      patientId TEXT NOT NULL,
      hospitalId TEXT NOT NULL,
      hospitalName TEXT NOT NULL,
      nabhId TEXT NOT NULL,
      scope TEXT NOT NULL,
      recordIds TEXT NOT NULL, -- JSON array of record IDs
      grantedAt TEXT NOT NULL,
      expiresAt INTEGER NOT NULL,
      status TEXT NOT NULL, -- 'Active', 'Revoked', 'Expired'
      FOREIGN KEY (patientId) REFERENCES patients(id),
      FOREIGN KEY (hospitalId) REFERENCES hospitals(id)
    );
  `);

  // 6. Insurance Claims Table (Groth16 proofs, Two-Party Authorization, Tier 1 vs Tier 2 Settlement)
  db.exec(`
    CREATE TABLE IF NOT EXISTS insurance_claims (
      id TEXT PRIMARY KEY,
      patientId TEXT NOT NULL,
      patientMaskedId TEXT NOT NULL,
      policyNumber TEXT NOT NULL,
      insurerName TEXT NOT NULL,
      hospitalId TEXT NOT NULL,
      hospitalName TEXT NOT NULL,
      treatmentDate TEXT NOT NULL,
      diagnosisCodePrivate TEXT NOT NULL, -- Hidden from insurer via circuit
      diagnosisSummaryPrivate TEXT NOT NULL, -- Hidden from insurer via circuit
      billFileName TEXT NOT NULL,
      billHash TEXT NOT NULL,
      claimAmount INTEGER NOT NULL,
      settlementTier TEXT NOT NULL, -- 'Tier 1' (<= 1L instant) or 'Tier 2' (> 1L escrow)
      status TEXT NOT NULL, -- 'Pending', 'Approved', 'Rejected', 'Settled', 'Disputed'
      submittedAt TEXT NOT NULL,
      hospitalSignature TEXT NOT NULL, -- Hospital's EdDSA / ECDSA signature
      zkProof TEXT NOT NULL, -- JSON serialized ZKProofArtifact (Groth16-BN254, 9 public signals)
      nullifierHash TEXT NOT NULL UNIQUE, -- Replay protection N = Poseidon(S,P,C,T,D)
      usedRecordHash TEXT NOT NULL, -- Prevents reusing same bill with different nonce
      settlementTxHash TEXT,
      timeline TEXT NOT NULL, -- JSON serialized TimelineStep[]
      createdAt INTEGER NOT NULL,
      FOREIGN KEY (patientId) REFERENCES patients(id),
      FOREIGN KEY (hospitalId) REFERENCES hospitals(id)
    );
  `);

  // 7. Emergency Break-Glass (2-of-3 Shamir Secret Sharing)
  db.exec(`
    CREATE TABLE IF NOT EXISTS break_glass_sessions (
      id TEXT PRIMARY KEY,
      patientId TEXT NOT NULL,
      hospitalId TEXT NOT NULL,
      doctorName TEXT NOT NULL,
      icuReason TEXT NOT NULL,
      guardian1Signed INTEGER NOT NULL DEFAULT 0,
      guardian2Signed INTEGER NOT NULL DEFAULT 0,
      guardian3Signed INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL, -- 'Pending', 'Active_Unlocked', 'Expired', 'Revoked'
      shareHashes TEXT NOT NULL, -- Committed on-chain hashes of the 3 Shamir shares
      unlockedAt INTEGER,
      expiresAt INTEGER NOT NULL,
      reconstructedTagValid INTEGER NOT NULL DEFAULT 0,
      createdAt INTEGER NOT NULL,
      FOREIGN KEY (patientId) REFERENCES patients(id)
    );
  `);

  // 8. Smart Contracts Telemetry & State (5 Core Contracts)
  db.exec(`
    CREATE TABLE IF NOT EXISTS smart_contracts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      role TEXT NOT NULL,
      compiler TEXT NOT NULL,
      blockNumber INTEGER NOT NULL,
      gasAverage TEXT NOT NULL,
      liquidityBalanceInr INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL
    );
  `);

  // 9. Immutable Audit Logs (100% Zero-PHI event stream)
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      actorRole TEXT NOT NULL,
      actorName TEXT NOT NULL,
      action TEXT NOT NULL,
      targetResource TEXT NOT NULL,
      txHash TEXT NOT NULL,
      privacyImpact TEXT NOT NULL,
      createdAt INTEGER NOT NULL
    );
  `);

  // 10. Blockchain Subnet Blocks & Txs
  db.exec(`
    CREATE TABLE IF NOT EXISTS blockchain_blocks (
      number INTEGER PRIMARY KEY,
      txs INTEGER NOT NULL,
      validator TEXT NOT NULL,
      gasUsed TEXT NOT NULL,
      age TEXT NOT NULL,
      timestamp INTEGER NOT NULL
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS blockchain_transactions (
      hash TEXT PRIMARY KEY,
      method TEXT NOT NULL,
      fromAddress TEXT NOT NULL,
      toAddress TEXT NOT NULL,
      value TEXT NOT NULL,
      age TEXT NOT NULL,
      status TEXT NOT NULL,
      timestamp INTEGER NOT NULL
    );
  `);

  // Synthetic prototype fixtures are kept separate from real patient and claim tables.
  db.exec(`
    CREATE TABLE IF NOT EXISTS prototype_patients (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, city TEXT NOT NULL, state TEXT NOT NULL,
      insurerName TEXT NOT NULL, policyNumber TEXT NOT NULL, planName TEXT NOT NULL,
      coverageLimitInr INTEGER NOT NULL, spentAmountInr INTEGER NOT NULL, validTill TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS prototype_hospitals (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, city TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS prototype_cases (
      id TEXT PRIMARY KEY, patientId TEXT NOT NULL REFERENCES prototype_patients(id),
      hospitalId TEXT NOT NULL REFERENCES prototype_hospitals(id), insurerName TEXT NOT NULL,
      careType TEXT NOT NULL, amountInr INTEGER NOT NULL, status TEXT NOT NULL
    );
  `);

  // Seed baseline data and testing accounts
  seedTestUsers();
  seedInitialData();
  seedPrototypeDataset();
}

function hashPasswordSync(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

function getSeedingEncryptionKey(): string {
  let key = process.env.RECORD_ENCRYPTION_KEY;
  if (!key && fs.existsSync(path.resolve(process.cwd(), '.env.key'))) {
    try { key = fs.readFileSync(path.resolve(process.cwd(), '.env.key'), 'utf8').trim(); } catch {}
  }
  if (!key || !/^[a-fA-F0-9]{64}$/.test(key)) {
    key = 'c8d02b0864429f730e8589a956fdf0fcb0778e6c84654e4e8ed2bc23169636d2';
  }
  return key;
}

function encryptBaselineRecord(title: string, clinicalNotes: string) {
  const kekHex = getSeedingEncryptionKey();
  const kek = Buffer.from(kekHex, 'hex');
  const now = Date.now();
  const plaintext = Buffer.from(JSON.stringify({ title, clinicalNotes, timestamp: now }), 'utf8');
  const hash = '0x' + crypto.createHash('sha256').update(plaintext).digest('hex');

  const dataKey = crypto.randomBytes(32);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', dataKey, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authenticationTag = cipher.getAuthTag();

  const wrappedKeyIv = crypto.randomBytes(12);
  const wrapCipher = crypto.createCipheriv('aes-256-gcm', kek, wrappedKeyIv);
  const wrappedDataKey = Buffer.concat([wrapCipher.update(dataKey), wrapCipher.final()]);
  const wrappedKeyTag = wrapCipher.getAuthTag();

  return {
    ciphertext: ciphertext.toString('base64'),
    encryptionIv: iv.toString('hex'),
    authenticationTag: authenticationTag.toString('hex'),
    sha256Hash: hash,
    keyVersion: 1,
    wrappedDataKey: wrappedDataKey.toString('base64'),
    wrappedKeyIv: wrappedKeyIv.toString('hex'),
    wrappedKeyTag: wrappedKeyTag.toString('hex')
  };
}

function seedTestUsers() {
  const insertUser = db.prepare(`
    INSERT INTO app_users (id, email, passwordHash, role, linkedId, createdAt)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(email) DO UPDATE SET
      passwordHash = excluded.passwordHash,
      role = excluded.role,
      linkedId = excluded.linkedId
  `);

  const now = Date.now();
  // Admin account (only seeded if no bootstrap admin is configured via env)
  if (!process.env.BOOTSTRAP_ADMIN_EMAIL) {
    insertUser.run('usr-admin-01', 'admin@example.test', hashPasswordSync('AdminPass1234!'), 'Admin', null, now);
  }

  // Patient accounts
  insertUser.run('usr-pat-01', 'patient.rohan@example.test', hashPasswordSync('PatientPass1234!'), 'Patient', 'PAT-9041', now);
  insertUser.run('usr-pat-02', 'patient.ananya@example.test', hashPasswordSync('PatientPass1234!'), 'Patient', 'PAT-9042', now);
  insertUser.run('usr-pat-03', 'patient.vikram@example.test', hashPasswordSync('PatientPass1234!'), 'Patient', 'PAT-9043', now);
  insertUser.run('usr-pat-04', 'patient.priya@example.test', hashPasswordSync('PatientPass1234!'), 'Patient', 'PAT-9044', now);

  // Hospital accounts
  insertUser.run('usr-hsp-01', 'hospital.apollo@example.test', hashPasswordSync('HospitalPass1234!'), 'Hospital', 'HSP-402', now);
  insertUser.run('usr-hsp-02', 'hospital.fortis@example.test', hashPasswordSync('HospitalPass1234!'), 'Hospital', 'HSP-219', now);
  insertUser.run('usr-hsp-03', 'hospital.sankara@example.test', hashPasswordSync('HospitalPass1234!'), 'Hospital', 'HSP-308', now);
  insertUser.run('usr-hsp-04', 'hospital.max@example.test', hashPasswordSync('HospitalPass1234!'), 'Hospital', 'HSP-512', now);

  // Insurer accounts
  insertUser.run('usr-ins-01', 'insurer.star@example.test', hashPasswordSync('InsurerPass1234!'), 'Insurer', 'Star Shield Health Assurance', now);
  insertUser.run('usr-ins-02', 'insurer.care@example.test', hashPasswordSync('InsurerPass1234!'), 'Insurer', 'Care Health Insurance', now);
  insertUser.run('usr-ins-03', 'insurer.hdfc@example.test', hashPasswordSync('InsurerPass1234!'), 'Insurer', 'HDFC ERGO Health', now);
}

function seedPrototypeDataset() {
  const insertPatient = db.prepare(`INSERT OR IGNORE INTO prototype_patients
    (id,name,city,state,insurerName,policyNumber,planName,coverageLimitInr,spentAmountInr,validTill)
    VALUES (?,?,?,?,?,?,?,?,?,?)`);
  for (const p of prototypePatients) insertPatient.run(p.id,p.name,p.city,p.state,p.insurer,p.policy,p.plan,p.limitInr,p.spentInr,p.validTill);
  const insertHospital = db.prepare('INSERT OR IGNORE INTO prototype_hospitals (id,name,city) VALUES (?,?,?)');
  for (const h of prototypeHospitals) insertHospital.run(h.id,h.name,h.city);
  const insertCase = db.prepare(`INSERT OR IGNORE INTO prototype_cases
    (id,patientId,hospitalId,insurerName,careType,amountInr,status) VALUES (?,?,?,?,?,?,?)`);
  for (const c of prototypeCases) {
    const patient = prototypePatients.find((p) => p.id === c.patientId)!;
    insertCase.run(c.id,c.patientId,c.hospitalId,patient.insurer,c.careType,c.amountInr,c.status);
  }
}

function seedInitialData() {
  console.log('[ArogyaZK DB] Seeding cryptographic baseline and role fixtures...');
  const now = Date.now();

  // 1. Seed Patients
  const insertPatient = db.prepare(`
    INSERT OR IGNORE INTO patients (
      id, name, zkId, policyNumber, insurerName, planName, coverageLimit, spentAmount, validTill, secretPolicySalt, policyCommitment, didUri
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertPatient.run(
    'PAT-9041', 'Rohan Sharma', 'zkID:0x9041...E4B2', 'POL-AZK-774190',
    'Star Shield Health Assurance', 'Arogya Shield Comprehensive Floater',
    500000, 30900, '2027-03-31',
    '0x4f82e1a90c42e8f112b95c4d7019e8a234f56c78d90e12a34b56c78d90e12a34',
    '0x7A9e4B12F09c8D3E1a44C90B8211F6e0AroGyaZK_Commitment_9041',
    'did:arogyazk:0x9041A98BE4B2'
  );
  insertPatient.run(
    'PAT-9042', 'Ananya Iyer', 'zkID:0x9042...B3F9', 'POL-AZK-881204',
    'Care Health Insurance', 'Care Platinum Comprehensive Individual',
    1000000, 45000, '2027-08-31',
    '0x3c71a90c42e8f112b95c4d7019e8a234f56c78d90e12a34b56c78d90e12a3456',
    '0x6B8e4B12F09c8D3E1a44C90B8211F6e0AroGyaZK_Commitment_9042',
    'did:arogyazk:0x9042B3F901C2'
  );
  insertPatient.run(
    'PAT-9043', 'Vikram Malhotra', 'zkID:0x9043...C7A1', 'POL-AZK-552910',
    'HDFC ERGO Health', 'Optima Secure Super Health',
    750000, 12000, '2026-12-31',
    '0x5a82e1a90c42e8f112b95c4d7019e8a234f56c78d90e12a34b56c78d90e12a78',
    '0x9C9e4B12F09c8D3E1a44C90B8211F6e0AroGyaZK_Commitment_9043',
    'did:arogyazk:0x9043C7A189E4'
  );
  insertPatient.run(
    'PAT-9044', 'Priya Patel', 'zkID:0x9044...D2E8', 'POL-AZK-991420',
    'Star Shield Health Assurance', 'Star Young Family Floater',
    500000, 0, '2028-01-31',
    '0x7b82e1a90c42e8f112b95c4d7019e8a234f56c78d90e12a34b56c78d90e12a99',
    '0x1D9e4B12F09c8D3E1a44C90B8211F6e0AroGyaZK_Commitment_9044',
    'did:arogyazk:0x9044D2E844F1'
  );

  // 2. Seed Hospitals
  const insertHospital = db.prepare(`
    INSERT OR IGNORE INTO hospitals (id, name, nabhRegistration, city, status, walletAddress, eddsaPublicKey, merkleLeafIndex, bondedCollateralInr)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertHospital.run(
    'HSP-402', 'Apollo Spectra Hospital', 'NABH-H-2024-8812', 'Bengaluru', 'Verified',
    '0xHSP402771B89A42C8190F3A41D7E8920B4C1A83', '0xEdDSA_HSP402_PublicKey_e1a44b7c0912d3e4f5a6', 0, 500000
  );
  insertHospital.run(
    'HSP-219', 'Fortis Diagnostics', 'NABH-L-2023-4410', 'Mumbai', 'Verified',
    '0xHSP219882C771B89A42C8190F3A41D7E8920B4C1', '0xEdDSA_HSP219_PublicKey_3c41b8e902a1f456d7e8', 1, 500000
  );
  insertHospital.run(
    'HSP-308', 'Sankara Eye Centre', 'NABH-E-2022-7719', 'Bengaluru', 'Verified',
    '0xHSP308993D661B89A42C8190F3A41D7E8920B4C1', '0xEdDSA_HSP308_PublicKey_9a01b2c3d4e5f6a7b8c9', 2, 500000
  );
  insertHospital.run(
    'HSP-512', 'Max Super Speciality', 'NABH-H-2025-3319', 'Delhi', 'Verified',
    '0xHSP512994E881B89A42C8190F3A41D7E8920B4C1', '0xEdDSA_HSP512_PublicKey_1b2c3d4e5f6a7b8c9d0e', 3, 500000
  );
  insertHospital.run(
    'HSP-615', 'Medanta Super Speciality', 'NABH-H-2026-9904', 'Gurugram', 'Pending Approval',
    '0xHSP615772E551B89A42C8190F3A41D7E8920B4C1', '0xEdDSA_HSP615_PublicKey_72f1a90c42e8f112b95c', 4, 500000
  );

  // 3. Seed Procedures
  const insertProc = db.prepare(`
    INSERT OR IGNORE INTO procedures (code, name, category, isCovered, merkleLeafIndex, standardRateInr)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertProc.run('ICD-10: I20.9', 'Cardiac Evaluation & Non-Invasive Echo', 'Cardiology', 1, 0, 75000);
  insertProc.run('ICD-10: K35.80', 'Acute Laparoscopic Appendectomy', 'Surgery', 1, 1, 64000);
  insertProc.run('ICD-10: E11.9', 'Comprehensive Endocrine Metabolic Workup', 'Pathology', 1, 2, 18500);
  insertProc.run('ICD-10: H35.3', 'Retinal Optical Coherence Tomography (OCT)', 'Ophthalmology', 1, 3, 12400);
  insertProc.run('ICD-10: M54.5', 'Lumbar MRI & Spine Rehabilitation Protocol', 'Orthopedics', 1, 4, 38000);
  insertProc.run('ICD-10: Z00.0', 'Non-Covered Elective Cosmetic Nutrition', 'Wellness', 0, 5, 9200);

  // 4. Seed Medical Records with Real AES-256-GCM Encryption
  const insertRecord = db.prepare(`
    INSERT OR IGNORE INTO medical_records (
      id, patientId, title, category, date, hospitalName, encryptionStatus, sha256Hash, ipfsCid,
      anchorTxHash, sharedWithHospitalId, sharedWithHospitalName, accessExpiresAt, clinicalNotesEncrypted,
      ciphertext, encryptionIv, authenticationTag, keyVersion, wrappedDataKey, wrappedKeyIv, wrappedKeyTag,
      fhirPayload, createdAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const updateRecordCrypto = db.prepare(`
    UPDATE medical_records SET
      ciphertext = ?, encryptionIv = ?, authenticationTag = ?, sha256Hash = ?,
      keyVersion = ?, wrappedDataKey = ?, wrappedKeyIv = ?, wrappedKeyTag = ?
    WHERE id = ? AND (ciphertext IS NULL OR ciphertext = '')
  `);

  // PAT-9041 Records
  const r1041 = encryptBaselineRecord(
    'Cardiac Stress & Echocardiogram Panel',
    'Normal LV systolic function, EF 60%. Mild exertion-induced angina resolved after daycare observation. Rest ECG normal; stress echo showed no inducible regional wall motion abnormalities. Advised lifestyle modifications, low sodium diet, and follow-up in 6 months.'
  );
  insertRecord.run(
    'REC-1041', 'PAT-9041', 'Encrypted medical record', 'Diagnostic Imaging', '2026-11-12', 'Apollo Spectra Hospital',
    'AES-256-GCM Encrypted (local)', r1041.sha256Hash, '', '', 'HSP-402', 'Apollo Spectra Hospital', now + 1000 * 3600 * 12,
    null, r1041.ciphertext, r1041.encryptionIv, r1041.authenticationTag, r1041.keyVersion,
    r1041.wrappedDataKey, r1041.wrappedKeyIv, r1041.wrappedKeyTag,
    JSON.stringify({ resourceType: 'DiagnosticReport', status: 'final', code: { text: 'Stress Echo' } }),
    now - 1000 * 3600 * 48
  );
  updateRecordCrypto.run(r1041.ciphertext, r1041.encryptionIv, r1041.authenticationTag, r1041.sha256Hash, r1041.keyVersion, r1041.wrappedDataKey, r1041.wrappedKeyIv, r1041.wrappedKeyTag, 'REC-1041');

  const r1038 = encryptBaselineRecord(
    'Inpatient Discharge Summary — Daycare Procedure',
    'Admitted for daycare cardiac evaluation. Vital signs stable: BP 124/82 mmHg, HR 72 bpm. 12-lead ECG confirmed normal sinus rhythm. Patient observed for 6 hours post non-invasive stress imaging. Discharged in stable condition with medications: Aspirin 75mg OD, Atorvastatin 20mg OD.'
  );
  insertRecord.run(
    'REC-1038', 'PAT-9041', 'Encrypted medical record', 'Discharge Summary', '2026-11-14', 'Apollo Spectra Hospital',
    'AES-256-GCM Encrypted (local)', r1038.sha256Hash, '', '', 'HSP-402', 'Apollo Spectra Hospital', now + 1000 * 3600 * 12,
    null, r1038.ciphertext, r1038.encryptionIv, r1038.authenticationTag, r1038.keyVersion,
    r1038.wrappedDataKey, r1038.wrappedKeyIv, r1038.wrappedKeyTag,
    JSON.stringify({ resourceType: 'ClinicalImpression', status: 'completed' }),
    now - 1000 * 3600 * 24
  );
  updateRecordCrypto.run(r1038.ciphertext, r1038.encryptionIv, r1038.authenticationTag, r1038.sha256Hash, r1038.keyVersion, r1038.wrappedDataKey, r1038.wrappedKeyIv, r1038.wrappedKeyTag, 'REC-1038');

  const r1022 = encryptBaselineRecord(
    'Comprehensive Metabolic & HbA1c Blood Work',
    'Fasting Blood Sugar: 94 mg/dL (Normal). HbA1c: 5.6% (Non-diabetic range). Serum Creatinine: 0.9 mg/dL. Total Cholesterol: 178 mg/dL, LDL: 102 mg/dL, HDL: 48 mg/dL, Triglycerides: 140 mg/dL. Normal renal and hepatic parameters.'
  );
  insertRecord.run(
    'REC-1022', 'PAT-9041', 'Encrypted medical record', 'Lab Report', '2026-09-28', 'Fortis Diagnostics',
    'AES-256-GCM Encrypted (local)', r1022.sha256Hash, '', '', null, null, null,
    null, r1022.ciphertext, r1022.encryptionIv, r1022.authenticationTag, r1022.keyVersion,
    r1022.wrappedDataKey, r1022.wrappedKeyIv, r1022.wrappedKeyTag,
    JSON.stringify({ resourceType: 'Observation', code: { text: 'Metabolic Panel' } }),
    now - 1000 * 3600 * 24 * 50
  );
  updateRecordCrypto.run(r1022.ciphertext, r1022.encryptionIv, r1022.authenticationTag, r1022.sha256Hash, r1022.keyVersion, r1022.wrappedDataKey, r1022.wrappedKeyIv, r1022.wrappedKeyTag, 'REC-1022');

  // REC-1015 remains unencrypted legacy demo fixture (required by security test suite)
  insertRecord.run(
    'REC-1015', 'PAT-9041', 'Encrypted medical record', 'Diagnostic Imaging', '2026-07-19', 'Sankara Eye Centre',
    'Legacy demo; encryption not verified', '', '', '', null, null, null,
    'EncryptedPayload(AES-GCM): normal foveal contour, no subretinal fluid', null, null, null, null,
    null, null, null,
    JSON.stringify({ resourceType: 'DiagnosticReport', code: { text: 'Retinal OCT' } }),
    now - 1000 * 3600 * 24 * 120
  );

  // PAT-9042 Records (Ananya Iyer)
  const r2001 = encryptBaselineRecord(
    'Advanced Ophthalmology OCT & Corneal Topography',
    'Bilateral Macular Optical Coherence Tomography (OCT) reveals normal foveal depression with well-preserved retinal architecture. Central subfield thickness: OD 242 μm, OS 246 μm. Corneal endothelial cell density: OD 2780 cells/mm2. No macular edema or drusen observed.'
  );
  insertRecord.run(
    'REC-2001', 'PAT-9042', 'Encrypted medical record', 'Diagnostic Imaging', '2026-11-18', 'Sankara Eye Centre',
    'AES-256-GCM Encrypted (local)', r2001.sha256Hash, '', '', 'HSP-308', 'Sankara Eye Centre', now + 1000 * 3600 * 8,
    null, r2001.ciphertext, r2001.encryptionIv, r2001.authenticationTag, r2001.keyVersion,
    r2001.wrappedDataKey, r2001.wrappedKeyIv, r2001.wrappedKeyTag,
    JSON.stringify({ resourceType: 'DiagnosticReport', code: { text: 'Bilateral OCT' } }),
    now - 1000 * 3600 * 18
  );

  const r2002 = encryptBaselineRecord(
    'Post-Operative Ophthalmic Medication Protocol',
    'Post-consultation eye drops regimen: Moxifloxacin 0.5% eye drops 1 drop QID for 10 days, Prednisolone acetate 1% eye drops tapering over 4 weeks, Carboxymethylcellulose 0.5% lubricating drops PRN. Avoid rubbing eyes, protect from direct sunlight with UV goggles.'
  );
  insertRecord.run(
    'REC-2002', 'PAT-9042', 'Encrypted medical record', 'Prescription', '2026-11-18', 'Sankara Eye Centre',
    'AES-256-GCM Encrypted (local)', r2002.sha256Hash, '', '', 'HSP-308', 'Sankara Eye Centre', now + 1000 * 3600 * 8,
    null, r2002.ciphertext, r2002.encryptionIv, r2002.authenticationTag, r2002.keyVersion,
    r2002.wrappedDataKey, r2002.wrappedKeyIv, r2002.wrappedKeyTag,
    JSON.stringify({ resourceType: 'MedicationRequest', code: { text: 'Ophthalmic Protocol' } }),
    now - 1000 * 3600 * 16
  );

  const r2003 = encryptBaselineRecord(
    'Complete Hemogram & Inflammatory Markers',
    'Hemoglobin: 13.4 g/dL. Total Leukocyte Count: 6,800 /μL. Platelet Count: 2.45 lakh /μL. ESR: 12 mm/1st hr. High-sensitivity CRP: 0.8 mg/L. All hematological indices within normal biological reference intervals.'
  );
  insertRecord.run(
    'REC-2003', 'PAT-9042', 'Encrypted medical record', 'Lab Report', '2026-10-05', 'Fortis Diagnostics',
    'AES-256-GCM Encrypted (local)', r2003.sha256Hash, '', '', null, null, null,
    null, r2003.ciphertext, r2003.encryptionIv, r2003.authenticationTag, r2003.keyVersion,
    r2003.wrappedDataKey, r2003.wrappedKeyIv, r2003.wrappedKeyTag,
    JSON.stringify({ resourceType: 'Observation', code: { text: 'Complete Blood Count' } }),
    now - 1000 * 3600 * 24 * 45
  );

  // PAT-9043 Records (Vikram Malhotra)
  const r3001 = encryptBaselineRecord(
    'Lumbar Spine High-Resolution MRI',
    '1.5T MRI of the Lumbosacral Spine demonstrates mild L4-L5 disc desiccation with a broad-based posterior disc bulge causing minimal anterior thecal sac indentation without significant neural foraminal narrowing. Normal conus medullaris terminating at L1 level. No evidence of spinal canal stenosis.'
  );
  insertRecord.run(
    'REC-3001', 'PAT-9043', 'Encrypted medical record', 'Diagnostic Imaging', '2026-11-10', 'Max Super Speciality',
    'AES-256-GCM Encrypted (local)', r3001.sha256Hash, '', '', 'HSP-219', 'Fortis Diagnostics', now + 1000 * 3600 * 24,
    null, r3001.ciphertext, r3001.encryptionIv, r3001.authenticationTag, r3001.keyVersion,
    r3001.wrappedDataKey, r3001.wrappedKeyIv, r3001.wrappedKeyTag,
    JSON.stringify({ resourceType: 'DiagnosticReport', code: { text: 'Spine MRI' } }),
    now - 1000 * 3600 * 24 * 10
  );

  const r3002 = encryptBaselineRecord(
    'Orthopedic Physical Rehabilitation Schedule',
    'Diagnosis: Mechanical lower back pain secondary to L4-L5 mild disc bulge. Recommended conservative management: Core stabilization physiotherapy 3 sessions/week for 4 weeks. Ergonomic lumbar support during seated work. Tablet Etoricoxib 90mg OD for 5 days PRN, Tablet Thiocolchicoside 4mg BD for 5 days.'
  );
  insertRecord.run(
    'REC-3002', 'PAT-9043', 'Encrypted medical record', 'Prescription', '2026-11-10', 'Max Super Speciality',
    'AES-256-GCM Encrypted (local)', r3002.sha256Hash, '', '', null, null, null,
    null, r3002.ciphertext, r3002.encryptionIv, r3002.authenticationTag, r3002.keyVersion,
    r3002.wrappedDataKey, r3002.wrappedKeyIv, r3002.wrappedKeyTag,
    JSON.stringify({ resourceType: 'MedicationRequest', code: { text: 'Spine Rehab' } }),
    now - 1000 * 3600 * 24 * 8
  );

  // PAT-9044 Records (Priya Patel)
  const r4001 = encryptBaselineRecord(
    'Annual Preventive Executive Health Check',
    'Comprehensive health package evaluation: Hemogram, Lipid Profile, Liver Function Tests, Renal Function Tests, Thyroid Stimulating Hormone (TSH: 2.1 mIU/L), Urine Routine. All parameters within optimal health limits. Recommended annual routine checkup.'
  );
  insertRecord.run(
    'REC-4001', 'PAT-9044', 'Encrypted medical record', 'Lab Report', '2026-11-01', 'Apollo Spectra Hospital',
    'AES-256-GCM Encrypted (local)', r4001.sha256Hash, '', '', null, null, null,
    null, r4001.ciphertext, r4001.encryptionIv, r4001.authenticationTag, r4001.keyVersion,
    r4001.wrappedDataKey, r4001.wrappedKeyIv, r4001.wrappedKeyTag,
    JSON.stringify({ resourceType: 'DiagnosticReport', code: { text: 'Annual Checkup' } }),
    now - 1000 * 3600 * 24 * 20
  );

  // 5. Seed Access Permissions (Consent Tokens)
  const insertPerm = db.prepare(`
    INSERT OR IGNORE INTO access_permissions (
      id, patientId, hospitalId, hospitalName, nabhId, scope, recordIds, grantedAt, expiresAt, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertPerm.run(
    'PRM-301', 'PAT-9041', 'HSP-402', 'Apollo Spectra Hospital', 'NABH-H-2024-8812',
    'Scoped read access for 2 record(s) — Zero export allowed',
    '["REC-1041", "REC-1038"]',
    '2026-11-23 10:00 IST',
    now + 1000 * 3600 * 12,
    'Active'
  );

  insertPerm.run(
    'PRM-302', 'PAT-9042', 'HSP-308', 'Sankara Eye Centre', 'NABH-E-2022-7719',
    'Scoped read access for 2 record(s) — Zero export allowed',
    '["REC-2001", "REC-2002"]',
    '2026-11-23 11:30 IST',
    now + 1000 * 3600 * 8,
    'Active'
  );

  insertPerm.run(
    'PRM-303', 'PAT-9043', 'HSP-219', 'Fortis Diagnostics', 'NABH-L-2023-4410',
    'Scoped read access for 1 record(s) — Zero export allowed',
    '["REC-3001"]',
    '2026-11-23 09:15 IST',
    now + 1000 * 3600 * 24,
    'Active'
  );

  insertPerm.run(
    'PRM-304', 'PAT-9041', 'HSP-219', 'Fortis Diagnostics', 'NABH-L-2023-4410',
    'Scoped read access for 1 record(s) — Zero export allowed',
    '["REC-1022"]',
    '2026-11-22 14:00 IST',
    now - 1000 * 3600 * 2,
    'Expired'
  );

  // 6. Seed Insurance Claims
  const insertClaim = db.prepare(`
    INSERT OR IGNORE INTO insurance_claims (
      id, patientId, patientMaskedId, policyNumber, insurerName, hospitalId, hospitalName, treatmentDate,
      diagnosisCodePrivate, diagnosisSummaryPrivate, billFileName, billHash, claimAmount, settlementTier,
      status, submittedAt, hospitalSignature, zkProof, nullifierHash, usedRecordHash, settlementTxHash, timeline, createdAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertClaim.run(
    'CLM-2026-884', 'PAT-9041', 'zkID:0x9041...E4B2', 'POL-AZK-774190', 'Star Shield Health Assurance',
    'HSP-402', 'Apollo Spectra Hospital', '2026-11-14',
    'ICD-10: I20.9 (Uncomplicated Daycare Angina Eval)',
    'Daycare cardiac evaluation and non-invasive stress imaging.',
    'Apollo_Invoice_884.pdf', '0x9f84c2e18b73a109d44e2b8c6190f3a41d7e8920b4c1a83f9120e4d5c6b7a801',
    75000, 'Tier 1', 'Pending', '2026-11-15 10:42 IST',
    '0xSigHSP402_8f92e1a44b7c0912d3e4f5a6',
    JSON.stringify({
      proofId: 'ZKP-2026-884',
      protocol: 'Groth16-BN254',
      circuitId: 'ClaimEligibilityV2(16,8)',
      nullifierHash: '0x44f9a21c88b3d019e72f1c45a908b321d4e5f6a7b8c9d0e1f2a3b4c5d6e7f890',
      publicSignals: [
        'policy_active=1', 'hospital_sig_valid=1', 'anchor_root_match=1',
        'claim_amount_inr=75000', 'nullifier_valid=1', 'procedure_covered=1',
        'hospital_merkle_root=0x7A9e4B...', 'record_hash_match=1', 'tier_instant_eligible=1'
      ],
      verifiedOnChain: true,
      verifierContract: '0x7A9e4B12F09c8D3E1a44C90B8211F6e0AroGyaZK',
      verificationTxHash: '0x91d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2',
      verifiedAt: '2026-11-15 05:13:04 UTC',
      checks: {
        policyEligibility: true,
        hospitalAuthorization: true,
        medicalRecordAnchor: true,
        duplicateClaimCheck: true
      }
    }),
    '0x44f9a21c88b3d019e72f1c45a908b321d4e5f6a7b8c9d0e1f2a3b4c5d6e7f890',
    '0x9f84c2e18b73a109d44e2b8c6190f3a41d7e8920b4c1a83f9120e4d5c6b7a801',
    null,
    JSON.stringify([
      { step: 1, label: 'Claim submitted', status: 'Completed', timestamp: '10:42 IST', detail: 'Signed claim digest dispatched by Apollo Spectra Hospital' },
      { step: 2, label: 'Two-Party authorization', status: 'Completed', timestamp: '10:42 IST', detail: 'Hospital EdDSA signature & patient consent token bound' },
      { step: 3, label: 'ZK proof generated (pot14)', status: 'Completed', timestamp: '10:43 IST', detail: 'ClaimEligibilityV2 (11,845 constraints) stripped ICD-10 medical diagnosis' },
      { step: 4, label: 'Smart contract verification', status: 'Completed', timestamp: '10:43 IST', detail: 'Passed on-chain Groth16 pairings (gas: 272,200)' },
      { step: 5, label: 'Tier 1 instant payout', status: 'Processing', detail: 'Queued in Insurer Privacy Guard (<= ₹1L instant rail)' }
    ]),
    now - 1000 * 3600 * 2
  );

  insertClaim.run(
    'CLM-2026-841', 'PAT-9041', 'zkID:0x9041...E4B2', 'POL-AZK-774190', 'Star Shield Health Assurance',
    'HSP-219', 'Fortis Diagnostics', '2026-09-28',
    'ICD-10: E11.9 (Routine Endocrine Panel)',
    'Annual preventive metabolic and endocrine screening.',
    'Fortis_Lab_841.pdf', '0x7e42b81d53f9a223c06d5e8120f9b345a67d89e01f23b45c67d89e01f23b4567',
    18500, 'Tier 1', 'Approved', '2026-09-29 14:15 IST',
    '0xSigHSP219_3c41b8e902a1f456d7e8c9b0',
    JSON.stringify({
      proofId: 'ZKP-2026-841',
      protocol: 'Groth16-BN254',
      circuitId: 'ClaimEligibilityV2(16,8)',
      nullifierHash: '0x19a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8',
      publicSignals: ['policy_active=1', 'hospital_sig_valid=1', 'anchor_root_match=1', 'claim_amount_inr=18500'],
      verifiedOnChain: true,
      verifierContract: '0x7A9e4B12F09c8D3E1a44C90B8211F6e0AroGyaZK',
      verificationTxHash: '0x52c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3',
      verifiedAt: '2026-09-29 08:46:19 UTC',
      checks: { policyEligibility: true, hospitalAuthorization: true, medicalRecordAnchor: true, duplicateClaimCheck: true }
    }),
    '0x19a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8',
    '0x7e42b81d53f9a223c06d5e8120f9b345a67d89e01f23b45c67d89e01f23b4567',
    '0x77b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8',
    JSON.stringify([
      { step: 1, label: 'Claim submitted', status: 'Completed', timestamp: '29 Sep', detail: 'Signed by Fortis Diagnostics' },
      { step: 2, label: 'Two-Party authorization', status: 'Completed', timestamp: '29 Sep', detail: 'Hospital EdDSA & patient consent verified' },
      { step: 3, label: 'ZK proof generated', status: 'Completed', timestamp: '29 Sep', detail: 'Groth16 proof passed' },
      { step: 4, label: 'Smart contract verification', status: 'Completed', timestamp: '29 Sep', detail: 'On-chain verification passed' },
      { step: 5, label: 'Tier 1 instant payout', status: 'Completed', timestamp: '30 Sep', detail: 'INR 18,500 settled via automated liquidity pool' }
    ]),
    now - 1000 * 3600 * 24 * 55
  );

  // 7. Seed Telemetry & Smart Contracts
  const insertContract = db.prepare(`
    INSERT OR IGNORE INTO smart_contracts (id, name, address, role, compiler, blockNumber, gasAverage, liquidityBalanceInr, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertContract.run('SC-01', 'HealthVault.sol', '0xVault8D3E1a44C90B8211F6e0AroGyaZK', 'Anchors encrypted medical records and manages access', 'Solidity v0.8.28', 19482100, '68,200 gas', 0, 'Online');
  insertContract.run('SC-02', 'ClaimSettlement.sol', '0xClaimSettlement4B12F09c8D3E1a44C90B8211F6e0', 'Verifies claims and executes Tier 1/2 payouts', 'Solidity v0.8.28', 19482102, '272,200 gas', 2500000, 'Online');
  insertContract.run('SC-03', 'HospitalRegistry.sol', '0xHospitalRegistry1a44C90B8211F6e0AroGyaZK', 'Manages approved hospital depth-16 Merkle tree roots', 'Solidity v0.8.28', 19482104, '54,100 gas', 0, 'Online');
  insertContract.run('SC-04', 'PolicyRegistry.sol', '0xPolicyRegistry44C90B8211F6e0AroGyaZK', 'Manages policy commitments and depth-8 procedure roots', 'Solidity v0.8.28', 19482106, '49,800 gas', 0, 'Online');
  insertContract.run('SC-05', 'BreakGlass.sol', '0xBreakGlass9c8D3E1a44C90B8211F6e0AroGyaZK', '2-of-3 Shamir Secret Sharing emergency ICU access', 'Solidity v0.8.28', 19482108, '88,400 gas', 0, 'Online');

  // 8. Seed Audit Logs
  const insertAudit = db.prepare(`
    INSERT OR IGNORE INTO audit_logs (id, timestamp, actorRole, actorName, action, targetResource, txHash, privacyImpact, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertAudit.run('AUD-901', '2026-11-23 10:43:04 IST', 'Smart Contract', 'ArogyaZK ClaimSettlement.sol', 'Verified Groth16 proof ZKP-2026-884 on-chain (pot14 setup)', 'CLM-2026-884', '0x91d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0', 'Zero PHI Exposed', now - 1000 * 3600 * 2);
  insertAudit.run('AUD-900', '2026-11-23 10:00:12 IST', 'Patient', 'Rohan Sharma (PAT-9041)', 'Granted 12-hour scoped read consent for 2 records', 'Apollo Spectra Hospital', '0x4b19e82f73c109d44e2b8c6190f3a41d7e8920b4', 'Consent Updated', now - 1000 * 3600 * 3);
  insertAudit.run('AUD-899', '2026-11-22 18:19:45 IST', 'Patient', 'Rohan Sharma (PAT-9041)', 'Encrypted & stored Discharge Summary (AES-256-GCM)', 'REC-1038', '0x8c20f93a84d210e55f3c9d7201a4b52e8f9a031c', 'Encrypted Vault Write', now - 1000 * 3600 * 24);

  // 9. Seed Blockchain Subnet Blocks & Transactions
  const insertBlock = db.prepare(`
    INSERT OR IGNORE INTO blockchain_blocks (number, txs, validator, gasUsed, age, timestamp)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertBlock.run(1842918, 4, '0xZKureSequencer1', '842,100', '12s ago', now - 12000);
  insertBlock.run(1842917, 6, '0xZKureSequencer1', '1,240,800', '24s ago', now - 24000);
  insertBlock.run(1842916, 3, '0xZKureSequencer2', '492,000', '36s ago', now - 36000);
  insertBlock.run(1842915, 5, '0xZKureSequencer1', '981,400', '48s ago', now - 48000);

  const insertTx = db.prepare(`
    INSERT OR IGNORE INTO blockchain_transactions (hash, method, fromAddress, toAddress, value, age, status, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertTx.run('0x55a4918204918209341094810293847102938471029384710293847102938471', 'registerHospital', '0xAdminGov99', '0xHospitalRegistry1a44C90B8211F6e0AroGyaZK', '0 INR', '36s ago', 'Success', now - 36000);
  insertTx.run('0x77c8192039410948102938471029384710293847102938471029384710293847', 'breakGlassInit', '0xDrArvindRao', '0xBreakGlass9c8D3E1a44C90B8211F6e0AroGyaZK', '0 INR', '48s ago', 'Success', now - 48000);
  insertTx.run('0x91d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2', 'verifyAndDisburse', '0xApolloHospital', '0xClaimSettlement4B12F09c8D3E1a44C90B8211F6e0', '75,000 INR', '10m ago', 'Success', now - 600000);

  console.log('[ArogyaZK DB] Baseline seeding completed successfully.');
}

