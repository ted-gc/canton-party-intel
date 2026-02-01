# Canton Network Explorer Research

## CantonNodes API (Primary Data Source)

**Base URL:** `https://api.cantonnodes.com`
**Documentation:** `https://api.cantonnodes.com/docs` (JS-rendered, use browser)

### Working Endpoints

#### Validator Licenses
```
GET /v0/admin/validator/licenses
```

Returns all validators (~800) in a single request with full details:
- `payload.validator` - Full party ID (e.g., `Five-North-1::1220...`)
- `payload.sponsor` - Sponsor party ID (Super Validator)
- `payload.lastActiveAt` - ISO timestamp of last activity
- `payload.metadata.version` - Software version
- `payload.metadata.contactPoint` - Contact info
- `payload.faucetState.firstReceivedFor.number` - First round participated
- `payload.faucetState.lastReceivedFor.number` - Latest round
- `payload.faucetState.numCouponsMissed` - Missed coupon count
- `contract_id` - Daml contract ID
- `created_at` - License creation timestamp

#### Participant ID Lookup
```
GET /v0/domains/{domainId}/parties/{partyId}/participant-id
```

Domain ID for global domain:
```
global-domain::1220b1431ef217342db44d516bb9befde802be7d8899637d290895fa58880f19accc
```

### Network Stats (as of Feb 1, 2026)

- **Total Validators:** 799
- **Super Validators (Sponsors):** 16
- **Active Today:** 718
- **With Contact Info:** 523
- **Latest Round:** 81,622

### Top Super Validators by Validator Count

1. Digital-Asset-2: 397 validators
2. Global-Synchronizer-Foundation: 170 validators
3. MPC-Holding-Inc: 55 validators
4. Proof-Group-1: 49 validators
5. Five-North-1: 47 validators
6. Cumberland-1: 16 validators
7. Cumberland-2: 14 validators
8. Digital-Asset-1: 13 validators
9. C7-Technology-Services-Limited: 12 validators
10. SV-Nodeops-Limited: 7 validators

### Version Distribution

| Version | Count | Percentage |
|---------|-------|------------|
| 0.5.5   | 404   | 50.6%      |
| 0.5.4   | 310   | 38.8%      |
| 0.5.1   | 7     | 0.9%       |
| 0.3.21  | 7     | 0.9%       |

## Other Canton Explorers

| Explorer | URL | API | Notes |
|----------|-----|-----|-------|
| CCView.io | ccview.io | No public API | Party URL: `/governance/{partyId}/` |
| CantonScan | cantonscan.com | No public API | Party URL: `/party/{partyId}` |
| 5N Lighthouse | lighthouse.cantonloop.com | Unknown | Party URL: `/party/{partyId}` |
| CC Explorer | ccexplorer.io | Unknown | Party URL: `/party/{partyId}` |
| The Tie | canton.thetie.io | Unknown | Party URL: `/party/{partyId}` |

## Key Canton Concepts

### Party ID Structure
```
{namespace}::{fingerprint}
```
- **Namespace:** Human-readable identifier (e.g., `Five-North-1`, `DSO`)
- **Fingerprint:** 64-char hex hash of public key (`1220` prefix = Ed25519)

### DSO (Decentralized Synchronizer Operator)
Special party that governs the network:
```
DSO::1220b1431ef217342db44d516bb9befde802be7d8899637d290895fa58880f19accc
```

### Super Validators vs Validators
- **Super Validators:** Sponsors that can onboard validators (16 total)
- **Validators:** Individual nodes that validate transactions (~800 total)
- A Super Validator is also a validator (sponsors itself)

## API Usage Notes

1. No authentication required for CantonNodes API
2. Single request returns all validators (no pagination needed in practice)
3. Cache for 5 minutes to avoid excessive API calls
4. `lastActiveAt` within 24h indicates active validator
