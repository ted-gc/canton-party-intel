import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 30; // Allow up to 30s for serverless

const CANTON_NODES_API = 'https://api.cantonnodes.com';
const DOMAIN_ID = 'global-domain::1220b1431ef217342db44d516bb9befde802be7d8899637d290895fa58880f19accc';

interface ValidatorLicense {
  payload: {
    validator: string;
    sponsor: string;
    lastActiveAt: string;
    dso: string;
    metadata?: {
      version?: string;
      contactPoint?: string;
      lastUpdatedAt?: string;
    };
    faucetState?: {
      firstReceivedFor?: { number: string };
      lastReceivedFor?: { number: string };
      numCouponsMissed?: string;
    };
  };
  contract_id: string;
  created_at: string;
}

interface ExplorerResult {
  name: string;
  status: 'success' | 'error' | 'not_found';
  url: string;
}

// Cache validators for 5 minutes
let validatorCache: {
  data: ValidatorLicense[];
  timestamp: number;
} | null = null;

async function getValidators(): Promise<ValidatorLicense[]> {
  const now = Date.now();
  if (validatorCache && now - validatorCache.timestamp < 5 * 60 * 1000) {
    return validatorCache.data;
  }

  const res = await fetch(`${CANTON_NODES_API}/v0/admin/validator/licenses`, {
    headers: { 'Accept': 'application/json' },
  });
  
  if (!res.ok) throw new Error(`API returned ${res.status}`);

  const data = await res.json();
  const allValidators: ValidatorLicense[] = data.validator_licenses || [];

  validatorCache = { data: allValidators, timestamp: now };
  return allValidators;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('partyId') || searchParams.get('q') || '';

  if (!query) {
    return NextResponse.json({ error: 'Party ID or search query is required' }, { status: 400 });
  }

  try {
    const validators = await getValidators();
    const queryLower = query.toLowerCase();

    // Try exact match first
    let exactMatch = validators.find(v => 
      v.payload?.validator === query || v.payload?.sponsor === query
    );

    // Search by partial name or fingerprint
    let matches: ValidatorLicense[] = [];
    if (!exactMatch) {
      matches = validators.filter(v => {
        const validator = v.payload?.validator?.toLowerCase() || '';
        const sponsor = v.payload?.sponsor?.toLowerCase() || '';
        return validator.includes(queryLower) || sponsor.includes(queryLower);
      });

      // If single match, treat as exact
      if (matches.length === 1) {
        exactMatch = matches[0];
        matches = [];
      }
    }

    // If multiple matches, return search results
    if (matches.length > 1) {
      const results = matches.slice(0, 50).map(v => ({
        validator: v.payload?.validator,
        validatorName: v.payload?.validator?.split('::')[0],
        sponsor: v.payload?.sponsor,
        sponsorName: v.payload?.sponsor?.split('::')[0],
        lastActiveAt: v.payload?.lastActiveAt,
        version: v.payload?.metadata?.version
      }));

      return NextResponse.json({
        type: 'search_results',
        query,
        count: matches.length,
        results
      });
    }

    // No matches found
    if (!exactMatch) {
      // Try participant ID lookup as fallback
      let participantId: string | undefined;
      try {
        const participantRes = await fetch(
          `${CANTON_NODES_API}/v0/domains/${DOMAIN_ID}/parties/${encodeURIComponent(query)}/participant-id`
        );
        if (participantRes.ok) {
          const data = await participantRes.json();
          participantId = data.participant_id;
        }
      } catch {
        // Ignore
      }

      if (participantId) {
        return NextResponse.json({
          type: 'party',
          partyId: query,
          namespace: query.split('::')[0] || 'unknown',
          fingerprint: query.split('::')[1] || query,
          participantId,
          isValidator: false,
          isSponsor: false,
          explorers: generateExplorerLinks(query)
        });
      }

      return NextResponse.json({
        type: 'not_found',
        query,
        message: 'No validator or party found matching this query'
      });
    }

    // Build detailed response for exact match
    const partyId = exactMatch.payload?.validator || query;
    const parts = partyId.split('::');
    const namespace = parts[0] || 'unknown';
    const fingerprint = parts[1] || partyId;

    // Check if this party is also a sponsor
    const sponsoredValidators = validators.filter(v => v.payload?.sponsor === partyId);
    const isSponsor = sponsoredValidators.length > 0;

    // Get sponsor info
    const sponsorId = exactMatch.payload?.sponsor;
    const allSponsoredBySameSponsor = validators.filter(v => v.payload?.sponsor === sponsorId);

    // Try to get participant ID
    let participantId: string | undefined;
    try {
      const participantRes = await fetch(
        `${CANTON_NODES_API}/v0/domains/${DOMAIN_ID}/parties/${encodeURIComponent(partyId)}/participant-id`
      );
      if (participantRes.ok) {
        const data = await participantRes.json();
        participantId = data.participant_id;
      }
    } catch {
      // Ignore
    }

    return NextResponse.json({
      type: 'party',
      partyId,
      namespace,
      fingerprint,
      participantId,
      isValidator: true,
      validatorInfo: {
        sponsor: exactMatch.payload?.sponsor,
        sponsorName: exactMatch.payload?.sponsor?.split('::')[0],
        lastActiveAt: exactMatch.payload?.lastActiveAt,
        metadata: exactMatch.payload?.metadata,
        faucetState: exactMatch.payload?.faucetState,
        contractId: exactMatch.contract_id,
        createdAt: exactMatch.created_at
      },
      isSponsor,
      sponsorInfo: isSponsor ? {
        validatorCount: sponsoredValidators.length,
        validators: sponsoredValidators.slice(0, 20).map(v => ({
          validator: v.payload?.validator,
          validatorName: v.payload?.validator?.split('::')[0],
          lastActiveAt: v.payload?.lastActiveAt,
          version: v.payload?.metadata?.version
        }))
      } : undefined,
      siblingValidators: {
        sponsor: sponsorId,
        sponsorName: sponsorId?.split('::')[0],
        totalCount: allSponsoredBySameSponsor.length,
        others: allSponsoredBySameSponsor
          .filter(v => v.payload?.validator !== partyId)
          .slice(0, 10)
          .map(v => ({
            validator: v.payload?.validator,
            validatorName: v.payload?.validator?.split('::')[0]
          }))
      },
      explorers: generateExplorerLinks(partyId)
    });

  } catch (error) {
    console.error('Lookup error:', error);
    return NextResponse.json(
      { error: 'Failed to lookup party information' },
      { status: 500 }
    );
  }
}

function generateExplorerLinks(partyId: string): ExplorerResult[] {
  const encoded = encodeURIComponent(partyId);
  return [
    {
      name: 'CCView.io',
      status: 'success',
      url: `https://ccview.io/governance/${encoded}/`
    },
    {
      name: 'CantonScan',
      status: 'success',
      url: `https://www.cantonscan.com/party/${encoded}`
    },
    {
      name: '5N Lighthouse',
      status: 'success',
      url: `https://lighthouse.cantonloop.com/party/${encoded}`
    },
    {
      name: 'CC Explorer',
      status: 'success',
      url: `https://ccexplorer.io/party/${encoded}`
    },
    {
      name: 'The Tie',
      status: 'success',
      url: `https://canton.thetie.io/party/${encoded}`
    }
  ];
}
