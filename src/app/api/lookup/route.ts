import { NextRequest, NextResponse } from 'next/server';

const CANTON_NODES_API = 'https://api.cantonnodes.com';
const DOMAIN_ID = 'global-domain::1220b1431ef217342db44d516bb9befde802be7d8899637d290895fa58880f19accc';

interface ExplorerResult {
  name: string;
  status: 'loading' | 'success' | 'error' | 'not_found';
  data?: Record<string, unknown>;
  error?: string;
  url?: string;
}

interface ValidatorLicense {
  payload: {
    validator: string;
    sponsor: string;
    lastActiveAt: string;
    metadata?: {
      version?: string;
      contactPoint?: string;
    };
    faucetState?: {
      firstReceivedFor?: { number: string };
      lastReceivedFor?: { number: string };
      numCouponsMissed?: string;
    };
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const partyId = searchParams.get('partyId');

  if (!partyId) {
    return NextResponse.json({ error: 'Party ID is required' }, { status: 400 });
  }

  const results: ExplorerResult[] = [];
  let participantId: string | undefined;
  let isValidator = false;
  let validatorInfo: Record<string, unknown> | undefined;

  // Parse party ID
  const parts = partyId.split('::');
  const namespace = parts.length === 2 ? parts[0] : 'unknown';
  const fingerprint = parts.length === 2 ? parts[1] : partyId;

  // Check if it's the DSO party
  const isDSO = namespace === 'DSO';

  try {
    // 1. Try to get participant ID from CantonNodes
    try {
      const participantRes = await fetch(
        `${CANTON_NODES_API}/v0/domains/${DOMAIN_ID}/parties/${encodeURIComponent(partyId)}/participant-id`,
        { next: { revalidate: 60 } }
      );
      
      if (participantRes.ok) {
        const data = await participantRes.json();
        participantId = data.participant_id;
        results.push({
          name: 'CantonNodes',
          status: 'success',
          data: { participantId },
          url: CANTON_NODES_API
        });
      } else {
        results.push({
          name: 'CantonNodes',
          status: 'not_found',
          url: CANTON_NODES_API
        });
      }
    } catch (err) {
      results.push({
        name: 'CantonNodes',
        status: 'error',
        error: 'Failed to query',
        url: CANTON_NODES_API
      });
    }

    // 2. Check if party is a validator
    try {
      const validatorsRes = await fetch(
        `${CANTON_NODES_API}/v0/admin/validator/licenses?limit=500`,
        { next: { revalidate: 300 } }
      );
      
      if (validatorsRes.ok) {
        const data = await validatorsRes.json();
        const validator = data.validator_licenses?.find(
          (v: ValidatorLicense) => v.payload?.validator === partyId
        );
        
        if (validator) {
          isValidator = true;
          validatorInfo = {
            sponsor: validator.payload.sponsor,
            lastActiveAt: validator.payload.lastActiveAt,
            metadata: validator.payload.metadata,
            faucetState: validator.payload.faucetState
          };
        }
      }
    } catch (err) {
      // Non-critical, continue
    }

    // 3. Generate explorer links
    const explorerLinks: ExplorerResult[] = [
      {
        name: 'CCView.io',
        status: 'success',
        url: `https://ccview.io/governance/${encodeURIComponent(partyId)}/`
      },
      {
        name: 'CantonScan',
        status: 'success', 
        url: `https://www.cantonscan.com/`
      },
      {
        name: '5N Lighthouse',
        status: 'success',
        url: `https://lighthouse.cantonloop.com/`
      },
      {
        name: 'CC Explorer',
        status: 'success',
        url: `https://ccexplorer.io/`
      },
      {
        name: 'The Tie',
        status: 'success',
        url: `https://canton.thetie.io/`
      }
    ];

    return NextResponse.json({
      partyId,
      namespace,
      fingerprint,
      isDSO,
      participantId,
      isValidator,
      validatorInfo,
      explorers: [...results, ...explorerLinks]
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to lookup party information' },
      { status: 500 }
    );
  }
}
