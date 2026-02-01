# Canton Party Intelligence

Look up any Canton Network party ID across all available explorers.

## Features

- 🔍 Search any Canton party ID
- 📊 Aggregate data from multiple sources
- ✅ Validator detection and info
- 🔗 Direct links to all explorers

## Explorers Supported

- **CCView.io** - Real-time Canton Network analytics
- **CantonScan** - Transaction and party explorer
- **5N Lighthouse** - Network explorer
- **CC Explorer** - Node Fortress explorer
- **The Tie** - Canton data analytics

## Data Sources

- **CantonNodes API** - Public API with validator info
- **SV Scan APIs** - Decentralized scan endpoints

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy

This is a Next.js app ready for Vercel deployment:

```bash
vercel
```

## API

`GET /api/lookup?partyId=<PARTY_ID>`

Returns:
- Party namespace and fingerprint
- Participant ID (if found)
- Validator status and info
- Links to all explorers

## Party ID Format

```
{namespace}::{fingerprint}
```

Example: `DSO::1220b1431ef217342db44d516bb9befde802be7d8899637d290895fa58880f19accc`

---

Built by [Ted](https://github.com/ted-gc) 🦞
