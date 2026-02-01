import { NextResponse } from 'next/server';

const CANTON_NODES_API = 'https://api.cantonnodes.com';

interface ValidatorLicense {
  payload: {
    validator: string;
    sponsor: string;
    lastActiveAt: string;
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
  created_at: string;
}

interface SponsorStats {
  sponsor: string;
  sponsorName: string;
  validatorCount: number;
}

interface VersionStats {
  version: string;
  count: number;
}

export const maxDuration = 30; // Allow up to 30s for serverless

export async function GET() {
  try {
    // Fetch all validators (single request - API returns all at once)
    const res = await fetch(`${CANTON_NODES_API}/v0/admin/validator/licenses`, {
      headers: { 'Accept': 'application/json' },
    });
    
    if (!res.ok) {
      throw new Error(`API returned ${res.status}`);
    }
    
    const data = await res.json();
    const allValidators: ValidatorLicense[] = data.validator_licenses || [];

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    // Calculate stats
    const totalValidators = allValidators.length;
    
    // Unique sponsors
    const sponsorMap = new Map<string, number>();
    allValidators.forEach(v => {
      const sponsor = v.payload?.sponsor;
      if (sponsor) {
        sponsorMap.set(sponsor, (sponsorMap.get(sponsor) || 0) + 1);
      }
    });
    const totalSponsors = sponsorMap.size;
    
    // Sponsor stats sorted by validator count
    const sponsorStats: SponsorStats[] = Array.from(sponsorMap.entries())
      .map(([sponsor, count]) => ({
        sponsor,
        sponsorName: sponsor.split('::')[0],
        validatorCount: count
      }))
      .sort((a, b) => b.validatorCount - a.validatorCount);

    // Version distribution
    const versionMap = new Map<string, number>();
    allValidators.forEach(v => {
      const version = v.payload?.metadata?.version || 'unknown';
      versionMap.set(version, (versionMap.get(version) || 0) + 1);
    });
    const versionStats: VersionStats[] = Array.from(versionMap.entries())
      .map(([version, count]) => ({ version, count }))
      .sort((a, b) => b.count - a.count);

    // Active today
    const activeToday = allValidators.filter(v => 
      v.payload?.lastActiveAt && v.payload.lastActiveAt >= todayStart
    ).length;

    // With contact info
    const withContact = allValidators.filter(v => 
      v.payload?.metadata?.contactPoint && v.payload.metadata.contactPoint.trim() !== ''
    ).length;

    // Latest round (from faucetState)
    let latestRound = 0;
    allValidators.forEach(v => {
      const round = parseInt(v.payload?.faucetState?.lastReceivedFor?.number || '0', 10);
      if (round > latestRound) latestRound = round;
    });

    return NextResponse.json({
      totalValidators,
      totalSponsors,
      activeToday,
      withContact,
      latestRound,
      sponsorStats: sponsorStats.slice(0, 20),
      versionStats: versionStats.slice(0, 10),
      lastUpdated: now.toISOString()
    });

  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch network stats' },
      { status: 500 }
    );
  }
}
