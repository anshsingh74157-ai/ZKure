import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import crypto from 'node:crypto';
import { promisify } from 'node:util';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db, initDatabase } from './db';
import {
  Field,
  Poseidon,
  BabyJubjub,
  SparseMerkleTree,
  ShamirSecretSharing,
  Groth16MathEngine,
  FIELD_PRIME,
  SUBGROUP_ORDER,
  BJJ_A,
  BJJ_D,
  BJJ_G,
  BJJ_H
} from './crypto/mathEngine';

// Initialize SQLite database
initDatabase();

// Initialize Depth-16 Sparse Merkle Tree accumulator for accredited hospitals
const hospitalMerkleTree = new SparseMerkleTree(16);
try {
  const existingHospitals = db.prepare('SELECT merkleLeafIndex, eddsaPublicKey, id FROM hospitals').all() as any[];
  for (const h of existingHospitals) {
    if (h.merkleLeafIndex !== undefined && h.merkleLeafIndex !== null) {
      const leafVal = h.eddsaPublicKey && h.eddsaPublicKey.startsWith('0x')
        ? h.eddsaPublicKey
        : crypto.createHash('sha256').update(h.id).digest('hex');
      hospitalMerkleTree.insert(Number(h.merkleLeafIndex), leafVal);
    }
  }
} catch {}

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '127.0.0.1';

// Support reverse proxies (Nginx, Cloudflare, ALB) for accurate client IP and secure cookies
app.set('trust proxy', process.env.TRUST_PROXY ? (process.env.TRUST_PROXY === 'true' ? true : Number(process.env.TRUST_PROXY) || process.env.TRUST_PROXY) : 1);

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000').split(',').map((origin) => origin.trim()).filter(Boolean);

// Security headers via Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      frameSrc: ["'self'", "blob:"],
      connectSrc: ["'self'", ...allowedOrigins],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '15mb' }));
app.use((req: Request, res: Response, next: () => void) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const origin = req.get('origin');
  if (origin && !allowedOrigins.includes(origin)) return res.status(403).json({ error: 'Request origin is not allowed' });
  next();
});

type AppRole = 'Patient' | 'Hospital' | 'Insurer' | 'Admin';
type AuthUser = { id: string; email: string; role: AppRole; linkedId: string | null };
declare global { namespace Express { interface Request { authUser?: AuthUser } } }

const scrypt = promisify(crypto.scrypt);
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const apiAttempts = new Map<string, { count: number; resetAt: number }>();

function pruneAttempts(map: Map<string, { count: number; resetAt: number }>, maxEntries = 2000) {
  const now = Date.now();
  for (const [key, entry] of map) {
    if (entry.resetAt <= now) map.delete(key);
  }
  if (map.size > maxEntries) {
    let excess = map.size - maxEntries;
    for (const key of map.keys()) {
      if (excess <= 0) break;
      map.delete(key);
      excess--;
    }
  }
}

// Background cleanup interval for rate limiter maps and expired sessions
setInterval(() => {
  pruneAttempts(loginAttempts, 2000);
  pruneAttempts(apiAttempts, 5000);
  try { db.prepare('DELETE FROM auth_sessions WHERE expiresAt <= ?').run(Date.now()); } catch {}
}, 5 * 60 * 1000).unref();

app.use((req, res, next) => {
  if (!req.path.startsWith('/api/') || req.path === '/api/health') return next();
  const key = req.ip || 'unknown';
  const now = Date.now();
  const current = apiAttempts.get(key);
  if (current && current.resetAt > now && current.count >= 300) return res.status(429).json({ error: 'Request limit exceeded' });
  apiAttempts.set(key, { count: current && current.resetAt > now ? current.count + 1 : 1, resetAt: current && current.resetAt > now ? current.resetAt : now + 60_000 });
  if (apiAttempts.size > 5000) pruneAttempts(apiAttempts, 5000);
  next();
});
const sessionLifetimeMs = 8 * 60 * 60 * 1000;
const passwordHash = async (password: string, salt = crypto.randomBytes(16).toString('hex')) => {
  const derived = await scrypt(password, salt, 64) as Buffer;
  return `${salt}:${derived.toString('hex')}`;
};
const passwordMatches = async (password: string, stored: string) => {
  const [salt, expectedHex] = stored.split(':');
  if (!salt || !/^[a-f0-9]{128}$/i.test(expectedHex || '')) return false;
  const actual = await scrypt(password, salt, 64) as Buffer;
  return crypto.timingSafeEqual(actual, Buffer.from(expectedHex, 'hex'));
};
const tokenDigest = (token: string) => crypto.createHash('sha256').update(token).digest('hex');
function readSessionToken(req: Request) {
  const bearer = req.header('authorization')?.match(/^Bearer (.+)$/i)?.[1];
  if (bearer) return bearer;
  const cookie = req.headers.cookie?.split(';').map((part) => part.trim()).find((part) => part.startsWith('azk_session='));
  return cookie ? decodeURIComponent(cookie.slice('azk_session='.length)) : undefined;
}
async function uploadCiphertextToIpfs(ciphertext: Buffer): Promise<string | null> {
  const apiBase = process.env.IPFS_API_URL?.replace(/\/$/, '');
  if (!apiBase) return null;
  const apiUrl = new URL(apiBase);
  if (apiUrl.protocol !== 'https:' && !['localhost', '127.0.0.1', '[::1]'].includes(apiUrl.hostname)) throw new Error('IPFS_API_URL must use HTTPS unless it targets localhost');
  const form = new FormData();
  form.append('file', new Blob([new Uint8Array(ciphertext)]), 'medical-record.enc');
  const headers = new Headers();
  if (process.env.IPFS_API_TOKEN) headers.set('Authorization', `Bearer ${process.env.IPFS_API_TOKEN}`);
  const response = await fetch(`${apiBase}/api/v0/add?pin=true&cid-version=1`, { method: 'POST', headers, body: form, signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`IPFS upload failed (${response.status})`);
  const result = await response.json() as { Hash?: string; Cid?: { '/': string } };
  const cid = result.Hash || result.Cid?.['/'];
  const validCid = typeof cid === 'string' && (/^b[a-z2-7]{20,}$/i.test(cid) || /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/.test(cid));
  if (!validCid) throw new Error('IPFS returned an invalid CID');
  return cid;
}
async function fetchCiphertextFromIpfs(cid: string): Promise<Buffer> {
  const cleanCid = cid.replace(/^ipfs:\/\//i, '').replace(/^\/ipfs\//i, '').trim();
  const validCid = typeof cleanCid === 'string' && (/^b[a-z2-7]{20,}$/i.test(cleanCid) || /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/.test(cleanCid));
  if (!validCid) throw new Error('Invalid IPFS CID format');

  const apiBase = process.env.IPFS_API_URL?.replace(/\/$/, '');
  if (!apiBase) throw new Error('IPFS is not configured');
  const apiUrl = new URL(apiBase);
  if (apiUrl.protocol !== 'https:' && !['localhost', '127.0.0.1', '[::1]'].includes(apiUrl.hostname)) throw new Error('IPFS_API_URL must use HTTPS unless it targets localhost');
  const headers = new Headers();
  if (process.env.IPFS_API_TOKEN) headers.set('Authorization', `Bearer ${process.env.IPFS_API_TOKEN}`);
  const response = await fetch(`${apiBase}/api/v0/cat?arg=${encodeURIComponent(cleanCid)}`, { method: 'POST', headers, signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`IPFS retrieval failed (${response.status})`);
  
  const contentLength = response.headers.get('content-length');
  if (contentLength && Number(contentLength) > 25 * 1024 * 1024) throw new Error('IPFS payload exceeds maximum allowed size (25MB)');
  const arrayBuffer = await response.arrayBuffer();
  if (arrayBuffer.byteLength > 25 * 1024 * 1024) throw new Error('IPFS payload exceeds maximum allowed size (25MB)');
  return Buffer.from(arrayBuffer);
}

// An initial administrator is provisioned only when explicit credentials are supplied.
if (process.env.BOOTSTRAP_ADMIN_EMAIL && process.env.BOOTSTRAP_ADMIN_PASSWORD &&
    !db.prepare('SELECT 1 FROM app_users WHERE role = ?').get('Admin')) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(process.env.BOOTSTRAP_ADMIN_EMAIL.trim())) throw new Error('BOOTSTRAP_ADMIN_EMAIL must be a valid email address');
  if (process.env.BOOTSTRAP_ADMIN_PASSWORD.length < 12) throw new Error('BOOTSTRAP_ADMIN_PASSWORD must be at least 12 characters');
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(process.env.BOOTSTRAP_ADMIN_PASSWORD, salt, 64).toString('hex');
  db.prepare('INSERT INTO app_users (id,email,passwordHash,role,linkedId,createdAt) VALUES (?,?,?,?,?,?)')
    .run(crypto.randomUUID(), process.env.BOOTSTRAP_ADMIN_EMAIL.trim().toLowerCase(), `${salt}:${derived}`, 'Admin', null, Date.now());
}

app.post('/api/auth/login', async (req: Request, res: Response) => {
  const ip = req.ip || 'unknown';
  const now = Date.now();
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const attemptKey = `${ip}:${email.slice(0, 254)}`;
  const emailKey = `email:${email.slice(0, 254)}`;
  
  const attempt = loginAttempts.get(attemptKey);
  const emailAttempt = email ? loginAttempts.get(emailKey) : undefined;
  if ((attempt && attempt.resetAt > now && attempt.count >= 10) ||
      (emailAttempt && emailAttempt.resetAt > now && emailAttempt.count >= 20)) {
    return res.status(429).json({ error: 'Too many login attempts; try again later' });
  }

  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const user = db.prepare('SELECT * FROM app_users WHERE email = ?').get(email) as any;
  const dummyHash = '00000000000000000000000000000000:' + '0'.repeat(128);
  const passwordValid = await passwordMatches(password.slice(0, 200), user?.passwordHash || dummyHash);
  const valid = !!user && password.length <= 200 && passwordValid;
  if (!valid) {
    const resetAt = now + 15 * 60 * 1000;
    loginAttempts.set(attemptKey, { count: attempt && attempt.resetAt > now ? attempt.count + 1 : 1, resetAt });
    if (email) loginAttempts.set(emailKey, { count: emailAttempt && emailAttempt.resetAt > now ? emailAttempt.count + 1 : 1, resetAt });
    if (loginAttempts.size > 2000) pruneAttempts(loginAttempts, 2000);
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  loginAttempts.delete(attemptKey);
  if (email) loginAttempts.delete(emailKey);
  db.prepare('DELETE FROM auth_sessions WHERE expiresAt <= ?').run(now);
  const token = crypto.randomBytes(32).toString('base64url');
  db.prepare('INSERT INTO auth_sessions (tokenHash,userId,expiresAt,createdAt) VALUES (?,?,?,?)')
    .run(tokenDigest(token), user.id, now + sessionLifetimeMs, now);
  const secureCookie = process.env.NODE_ENV === 'production' || req.secure ? '; Secure' : '';
  res.setHeader('Set-Cookie', `azk_session=${encodeURIComponent(token)}; HttpOnly; SameSite=Strict; Path=/api; Max-Age=${sessionLifetimeMs / 1000}${secureCookie}`);
  res.json({ expiresAt: now + sessionLifetimeMs, user: { id: user.id, email: user.email, role: user.role, linkedId: user.linkedId } });
});

app.post('/api/auth/logout', (req: Request, res: Response) => {
  const token = readSessionToken(req);
  if (token) db.prepare('DELETE FROM auth_sessions WHERE tokenHash = ?').run(tokenDigest(token));
  res.setHeader('Set-Cookie', 'azk_session=; HttpOnly; SameSite=Strict; Path=/api; Max-Age=0');
  res.status(204).end();
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  const token = readSessionToken(req);
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  const user = db.prepare(`SELECT u.id,u.email,u.role,u.linkedId FROM auth_sessions s JOIN app_users u ON u.id=s.userId WHERE s.tokenHash=? AND s.expiresAt>?`).get(tokenDigest(token), Date.now());
  if (!user) return res.status(401).json({ error: 'Session is invalid or expired' });
  res.json(user);
});

app.post('/api/auth/register', async (req: Request, res: Response) => {
  const ip = req.ip || 'unknown';
  const now = Date.now();
  const attemptKey = `reg:${ip}`;
  const attempt = loginAttempts.get(attemptKey);
  if (attempt && attempt.resetAt > now && attempt.count >= 20) {
    return res.status(429).json({ error: 'Too many registration requests; please try again later' });
  }

  const {
    role = 'Patient',
    email,
    password,
    name,
    insurerName,
    policyNumber,
    planName,
    coverageLimit,
    hospitalName,
    nabhRegistration,
    city,
    walletAddress
  } = req.body || {};

  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || email.trim().length > 254) {
    return res.status(400).json({ error: 'Please enter a valid email address' });
  }
  const cleanEmail = email.trim().toLowerCase();

  if (typeof password !== 'string' || password.length < 12 || password.length > 200) {
    return res.status(400).json({ error: 'Password must be at least 12 characters (up to 200)' });
  }

  if (!['Patient', 'Hospital', 'Insurer'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role for registration' });
  }

  const existing = db.prepare('SELECT 1 FROM app_users WHERE email = ?').get(cleanEmail);
  if (existing) {
    return res.status(409).json({ error: 'An account with this email address already exists' });
  }

  const resetAt = now + 15 * 60 * 1000;
  loginAttempts.set(attemptKey, { count: attempt && attempt.resetAt > now ? attempt.count + 1 : 1, resetAt });

  let linkedId: string;
  const userId = crypto.randomUUID();

  try {
    if (role === 'Patient') {
      const patientName = typeof name === 'string' && name.trim() ? name.trim().slice(0, 100) : 'Anonymous Patient';
      const cleanInsurer = typeof insurerName === 'string' && insurerName.trim() ? insurerName.trim().slice(0, 150) : 'Star Shield Health Assurance';
      const cleanPolicy = typeof policyNumber === 'string' && policyNumber.trim()
        ? policyNumber.trim().slice(0, 50)
        : `POL-ZK-${Math.floor(100000 + Math.random() * 900000)}`;
      const cleanPlan = typeof planName === 'string' && planName.trim()
        ? planName.trim().slice(0, 100)
        : 'Zero-Knowledge Comprehensive Shield';
      const limit = typeof coverageLimit === 'number' && coverageLimit > 0 ? coverageLimit : 500000;

      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      linkedId = `PAT-${randomSuffix}`;
      const zkIdHex = crypto.randomBytes(4).toString('hex').toUpperCase();
      const zkIdEnd = crypto.randomBytes(2).toString('hex').toUpperCase();
      const zkId = `zkID:0x${zkIdHex}...${zkIdEnd}`;
      const secretPolicySalt = `0x${crypto.randomBytes(32).toString('hex')}`;
      const policyCommitment = Poseidon.computePolicyCommitment(secretPolicySalt, cleanPolicy);
      const didUri = `did:arogyazk:${linkedId}`;

      db.prepare(`
        INSERT INTO patients (id, name, zkId, policyNumber, insurerName, planName, coverageLimit, spentAmount, validTill, secretPolicySalt, policyCommitment, didUri)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0, '2027-12-31', ?, ?, ?)
      `).run(linkedId, patientName, zkId, cleanPolicy, cleanInsurer, cleanPlan, limit, secretPolicySalt, policyCommitment, didUri);

    } else if (role === 'Hospital') {
      const cleanHospName = typeof hospitalName === 'string' && hospitalName.trim()
        ? hospitalName.trim().slice(0, 200)
        : (typeof name === 'string' && name.trim() ? name.trim().slice(0, 200) : 'Accredited Medical Center');
      const cleanNabh = typeof nabhRegistration === 'string' && nabhRegistration.trim()
        ? nabhRegistration.trim().slice(0, 100)
        : `NABH-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const cleanCity = typeof city === 'string' && city.trim() ? city.trim().slice(0, 120) : 'Bengaluru';
      const cleanWallet = typeof walletAddress === 'string' && /^0x[a-fA-F0-9]{40}$/.test(walletAddress.trim())
        ? walletAddress.trim()
        : `0x${crypto.randomBytes(20).toString('hex')}`;

      const hospCount = (db.prepare('SELECT COUNT(*) as count FROM hospitals').get() as { count: number }).count;
      linkedId = `HSP-${Date.now().toString().slice(-3)}${Math.floor(10 + Math.random() * 90)}`;
      const eddsaKey = `0x${crypto.randomBytes(32).toString('hex')}`;

      db.prepare(`
        INSERT INTO hospitals (id, name, nabhRegistration, city, status, walletAddress, eddsaPublicKey, merkleLeafIndex, bondedCollateralInr)
        VALUES (?, ?, ?, ?, 'Locally Verified', ?, ?, ?, 500000)
      `).run(linkedId, cleanHospName, cleanNabh, cleanCity, cleanWallet, eddsaKey, hospCount);

      hospitalMerkleTree.insert(hospCount, eddsaKey);

    } else { // Insurer
      linkedId = typeof insurerName === 'string' && insurerName.trim()
        ? insurerName.trim().slice(0, 150)
        : (typeof name === 'string' && name.trim() ? name.trim().slice(0, 150) : 'Consortium Health Underwriter');
    }

    const hashedPassword = await passwordHash(password);
    db.prepare('INSERT INTO app_users (id, email, passwordHash, role, linkedId, createdAt) VALUES (?, ?, ?, ?, ?, ?)')
      .run(userId, cleanEmail, hashedPassword, role, linkedId, now);

    db.prepare('DELETE FROM auth_sessions WHERE expiresAt <= ?').run(now);
    const token = crypto.randomBytes(32).toString('base64url');
    db.prepare('INSERT INTO auth_sessions (tokenHash, userId, expiresAt, createdAt) VALUES (?, ?, ?, ?)')
      .run(tokenDigest(token), userId, now + sessionLifetimeMs, now);

    const secureCookie = process.env.NODE_ENV === 'production' || req.secure ? '; Secure' : '';
    res.setHeader('Set-Cookie', `azk_session=${encodeURIComponent(token)}; HttpOnly; SameSite=Strict; Path=/api; Max-Age=${sessionLifetimeMs / 1000}${secureCookie}`);

    appendAuditLog({
      actorRole: role,
      actorName: `${cleanEmail} (${linkedId})`,
      action: `Self-registered new ${role} account and initial identity vault`,
      targetResource: 'Consortium Identity Vault',
      txHash: '',
      privacyImpact: 'Consent Updated'
    });

    return res.status(201).json({
      message: 'Account registered successfully',
      expiresAt: now + sessionLifetimeMs,
      user: { id: userId, email: cleanEmail, role, linkedId }
    });
  } catch (err: any) {
    console.error('[Registration Error]', err);
    return res.status(500).json({ error: 'Failed to complete registration' });
  }
});

function authenticate(req: Request, res: Response, next: () => void) {
  const token = readSessionToken(req);
  if (!token || token.length > 200) return res.status(401).json({ error: 'Authentication required' });
  const user = db.prepare(`SELECT u.id,u.email,u.role,u.linkedId FROM auth_sessions s JOIN app_users u ON u.id=s.userId WHERE s.tokenHash=? AND s.expiresAt>?`).get(tokenDigest(token), Date.now()) as AuthUser | undefined;
  if (!user) return res.status(401).json({ error: 'Session is invalid or expired' });
  req.authUser = user;
  next();
}

function allowRoles(...roles: AppRole[]) {
  return (req: Request, res: Response, next: () => void) => {
    if (!req.authUser) return res.status(401).json({ error: 'Authentication required' });
    if (!roles.includes(req.authUser.role)) return res.status(403).json({ error: 'Insufficient role' });
    next();
  };
}

function recordKeyring(): { activeVersion: number; keys: Map<number, Buffer> } | null {
  try {
    const configured = process.env.RECORD_KEYRING_JSON;
    let fallbackKey = process.env.RECORD_ENCRYPTION_KEY;
    if (!fallbackKey && existsSync(path.resolve(process.cwd(), '.env.key'))) {
      try { fallbackKey = readFileSync(path.resolve(process.cwd(), '.env.key'), 'utf8').trim(); } catch {}
    }
    const raw: Record<string, string> = configured
      ? JSON.parse(configured)
      : (fallbackKey ? { '1': fallbackKey } : {});
    const keys = new Map<number, Buffer>();
    for (const [versionText, hex] of Object.entries(raw)) {
      const version = Number(versionText);
      if (!Number.isSafeInteger(version) || version < 1 || !/^[a-fA-F0-9]{64}$/.test(hex)) return null;
      keys.set(version, Buffer.from(hex, 'hex'));
    }
    const activeVersion = Number(process.env.RECORD_ACTIVE_KEY_VERSION || Math.max(...keys.keys()));
    if (!keys.size || !keys.has(activeVersion)) return null;
    return { activeVersion, keys };
  } catch { return null; }
}

app.post('/api/admin/users', authenticate, allowRoles('Admin'), async (req: Request, res: Response) => {
  const { email, password, role, linkedId } = req.body || {};
  const normalizedLinkedId = typeof linkedId === 'string' ? linkedId.trim() : null;
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 ||
      typeof password !== 'string' || password.length < 12 || password.length > 200 ||
      !['Patient', 'Hospital', 'Insurer', 'Admin'].includes(role) || (role !== 'Admin' && !normalizedLinkedId)) {
    return res.status(400).json({ error: 'Provide a valid email, password (12–200 chars), role, and linkedId for non-admin roles' });
  }
  if (role !== 'Admin') {
    const linkedExists = role === 'Insurer'
      ? db.prepare('SELECT 1 FROM patients WHERE insurerName=?').get(normalizedLinkedId)
      : db.prepare(`SELECT 1 FROM ${role === 'Patient' ? 'patients' : 'hospitals'} WHERE id=?`).get(normalizedLinkedId);
    if (!linkedExists) return res.status(400).json({ error: 'linkedId does not identify an existing account record' });
  }
  try {
    const id = crypto.randomUUID();
    db.prepare('INSERT INTO app_users (id,email,passwordHash,role,linkedId,createdAt) VALUES (?,?,?,?,?,?)')
      .run(id, email.trim().toLowerCase(), await passwordHash(password), role, normalizedLinkedId, Date.now());
    return res.status(201).json({ id, email: email.trim().toLowerCase(), role, linkedId: normalizedLinkedId });
  } catch {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }
});

// Helper for executing atomic transactions with node:sqlite (DatabaseSync)
function runTransaction<T>(fn: () => T): T {
  db.exec('BEGIN');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

app.post('/api/admin/records/rotate-key', authenticate, allowRoles('Admin'), (req: Request, res: Response) => {
  const keyring = recordKeyring();
  if (!keyring) return res.status(503).json({ error: 'Record keyring is not configured' });
  const targetKey = keyring.keys.get(keyring.activeVersion)!;
  const records = db.prepare('SELECT id,keyVersion,wrappedDataKey,wrappedKeyIv,wrappedKeyTag,ciphertext,encryptionIv FROM medical_records').all() as any[];
  const rotatable = records.filter((r) => (r.wrappedDataKey && r.wrappedKeyIv && r.wrappedKeyTag) || (r.ciphertext && r.encryptionIv));
  if (rotatable.length === 0) {
    return res.json({ rotated: 0, activeKeyVersion: keyring.activeVersion, message: 'No encrypted records eligible for rotation' });
  }
  try {
    runTransaction(() => {
      const update = db.prepare('UPDATE medical_records SET keyVersion=?,wrappedDataKey=?,wrappedKeyIv=?,wrappedKeyTag=? WHERE id=?');
      for (const record of rotatable) {
        let dataKey: Buffer;
        if (record.wrappedDataKey && record.wrappedKeyIv && record.wrappedKeyTag && record.keyVersion) {
          const oldKey = keyring.keys.get(Number(record.keyVersion));
          if (!oldKey) throw new Error('A required old record key is unavailable');
          const unwrap = crypto.createDecipheriv('aes-256-gcm', oldKey, Buffer.from(record.wrappedKeyIv, 'hex'));
          unwrap.setAuthTag(Buffer.from(record.wrappedKeyTag, 'hex'));
          dataKey = Buffer.concat([unwrap.update(Buffer.from(record.wrappedDataKey, 'base64')), unwrap.final()]);
        } else {
          let legacyKey = process.env.RECORD_ENCRYPTION_KEY;
          if (!legacyKey && existsSync(path.resolve(process.cwd(), '.env.key'))) {
            try { legacyKey = readFileSync(path.resolve(process.cwd(), '.env.key'), 'utf8').trim(); } catch {}
          }
          if (!legacyKey || !/^[a-fA-F0-9]{64}$/.test(legacyKey)) throw new Error('A legacy record key is unavailable');
          dataKey = Buffer.from(legacyKey, 'hex');
        }
        const iv = crypto.randomBytes(12);
        const wrap = crypto.createCipheriv('aes-256-gcm', targetKey, iv);
        const wrapped = Buffer.concat([wrap.update(dataKey), wrap.final()]);
        update.run(keyring.activeVersion, wrapped.toString('base64'), iv.toString('hex'), wrap.getAuthTag().toString('hex'), record.id);
      }
    });
  } catch {
    return res.status(409).json({ error: 'Key rotation failed; no records were changed. Ensure every previous key version is present in the keyring.' });
  }
  appendAuditLog({ actorRole: 'Admin', actorName: req.authUser!.email, action: `Rewrapped record data keys to key version ${keyring.activeVersion}`, targetResource: `${rotatable.length} medical records`, txHash: '', privacyImpact: 'Encryption key metadata rotated' });
  res.json({ rotated: rotatable.length, activeKeyVersion: keyring.activeVersion });
});

// Helper: Append Audit Log to SQLite
function appendAuditLog(entry: {
  actorRole: string;
  actorName: string;
  action: string;
  targetResource: string;
  txHash: string;
  privacyImpact: string;
}) {
  const id = `AUD-${crypto.randomUUID()}`;
  const timestamp = new Date().toLocaleTimeString('en-IN', { hour12: false }) + ' IST';
  const now = Date.now();

  db.prepare(`
    INSERT INTO audit_logs (id, timestamp, actorRole, actorName, action, targetResource, txHash, privacyImpact, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, timestamp, entry.actorRole, entry.actorName, entry.action, entry.targetResource, entry.txHash, entry.privacyImpact, now);
}

// -------------------------------------------------------------
// 1. Health & Architecture Info
// -------------------------------------------------------------
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    network: 'Not configured',
    engine: 'Groth16 prover/verifier not configured',
    circuit: { status: 'No circuit or verification key is present in this repository' },
    database: {
      driver: 'node:sqlite (WAL mode)',
      status: 'connected'
    }
  });
});

// Health remains public. Every other API route is authenticated by default.
app.use('/api', authenticate);

// India-focused sample fixtures for the prototype. These never enter claim settlement.
app.get('/api/prototype/dataset', (req: Request, res: Response) => {
  const user = req.authUser!;
  let patients = db.prepare('SELECT * FROM prototype_patients ORDER BY id').all() as any[];
  let hospitals = db.prepare('SELECT * FROM prototype_hospitals ORDER BY id').all() as any[];
  let cases = db.prepare('SELECT * FROM prototype_cases ORDER BY id').all() as any[];
  if (user.role === 'Patient') {
    patients = patients.filter((p) => p.id === user.linkedId);
    const allowed = new Set(patients.map((p) => p.id));
    cases = cases.filter((c) => allowed.has(c.patientId));
    const hospitalIds = new Set(cases.map((c) => c.hospitalId));
    hospitals = hospitals.filter((h) => hospitalIds.has(h.id));
  } else if (user.role === 'Hospital') {
    hospitals = hospitals.filter((h) => h.id === user.linkedId);
    cases = cases.filter((c) => c.hospitalId === user.linkedId);
    const patientIds = new Set(cases.map((c) => c.patientId));
    patients = patients.filter((p) => patientIds.has(p.id));
  } else if (user.role === 'Insurer') {
    patients = patients.filter((p) => p.insurerName === user.linkedId);
    cases = cases.filter((c) => c.insurerName === user.linkedId);
    const hospitalIds = new Set(cases.map((c) => c.hospitalId));
    patients = patients.map(({ name: _name, city: _city, state: _state, ...policy }) => policy);
    hospitals = hospitals.filter((h) => hospitalIds.has(h.id));
  }
  res.json({
    datasetType: 'synthetic prototype data',
    disclaimer: 'All people, providers, policies and cases are fictional examples. Amounts are INR. Cases are not submitted claims; no signatures, proofs, settlements or blockchain transactions are represented.',
    currency: 'INR',
    insurers: user.role === 'Admin' ? prototypeInsurers : undefined,
    patients,
    hospitals,
    cases
  });
});

// -------------------------------------------------------------
// 2. Patient Profile
// -------------------------------------------------------------
app.get('/api/patient/profile', allowRoles('Patient'), (req: Request, res: Response) => {
  const patient = db.prepare('SELECT id,name,zkId,policyNumber,insurerName,planName,coverageLimit,spentAmount,validTill,didUri FROM patients WHERE id = ?').get(req.authUser?.linkedId || '');
  if (!patient) return res.status(404).json({ error: 'Patient not found' });
  res.json(patient);
});

// -------------------------------------------------------------
// 3. Medical Records (FHIR + AES-256-GCM)
// -------------------------------------------------------------
app.get('/api/records', allowRoles('Patient', 'Hospital'), (req: Request, res: Response) => {
  const { category, sharedOnly } = req.query;
  const categories = ['All', 'Lab Report', 'Discharge Summary', 'Diagnostic Imaging', 'Prescription'];
  if ((category !== undefined && (typeof category !== 'string' || !categories.includes(category))) || (sharedOnly !== undefined && sharedOnly !== 'true' && sharedOnly !== 'false')) return res.status(400).json({ error: 'Invalid record filters' });
  let query = 'SELECT * FROM medical_records WHERE 1=1';
  const params: any[] = [];

  if (req.authUser?.role === 'Patient') {
    query += ' AND patientId = ?';
    params.push(req.authUser.linkedId);
  } else if (req.authUser?.role === 'Hospital') {
    query += ` AND ((sharedWithHospitalId = ? AND accessExpiresAt > ? AND EXISTS (
      SELECT 1 FROM access_permissions p WHERE p.patientId=medical_records.patientId
      AND p.hospitalId=? AND p.status='Active' AND p.expiresAt>? AND EXISTS (SELECT 1 FROM json_each(p.recordIds) AS permitted WHERE permitted.value=medical_records.id)
    )) OR EXISTS (
      SELECT 1 FROM break_glass_sessions s WHERE (s.hospitalId=? OR s.hospitalId IS NULL) AND s.patientId=medical_records.patientId AND s.status='Active_Unlocked' AND s.expiresAt>?
    ))`;
    params.push(req.authUser.linkedId, Date.now(), req.authUser.linkedId, Date.now(), req.authUser.linkedId, Date.now());
  }

  if (category && category !== 'All') {
    query += ' AND category = ?';
    params.push(category);
  }

  if (sharedOnly === 'true') {
    query += ' AND sharedWithHospitalId IS NOT NULL';
  }

  query += ' ORDER BY createdAt DESC';
  const records = db.prepare(query).all(...params).map((record: any) => {
    const { clinicalNotesEncrypted, ciphertext, encryptionIv, authenticationTag, wrappedDataKey, wrappedKeyIv, wrappedKeyTag, keyVersion, fhirPayload, ...metadata } = record;
    if (!record.ciphertext || !record.encryptionIv || !record.authenticationTag) {
      metadata.encryptionStatus = 'Legacy demo; encryption not verified';
      metadata.sha256Hash = '';
      metadata.ipfsCid = '';
      metadata.anchorTxHash = '';
    }
    return metadata;
  });
  res.json(records);
});

app.post('/api/records', allowRoles('Patient'), async (req: Request, res: Response) => {
  const { title, category, hospitalName, clinicalNotes, fileName, fileContent } = req.body || {};
  const categories = ['Lab Report', 'Discharge Summary', 'Diagnostic Imaging', 'Prescription'];
  if (
    typeof title !== 'string' ||
    !title.trim() ||
    title.length > 200 ||
    (category !== undefined && !categories.includes(category)) ||
    (hospitalName !== undefined && (typeof hospitalName !== 'string' || hospitalName.length > 200))
  ) {
    return res.status(400).json({ error: 'A valid title (max 200 chars) is required' });
  }

  if (clinicalNotes !== undefined && clinicalNotes !== null && typeof clinicalNotes !== 'string') {
    return res.status(400).json({ error: 'clinicalNotes must be a string' });
  }
  if (typeof clinicalNotes === 'string' && clinicalNotes.length > 20000) {
    return res.status(400).json({ error: 'clinicalNotes must be at most 20,000 characters' });
  }

  if (fileName !== undefined && fileName !== null && (typeof fileName !== 'string' || fileName.length > 255)) {
    return res.status(400).json({ error: 'fileName must be a string of at most 255 characters' });
  }

  if (fileContent !== undefined && fileContent !== null) {
    if (typeof fileContent !== 'string' || fileContent.length > 10_485_760) {
      return res.status(400).json({ error: 'fileContent must be a Base64 string of at most 10MB' });
    }
  }

  const hasNotes = typeof clinicalNotes === 'string' && clinicalNotes.trim().length > 0;
  const hasFile = typeof fileContent === 'string' && fileContent.trim().length > 0;
  if (!hasNotes && !hasFile) {
    return res.status(400).json({ error: 'Either clinical notes or a file upload is required' });
  }

  const keyring = recordKeyring();
  if (!keyring) {
    return res.status(503).json({ error: 'Record encryption is not configured; record was not stored' });
  }

  const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(req.authUser?.linkedId || '') as any;
  if (!patient) return res.status(404).json({ error: 'Patient account is not linked to a patient profile' });
  const id = `REC-${crypto.randomUUID()}`;
  const now = Date.now();
  const date = new Date().toISOString().slice(0, 10);

  // Compute SHA-256 fingerprint
  const iv = crypto.randomBytes(12);
  const dataKey = crypto.randomBytes(32);
  const cipher = crypto.createCipheriv('aes-256-gcm', dataKey, iv);
  const plaintextPayload: {
    title: string;
    clinicalNotes: string;
    fileName?: string;
    fileContent?: string;
    timestamp: number;
  } = {
    title: title.trim(),
    clinicalNotes: typeof clinicalNotes === 'string' ? clinicalNotes : '',
    timestamp: now
  };
  if (typeof fileName === 'string' && fileName.trim().length > 0) plaintextPayload.fileName = fileName.trim();
  if (typeof fileContent === 'string' && fileContent.trim().length > 0) plaintextPayload.fileContent = fileContent.trim();
  const plaintext = Buffer.from(JSON.stringify(plaintextPayload), 'utf8');
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authenticationTag = cipher.getAuthTag();
  const wrappedKeyIv = crypto.randomBytes(12);
  const wrapCipher = crypto.createCipheriv('aes-256-gcm', keyring.keys.get(keyring.activeVersion)!, wrappedKeyIv);
  const wrappedDataKey = Buffer.concat([wrapCipher.update(dataKey), wrapCipher.final()]);
  const wrappedKeyTag = wrapCipher.getAuthTag();
  const hash = '0x' + crypto.createHash('sha256').update(plaintext).digest('hex');
  let ipfsCid: string | null = null;
  try {
    ipfsCid = await uploadCiphertextToIpfs(ciphertext);
  } catch (ipfsErr: any) {
    console.warn('[IPFS] Upload failed, falling back to local storage:', ipfsErr?.message || ipfsErr);
    ipfsCid = null;
  }
  // No chain client is configured. Never invent an anchor transaction hash.
  const anchorTx = '';

  db.prepare(`
    INSERT INTO medical_records (
      id, patientId, title, category, date, hospitalName, encryptionStatus,
      sha256Hash, ipfsCid, anchorTxHash, sharedWithHospitalId, sharedWithHospitalName,
      accessExpiresAt, clinicalNotesEncrypted, ciphertext, encryptionIv, authenticationTag, keyVersion,
      wrappedDataKey, wrappedKeyIv, wrappedKeyTag, fhirPayload, createdAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, patient.id, 'Encrypted medical record', category || 'Lab Report', date, '',
    ipfsCid ? 'AES-256-GCM Encrypted + IPFS' : 'AES-256-GCM Encrypted (local)', hash, ipfsCid || '', anchorTx, null, null, null,
    null, ciphertext.toString('base64'), iv.toString('hex'), authenticationTag.toString('hex'), keyring.activeVersion,
    wrappedDataKey.toString('base64'), wrappedKeyIv.toString('hex'), wrappedKeyTag.toString('hex'), null,
    now
  );

  appendAuditLog({
    actorRole: 'Patient',
    actorName: `Patient ${patient.id}`,
    action: ipfsCid ? 'Created AES-256-GCM encrypted medical record and uploaded ciphertext to IPFS' : 'Created AES-256-GCM encrypted medical record in local storage',
    targetResource: id,
    txHash: '',
    privacyImpact: 'Encrypted Vault Write'
  });

  // Never return encrypted payload or key material from the write endpoint.
  res.status(201).json({
    id,
    title: 'Encrypted medical record',
    category: category || 'Lab Report',
    date,
    hospitalName: '',
    encryptionStatus: ipfsCid ? 'AES-256-GCM Encrypted + IPFS' : 'AES-256-GCM Encrypted (local)',
    status: ipfsCid ? 'AES-256-GCM Encrypted + IPFS' : 'AES-256-GCM Encrypted (local)',
    sha256Hash: hash,
    anchorTxHash: anchorTx,
    sharedWithHospitalId: null,
    sharedWithHospitalName: null,
    accessExpiresAt: null,
    createdAt: now
  });
});

app.get('/api/records/:id/decrypt', allowRoles('Patient', 'Hospital'), async (req: Request, res: Response) => {
  const record = db.prepare('SELECT * FROM medical_records WHERE id=?').get(req.params.id) as any;
  if (!record) return res.status(404).json({ error: 'Record not found' });
  if (req.authUser?.role === 'Patient' && record.patientId !== req.authUser.linkedId) return res.status(403).json({ error: 'Record is not owned by this patient' });
  if (req.authUser?.role === 'Hospital') {
    const permission = db.prepare(`SELECT 1 FROM access_permissions p WHERE patientId=? AND hospitalId=? AND status='Active' AND expiresAt>? AND EXISTS (SELECT 1 FROM json_each(p.recordIds) AS permitted WHERE permitted.value=?)`).get(record.patientId, req.authUser.linkedId, Date.now(), record.id);
    const breakGlass = db.prepare("SELECT 1 FROM break_glass_sessions WHERE (hospitalId=? OR hospitalId IS NULL) AND patientId=? AND status='Active_Unlocked' AND expiresAt>?").get(req.authUser.linkedId, record.patientId, Date.now());
    if (!permission && !breakGlass) return res.status(403).json({ error: 'No active consent for this record' });
  }
  const keyring = recordKeyring();
  if (!keyring) return res.status(503).json({ error: 'Record decryption is not configured' });
  try {
    let encrypted: Buffer | null = null;
    if (record.ciphertext) {
      encrypted = Buffer.from(record.ciphertext, 'base64');
    } else if (process.env.IPFS_API_URL && record.ipfsCid) {
      try {
        encrypted = await fetchCiphertextFromIpfs(record.ipfsCid);
      } catch (ipfsErr) {
        console.warn(`[IPFS] Failed to fetch CID ${record.ipfsCid}:`, ipfsErr);
      }
    }

    if (!encrypted || encrypted.length === 0) {
      if (record.clinicalNotesEncrypted || record.encryptionStatus?.startsWith('Legacy demo')) {
        return res.json({
          id: record.id,
          sha256Hash: record.sha256Hash || '',
          title: record.title === 'Encrypted medical record' ? 'Ophthalmology Retinal OCT Screening' : (record.title || 'Clinical Record'),
          clinicalNotes: record.clinicalNotesEncrypted || 'Normal foveal contour, no subretinal fluid observed.'
        });
      }
      return res.status(422).json({ error: 'Encrypted record payload is unavailable' });
    }
    let dataKey: Buffer;
    if (record.wrappedDataKey && record.wrappedKeyIv && record.wrappedKeyTag && record.keyVersion) {
      const kek = keyring.keys.get(Number(record.keyVersion));
      if (!kek) return res.status(503).json({ error: 'Record encryption key version is unavailable; restore the matching key backup' });
      const unwrap = crypto.createDecipheriv('aes-256-gcm', kek, Buffer.from(record.wrappedKeyIv, 'hex'));
      unwrap.setAuthTag(Buffer.from(record.wrappedKeyTag, 'hex'));
      dataKey = Buffer.concat([unwrap.update(Buffer.from(record.wrappedDataKey, 'base64')), unwrap.final()]);
    } else {
      // Legacy rows used RECORD_ENCRYPTION_KEY directly as the data key.
      const legacyKey = process.env.RECORD_ENCRYPTION_KEY;
      if (!legacyKey || !/^[a-fA-F0-9]{64}$/.test(legacyKey)) return res.status(503).json({ error: 'Legacy record key is unavailable' });
      dataKey = Buffer.from(legacyKey, 'hex');
    }
    const decipher = crypto.createDecipheriv('aes-256-gcm', dataKey, Buffer.from(record.encryptionIv, 'hex'));
    decipher.setAuthTag(Buffer.from(record.authenticationTag, 'hex'));
    const plaintext = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    const actualHash = crypto.createHash('sha256').update(plaintext).digest('hex');
    if (actualHash !== String(record.sha256Hash).replace(/^0x/, '')) return res.status(422).json({ error: 'Record integrity verification failed' });
    const payload = JSON.parse(plaintext.toString('utf8'));
    res.json({
      id: record.id,
      sha256Hash: record.sha256Hash,
      title: payload.title,
      clinicalNotes: payload.clinicalNotes ?? '',
      ...(payload.fileName || payload.fileContent ? {
        fileName: payload.fileName || null,
        fileContent: payload.fileContent || null
      } : {})
    });
  } catch (err: any) {
    console.error(`[Decryption Error for ${record.id}]:`, err?.message || err);
    res.status(422).json({ error: 'Encrypted record failed authentication or could not be retrieved' });
  }
});

// -------------------------------------------------------------
// 4. Access Permissions (ABDM / DPDP Consent Tokens)
// -------------------------------------------------------------
app.get('/api/permissions', allowRoles('Patient', 'Hospital'), (req: Request, res: Response) => {
  const permissionsQuery = req.authUser?.role === 'Patient'
    ? db.prepare('SELECT * FROM access_permissions WHERE patientId = ? ORDER BY rowid DESC').all(req.authUser.linkedId)
    : db.prepare("SELECT * FROM access_permissions WHERE hospitalId=? AND status='Active' AND expiresAt>? ORDER BY rowid DESC").all(req.authUser?.linkedId, Date.now());
  const permissions = permissionsQuery.map((p: any) => ({
    ...p,
    recordIds: JSON.parse(p.recordIds),
    status: p.status === 'Active' && p.expiresAt <= Date.now() ? 'Expired' : p.status
  }));
  res.json(permissions);
});

app.post('/api/permissions/grant', allowRoles('Patient'), (req: Request, res: Response) => {
  const { hospitalId, recordIds, hours } = req.body;
  if (typeof hospitalId !== 'string' || !Array.isArray(recordIds)) {
    return res.status(400).json({ error: 'Invalid permission payload' });
  }

  if (recordIds.length < 1 || recordIds.length > 100 || recordIds.some((id: unknown) => typeof id !== 'string')) return res.status(400).json({ error: 'recordIds must contain 1 to 100 record IDs' });
  const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(req.authUser?.linkedId || '') as any;
  if (!patient) return res.status(404).json({ error: 'Patient account is not linked to a patient profile' });
  const hospital = db.prepare("SELECT id,name,nabhRegistration FROM hospitals WHERE id=? AND status='Verified'").get(hospitalId) as any;
  if (!hospital) return res.status(400).json({ error: 'Hospital is not verified' });
  const ownedCount = (db.prepare(`SELECT COUNT(*) AS count FROM medical_records WHERE patientId=? AND id IN (${recordIds.map(() => '?').join(',')})`).get(patient.id, ...recordIds) as any)?.count;
  if (ownedCount !== recordIds.length) return res.status(403).json({ error: 'One or more records are not owned by this patient' });
  if (!Number.isInteger(Number(hours)) || Number(hours) < 1 || Number(hours) > 24) return res.status(400).json({ error: 'hours must be between 1 and 24' });
  const permId = `PRM-${crypto.randomUUID()}`;
  const now = Date.now();
  const expiresAt = now + Number(hours) * 3600 * 1000;
  const grantedAt = new Date().toLocaleTimeString('en-IN', { hour12: false }) + ' IST';
  const txHash = '';

  runTransaction(() => {
    db.prepare(`
    INSERT INTO access_permissions (
      id, patientId, hospitalId, hospitalName, nabhId, scope, recordIds, grantedAt, expiresAt, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      permId, patient.id, hospitalId, hospital.name, hospital.nabhRegistration,
      `Scoped read access for ${recordIds.length} record(s) — Zero export allowed`,
      JSON.stringify(recordIds), grantedAt, expiresAt, 'Active'
    );

    // These columns are a UI cache only; access is always authorized from permission rows.
    const updateRecord = db.prepare(`UPDATE medical_records
      SET sharedWithHospitalId = ?, sharedWithHospitalName = ?, accessExpiresAt = ? WHERE id = ?`);
    for (const rid of recordIds) updateRecord.run(hospitalId, hospital.name, expiresAt, rid);
  });

  appendAuditLog({
    actorRole: 'Patient',
    actorName: `${patient.name} (${patient.id})`,
    action: `Granted ${hours}h temporary access token to ${hospital.name}`,
    targetResource: recordIds.join(', '),
    txHash: txHash.slice(0, 14) + '...',
    privacyImpact: 'Consent Updated'
  });

  res.status(201).json({ id: permId, status: 'Active', expiresAt, hospitalName: hospital.name, nabhId: hospital.nabhRegistration });
});

app.post('/api/permissions/revoke/:id', allowRoles('Patient'), (req: Request, res: Response) => {
  const perm = db.prepare('SELECT * FROM access_permissions WHERE id = ? AND patientId = ?').get(req.params.id, req.authUser?.linkedId) as any;
  if (!perm) return res.status(404).json({ error: 'Permission not found' });

  const recordIds: string[] = JSON.parse(perm.recordIds);
  runTransaction(() => {
    db.prepare("UPDATE access_permissions SET status = 'Revoked' WHERE id = ?").run(req.params.id);
    const refreshRecord = db.prepare(`UPDATE medical_records SET
      sharedWithHospitalId = (SELECT p.hospitalId FROM access_permissions p
        WHERE p.patientId=medical_records.patientId AND p.status='Active' AND p.expiresAt>?
          AND EXISTS (SELECT 1 FROM json_each(p.recordIds) j WHERE j.value=medical_records.id)
        ORDER BY p.expiresAt DESC LIMIT 1),
      sharedWithHospitalName = (SELECT p.hospitalName FROM access_permissions p
        WHERE p.patientId=medical_records.patientId AND p.status='Active' AND p.expiresAt>?
          AND EXISTS (SELECT 1 FROM json_each(p.recordIds) j WHERE j.value=medical_records.id)
        ORDER BY p.expiresAt DESC LIMIT 1),
      accessExpiresAt = (SELECT MAX(p.expiresAt) FROM access_permissions p
        WHERE p.patientId=medical_records.patientId AND p.status='Active' AND p.expiresAt>?
          AND EXISTS (SELECT 1 FROM json_each(p.recordIds) j WHERE j.value=medical_records.id))
      WHERE id=? AND patientId=?`);
    for (const rid of recordIds) refreshRecord.run(Date.now(), Date.now(), Date.now(), rid, perm.patientId);
  });

  const patient = db.prepare('SELECT * FROM patients WHERE id=?').get(req.authUser?.linkedId || '') as any;

  appendAuditLog({
    actorRole: 'Patient',
    actorName: `${patient.name} (${patient.id})`,
    action: `Revoked access token ${perm.id} immediately`,
    targetResource: perm.hospitalName,
    txHash: '',
    privacyImpact: 'Consent Updated'
  });

  res.json({ message: 'Permission revoked successfully', id: perm.id });
});

// -------------------------------------------------------------
// 5. Insurance Claims (Groth16 + Two-Party Authorization + Hybrid Settlement)
// -------------------------------------------------------------
app.get('/api/claims', allowRoles('Patient', 'Hospital', 'Insurer'), (req: Request, res: Response) => {
  // Existing database rows were generated by the retired demo implementation, not real claim workflows.
  res.json([]);
});

app.get('/api/claims/:id', allowRoles('Patient', 'Hospital', 'Insurer'), (req: Request, res: Response) => {
  res.status(404).json({ error: 'Claim not found; legacy demonstration claims are not exposed' });
});

app.post('/api/claims', allowRoles('Hospital'), (_req: Request, res: Response) => res.status(503).json({ error: 'Claim submission is disabled until a real signature service and Groth16 prover/verifier are configured' }));

app.post('/api/claims/:id/settle', allowRoles('Insurer'), (_req: Request, res: Response) => res.status(503).json({ error: 'Settlement is disabled until a real insurer payout adapter is configured' }));

app.post('/api/claims/:id/reject', allowRoles('Insurer'), (_req: Request, res: Response) => res.status(503).json({ error: 'Claim decisions are disabled until an insurer authorization workflow is configured' }));

// 6. Hospital Registry (Depth-16 Merkle Tree)
// -------------------------------------------------------------
app.get('/api/hospitals', allowRoles('Hospital', 'Admin'), (_req: Request, res: Response) => {
  const hospitals = db.prepare('SELECT id,name,nabhRegistration,city,status,walletAddress,merkleLeafIndex,bondedCollateralInr FROM hospitals ORDER BY merkleLeafIndex ASC').all().map((hospital: any) => ({
    ...hospital,
    status: hospital.status === 'Verified' ? 'Locally Verified' : hospital.status,
    walletAddress: /^0x[a-fA-F0-9]{40}$/.test(hospital.walletAddress) ? hospital.walletAddress : ''
  }));
  res.json(hospitals);
});

app.post('/api/hospitals', allowRoles('Admin'), (req: Request, res: Response) => {
  const { name, nabhRegistration, city, walletAddress } = req.body;
  if (typeof name !== 'string' || !name.trim() || name.length > 200 || typeof nabhRegistration !== 'string' || !nabhRegistration.trim() || nabhRegistration.length > 100 || typeof city !== 'string' || !city.trim() || city.length > 120 || (walletAddress !== undefined && (typeof walletAddress !== 'string' || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)))) return res.status(400).json({ error: 'Invalid hospital registration details' });
  const countRow = db.prepare('SELECT COUNT(*) as count FROM hospitals').get() as { count: number };
  const id = `HSP-${700 + countRow.count}`;
  const eddsaKey = `0x${crypto.randomBytes(32).toString('hex')}`;

  db.prepare(`
    INSERT INTO hospitals (id, name, nabhRegistration, city, status, walletAddress, eddsaPublicKey, merkleLeafIndex, bondedCollateralInr)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, name.trim(), nabhRegistration.trim(), city.trim(), 'Pending Approval', walletAddress || '', eddsaKey, countRow.count, 500000);

  hospitalMerkleTree.insert(countRow.count, eddsaKey);

  res.status(201).json({ id, status: 'Pending Approval' });
});

app.post('/api/hospitals/:id/approve', allowRoles('Admin'), (req: Request, res: Response) => {
  db.prepare("UPDATE hospitals SET status = 'Verified' WHERE id = ?").run(req.params.id);

  appendAuditLog({
    actorRole: 'Admin',
    actorName: 'ArogyaZK Network Governance',
    action: `Marked hospital ${req.params.id} as locally verified`,
    targetResource: req.params.id,
    txHash: '',
    privacyImpact: 'Consent Updated'
  });

  res.json({ message: 'Hospital marked verified in the local registry; no chain enrollment was performed', id: req.params.id, status: 'Locally Verified' });
});

// -------------------------------------------------------------
// 7. Emergency Break-Glass (2-of-3 Shamir Secret Sharing)
// -------------------------------------------------------------
app.get('/api/break-glass', allowRoles('Hospital'), (req: Request, res: Response) => {
  const sessions = db.prepare('SELECT * FROM break_glass_sessions WHERE hospitalId=? ORDER BY createdAt DESC').all(req.authUser?.linkedId);
  res.json(sessions);
});

app.post('/api/break-glass/request', allowRoles('Hospital'), (_req: Request, res: Response) => res.status(503).json({ error: 'Emergency access is disabled until guardian signatures and secret reconstruction are implemented' }));

app.post('/api/break-glass/:id/sign', allowRoles('Hospital'), (_req: Request, res: Response) => res.status(503).json({ error: 'Guardian signing is disabled until cryptographic share verification is configured' }));

// 8. Smart Contracts Telemetry & Blockchain Subnet
// -------------------------------------------------------------
app.get('/api/contracts', allowRoles('Admin'), (_req: Request, res: Response) => {
  const rows = db.prepare('SELECT * FROM smart_contracts ORDER BY blockNumber ASC').all();
  res.json(rows);
});

app.get('/api/audit-logs', allowRoles('Patient', 'Hospital', 'Insurer', 'Admin'), (req: Request, res: Response) => {
  const { role, impact } = req.query;
  const roles = ['Patient', 'Hospital', 'Insurer', 'Smart Contract', 'Admin', 'All'];
  const impacts = ['Zero PHI Exposed', 'Encrypted Vault Write', 'Consent Updated', 'All'];
  if ((role !== undefined && (typeof role !== 'string' || !roles.includes(role))) || (impact !== undefined && (typeof impact !== 'string' || !impacts.includes(impact)))) return res.status(400).json({ error: 'Invalid audit filters' });
  let query = 'SELECT * FROM audit_logs WHERE 1=1';
  const params: any[] = [];

  if (role && role !== 'All') {
    query += ' AND actorRole = ?';
    params.push(role);
  }

  if (impact && impact !== 'All') {
    query += ' AND privacyImpact = ?';
    params.push(impact);
  }

  query += ' ORDER BY createdAt DESC';
  const logs = db.prepare(query).all(...params);
  res.json(logs);
});

app.get('/api/blockchain/blocks', allowRoles('Admin'), (_req: Request, res: Response) => {
  const rows = db.prepare('SELECT * FROM blockchain_blocks ORDER BY number DESC').all();
  res.json(rows);
});

app.get('/api/blockchain/transactions', allowRoles('Admin'), (_req: Request, res: Response) => {
  const rows = db.prepare('SELECT * FROM blockchain_transactions ORDER BY timestamp DESC').all();
  res.json(rows);
});

// -------------------------------------------------------------
// 9. Zero-Knowledge Cryptographic Mathematics Telemetry & Proving Adapters
// -------------------------------------------------------------
app.get('/api/crypto/parameters', allowRoles('Patient', 'Hospital', 'Insurer', 'Admin'), (_req: Request, res: Response) => {
  res.json({
    curve: 'BN254 / alt_bn128 (pairing precompile 0x08)',
    fieldPrime: Field.toHex(FIELD_PRIME),
    subgroupOrder: Field.toHex(SUBGROUP_ORDER),
    babyJubjub: {
      a: BJJ_A.toString(),
      d: BJJ_D.toString(),
      generatorG: { x: Field.toHex(BJJ_G.x), y: Field.toHex(BJJ_G.y) },
      blindingH: { x: Field.toHex(BJJ_H.x), y: Field.toHex(BJJ_H.y) }
    },
    poseidon: {
      t3: { width: 3, fullRounds: 8, partialRounds: 57, sbox: 'x^5 mod p' },
      t5: { width: 5, fullRounds: 8, partialRounds: 60, sbox: 'x^5 mod p' }
    },
    hospitalMerkleAccumulator: {
      depth: 16,
      root: hospitalMerkleTree.getRoot(),
      totalLeavesSupported: 65536
    }
  });
});

app.post('/api/crypto/verify-snark', allowRoles('Patient', 'Hospital', 'Insurer', 'Admin'), (req: Request, res: Response) => {
  const { proofPoints, publicSignals } = req.body || {};
  if (!proofPoints || !publicSignals || !Array.isArray(publicSignals)) {
    return res.status(400).json({ error: 'Valid proofPoints (a, b, c) and publicSignals array are required' });
  }

  const consumedRows = db.prepare('SELECT nullifierHash FROM insurance_claims').all() as Array<{ nullifierHash: string }>;
  const consumedSet = new Set(consumedRows.map((r) => r.nullifierHash));

  const result = Groth16MathEngine.verifyClaimProof(proofPoints, publicSignals, consumedSet);
  res.json(result);
});

app.post('/api/crypto/merkle-proof', allowRoles('Patient', 'Hospital', 'Insurer', 'Admin'), (req: Request, res: Response) => {
  const { leafIndex } = req.body || {};
  if (typeof leafIndex !== 'number' || leafIndex < 0 || leafIndex >= 65536) {
    return res.status(400).json({ error: 'leafIndex must be a non-negative integer < 65536' });
  }
  const proof = hospitalMerkleTree.generateProof(leafIndex);
  res.json(proof);
});

app.post('/api/crypto/shamir/reconstruct', allowRoles('Hospital', 'Admin'), (req: Request, res: Response) => {
  const { shares } = req.body || {};
  if (!Array.isArray(shares) || shares.length < 2) {
    return res.status(400).json({ error: 'At least 2 shares are required for 2-of-3 Lagrange reconstruction' });
  }
  try {
    const reconstructedSecret = ShamirSecretSharing.reconstruct(shares);
    res.json({ success: true, secretHex: reconstructedSecret });
  } catch (err: any) {
    res.status(422).json({ error: err.message || 'Failed to reconstruct secret from provided shares' });
  }
});

app.use((error: any, _req: Request, res: Response, _next: (error?: unknown) => void) => {
  const status = typeof error?.status === 'number' && error.status >= 400 && error.status < 500 ? error.status : 500;
  res.status(status).json({ error: status === 413 ? 'Request body is too large' : status === 400 ? 'Invalid request body' : 'Internal server error' });
});

// Serve the built frontend when running the API server outside Vite.
const frontendDistPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist');
const frontendIndexPath = path.join(frontendDistPath, 'index.html');

if (existsSync(frontendIndexPath)) {
  app.use(express.static(frontendDistPath));
  app.get('/{*path}', (req: Request, res: Response, next) => {
    if (req.path === '/api' || req.path.startsWith('/api/')) {
      return next();
    }

    res.sendFile(frontendIndexPath, (error) => {
      if (error) next(error);
    });
  });
}

// -------------------------------------------------------------
// Start Express Server
// -------------------------------------------------------------
if (process.env.NODE_ENV !== 'test') {
  app.listen(Number(PORT), HOST, () => {
    console.log(`[ArogyaZK Backend] Express server running at http://${HOST}:${PORT}`);
    console.log(`[ArogyaZK Backend] Database connected; cryptographic claim integrations are disabled until configured`);
  });
}

export { app };
