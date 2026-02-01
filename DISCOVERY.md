# Canton Party Intelligence - Deep Discovery

## Phase 1: Problem Understanding

### Core Question
When someone looks up a Canton Network party ID, what do they actually want to know?

### User Personas

1. **Validator Operator** - Checking their own status, comparing to peers
2. **Investor/Trader** - Evaluating counterparty risk, checking activity
3. **Developer** - Understanding network topology, debugging transactions
4. **Compliance/Auditor** - Verifying governance, tracking flows
5. **Curious Observer** - Just exploring the network

### What Would "Perfect" Look Like?

Enter a party ID → See everything relevant:
- Identity, role, and status
- Financial position (CC balance)
- Transaction activity and counterparties
- Rewards earned (validator/app)
- Network position and relationships

---

## Phase 2: API Discovery (COMPLETE)

### CantonNodes API - Full Endpoint Catalog

**Base URL:** `https://api.cantonnodes.com`
**OpenAPI Spec:** `https://api.cantonnodes.com/docs/openapi.yaml`
**Rate Limit:** ~10 requests per minute (be careful!)

#### Network Information
| Endpoint | Method | Params | Returns |
|----------|--------|--------|---------|
| `/v0/dso` | GET | - | DSO info, voting threshold, current round, amulet rules |
| `/v0/dso-party-id` | GET | - | DSO party ID |
| `/v0/round-of-latest-data` | GET | - | Current round number + timestamp |
| `/v0/scans` | GET | - | All SV scan endpoints |
| `/v0/dso-sequencers` | GET | - | Canton sequencer config |

#### Validator Information
| Endpoint | Method | Params | Returns |
|----------|--------|--------|---------|
| `/v0/admin/validator/licenses` | GET | after, limit | All validator licenses (799 total) |
| `/v0/validators/validator-faucets` | GET | validator_ids[] | Validator liveness stats |

#### Balance & Holdings
| Endpoint | Method | Params | Returns |
|----------|--------|--------|---------|
| `/v0/wallet-balance` | GET | party_id, asOfEndOfRound | Party's CC balance |
| `/v0/total-amulet-balance` | GET | asOfEndOfRound | Network total CC |
| `/v0/holdings/state` | GET | ? | Holdings state |
| `/v0/holdings/summary` | GET | ? | Holdings summary |

#### Transaction History
| Endpoint | Method | Params | Returns |
|----------|--------|--------|---------|
| `/v0/transactions` | POST | {page_size, sort_order, page_end_event_id} | Full transaction history |
| `/v0/activities` | ? | ? | Activity list |
| `/v1/updates` | POST | {page_size, ...} | Update history |
| `/v2/updates` | POST | {page_size, ...} | Update history v2 |
| `/v2/updates/{id}` | GET | update_id | Specific update |

#### Rounds & Rewards
| Endpoint | Method | Params | Returns |
|----------|--------|--------|---------|
| `/v0/open-and-issuing-mining-rounds` | POST | {} | Current mining rounds |
| `/v0/closed-rounds` | GET | - | Closed rounds in post-close |
| `/v0/aggregated-rounds` | ? | ? | Aggregated round data |
| `/v0/round-totals` | GET | round | Round-level totals |
| `/v0/round-party-totals` | POST | {start_round, end_round} | Per-party stats per round |
| `/v0/rewards-collected` | ? | ? | Rewards collected |
| `/v0/amulet-config-for-round` | GET | ? | Round config |

#### Leaderboards
| Endpoint | Method | Params | Returns |
|----------|--------|--------|---------|
| `/v0/top-validators-by-validator-rewards` | GET | round, limit | Top validators by rewards |
| `/v0/top-providers-by-app-rewards` | GET | round, limit | Top app providers |

#### Apps & Providers
| Endpoint | Method | Params | Returns |
|----------|--------|--------|---------|
| `/v0/featured-apps` | GET | - | All featured apps |
| `/v0/featured-apps/{provider_party_id}` | GET | provider | Provider's apps |

#### Governance
| Endpoint | Method | Params | Returns |
|----------|--------|--------|---------|
| `/v0/amulet-price/votes` | GET | ? | Price votes |

#### State
| Endpoint | Method | Params | Returns |
|----------|--------|--------|---------|
| `/v0/state/acs` | POST | {} | Active Contract Set |
| `/v0/state/acs/snapshot-timestamp` | GET | before, migration_id | Snapshot timestamp |

---

## Phase 3: Data Available Per Party

Based on API discovery, here's what we CAN get for any party:

### Always Available ✅
- **Wallet balance** - CC balance at any round (`/v0/wallet-balance`)
- **Validator status** - Is this party a validator? (`/v0/admin/validator/licenses`)
- **Validator liveness** - Rounds collected, missed, uptime (`/v0/validators/validator-faucets`)
- **Round participation** - Per-party stats (`/v0/round-party-totals`)

### Via Transaction Search ✅
- **Transaction history** - Full TX list with sender/receiver/amounts (`/v0/transactions`)
- **Counterparties** - Who they transact with (from TX history)
- **Volume** - Total sent/received (aggregated from TX)

### Network-Level Context ✅
- **Leaderboard position** - Top validators/providers by rewards
- **Network stats** - Total validators, CC supply, current round
- **Featured apps** - If party is an app provider

### Not Available ❌
- Historical balance over time (only point-in-time)
- Direct relationship/network graph (needs aggregation)
- Governance voting history (endpoint unclear)

---

## Phase 4: Tested API Examples

### Get Current Round
```bash
curl -s "https://api.cantonnodes.com/v0/round-of-latest-data"
# {"round":81618,"effectiveAt":"2026-02-01T11:53:56.38391Z"}
```

### Get Party Balance
```bash
PARTY="Digital-Asset-1::12203a616cd41a519d1950ffd4df0ced808cce3bea558d684296c007bb8e12d7f649"
curl -s "https://api.cantonnodes.com/v0/wallet-balance?party_id=$PARTY&asOfEndOfRound=81618"
# {"wallet_balance":"571.2456640965"}
```

### Get Validator Liveness
```bash
VALIDATOR="Five-North-1::1220520b6d396b91c4b13a1786bd5f317e4240001632d4a628c1c4f53a0b5165ba98"
curl -s "https://api.cantonnodes.com/v0/validators/validator-faucets?validator_ids=$VALIDATOR"
# Returns: numRoundsCollected, numRoundsMissed, first/lastCollectedInRound
```

### Get Transaction History
```bash
curl -s -X POST "https://api.cantonnodes.com/v0/transactions" \
  -H "Content-Type: application/json" \
  -d '{"page_size": 10}'
# Returns: Full transaction details with sender, receivers, amounts, fees
```

### Get Top Validators
```bash
curl -s "https://api.cantonnodes.com/v0/top-validators-by-validator-rewards?round=81618&limit=10"
# Returns: Top validators with cumulative rewards
```

---

## Phase 5: Implementation Plan

### v1 Current (DONE)
- [x] Validator list and network stats
- [x] Party search by name/ID
- [x] Basic validator info (sponsor, version, last active)
- [x] Explorer links

### v2 Next (TODO)
- [ ] **Balance lookup** - Show CC balance for any party
- [ ] **Validator liveness** - Detailed uptime, rounds collected/missed
- [ ] **Leaderboard context** - Where does this party rank?
- [ ] **Rewards earned** - Total validator/app rewards

### v3 Future (TODO)
- [ ] **Transaction history** - Recent TXs for a party
- [ ] **Counterparty analysis** - Who do they transact with most?
- [ ] **Network visualization** - Graph of relationships
- [ ] **Historical tracking** - Balance/activity over time

---

## Key Technical Notes

1. **Rate limiting** - ~10 req/min, need caching strategy
2. **Round parameter** - Many endpoints need `asOfEndOfRound` for point-in-time
3. **POST for lists** - Transaction and round-party endpoints use POST with JSON body
4. **Party ID format** - `{namespace}::1220{fingerprint}` (1220 = Ed25519)
5. **Large responses** - Validator list is 1.6MB, needs client-side caching

---

_Last updated: Feb 1, 2026_
