# ZKure

ArogyaZK is a React and Express prototype for patient records, consent, and insurance workflows. The API now requires authenticated accounts for sensitive routes. Cryptographic claim verification, insurer settlement, and emergency guardian recovery are intentionally unavailable until their real cryptographic and chain integrations are supplied.

## Local setup

Install dependencies and configure a bootstrap administrator and a 32-byte record encryption key before starting the server:

```powershell
npm install
$env:BOOTSTRAP_ADMIN_EMAIL = 'admin@example.test'
$env:BOOTSTRAP_ADMIN_PASSWORD = 'replace-with-a-long-unique-password'
$env:RECORD_ENCRYPTION_KEY = (node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))")
npm run dev
```

The API listens on `127.0.0.1:3001` by default. Set `HOST` only when you have deployed behind a trusted network boundary. Set `CORS_ORIGINS` to a comma-separated allowlist; the default development origin is `http://localhost:3000`.

The first administrator is created only when both bootstrap variables are set and no administrator already exists. Sign in through the frontend, then create linked accounts with the admin endpoint:

```http
POST /api/admin/users
Cookie: azk_session=<admin-session-cookie>
Content-Type: application/json

{"email":"patient@example.test","password":"a-long-unique-password","role":"Patient","linkedId":"PAT-9041"}
```

Roles are `Patient`, `Hospital`, `Insurer`, and `Admin`. Patient and hospital accounts must link to an existing patient or hospital ID; insurer accounts link to a registered insurer name. Sessions expire after eight hours and use HttpOnly, SameSite cookies; sign out revokes the current session. Passwords are stored as scrypt hashes, and session tokens are stored as SHA-256 digests.

## Encrypted record storage

New records use a random 32-byte data encryption key per record, AES-256-GCM, and a separate random 96-bit IV. The data key is wrapped with the active key encryption key. Configure `RECORD_KEYRING_JSON` as a JSON object mapping integer versions to 64-character hexadecimal keys, and `RECORD_ACTIVE_KEY_VERSION` to a version in that object. For example, keep the JSON secret in your deployment secret manager; do not commit it. If the keyring variables are absent, `RECORD_ENCRYPTION_KEY` is treated as version 1 for compatibility. Ciphertext, payload IV/tag, wrapped data key, wrapping IV/tag, and key version are stored separately in SQLite; ciphertext is uploaded to Kubo-compatible IPFS when `IPFS_API_URL` is set. No chain anchor is claimed.

For rotation, add a new key version to the keyring while retaining all old versions, set it as `RECORD_ACTIVE_KEY_VERSION`, restart the server, and call authenticated `POST /api/admin/records/rotate-key`. The endpoint atomically unwraps and rewraps stored data keys; the medical record ciphertext does not need to be re-uploaded. Keep encrypted backups of the SQLite database and the complete keyring in separate access-controlled locations. Restore both together and verify decryption before retiring an old key. Loss of the keyring or the SQLite metadata (including IVs, tags, CIDs, and wrapped keys) can make records unrecoverable. The local SQLite database is not itself an adequate production backup or key management system.

## Current integration limits

- This repository contains no Circom circuit, witness generator, proving key, verification key, or Solidity verifier. Claim submission is rejected until those are added and configured.
- There is no Sepolia RPC/signing configuration or payment contract. Settlement and blockchain explorer endpoints do not claim synthetic transactions as real chain activity.
- Break-glass requests and guardian signatures are rejected until real signature verification and secret reconstruction are implemented.
- Record creation still accepts free text; FHIR R4 resources are not yet validated against official schemas or ABDM profiles. Do not represent these records as ABDM-compatible.
- Request bodies use route-level checks; a shared Zod schema layer, persistent/distributed rate limiting, and tamper-evident audit log storage remain deployment work.
- The existing SQLite database may contain seeded demonstration rows. Those rows are not evidence of real encryption, proof verification, consent, or settlement.

## Commands

```powershell
npm run dev
npm run build
npm run test:security
```
