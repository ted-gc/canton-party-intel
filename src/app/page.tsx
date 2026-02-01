'use client';

import { useState, useEffect } from 'react';

interface NetworkStats {
  totalValidators: number;
  totalSponsors: number;
  activeToday: number;
  withContact: number;
  latestRound: number;
  sponsorStats: { sponsor: string; sponsorName: string; validatorCount: number }[];
  versionStats: { version: string; count: number }[];
  lastUpdated: string;
}

interface SearchResult {
  validator: string;
  validatorName: string;
  sponsor: string;
  sponsorName: string;
  lastActiveAt: string;
  version?: string;
}

interface ValidatorInfo {
  sponsor: string;
  sponsorName: string;
  lastActiveAt: string;
  metadata?: { version?: string; contactPoint?: string };
  faucetState?: { 
    firstReceivedFor?: { number: string };
    lastReceivedFor?: { number: string };
    numCouponsMissed?: string;
  };
}

interface SponsorInfo {
  validatorCount: number;
  validators: { validator: string; validatorName: string; lastActiveAt: string; version?: string }[];
}

interface SiblingValidators {
  sponsor: string;
  sponsorName: string;
  totalCount: number;
  others: { validator: string; validatorName: string }[];
}

interface ExplorerResult {
  name: string;
  status: string;
  url: string;
}

interface PartyResult {
  type: 'party' | 'search_results' | 'not_found';
  partyId?: string;
  namespace?: string;
  fingerprint?: string;
  participantId?: string;
  isValidator?: boolean;
  validatorInfo?: ValidatorInfo;
  isSponsor?: boolean;
  sponsorInfo?: SponsorInfo;
  siblingValidators?: SiblingValidators;
  explorers?: ExplorerResult[];
  // Search results
  query?: string;
  count?: number;
  results?: SearchResult[];
  message?: string;
}

export default function Home() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [result, setResult] = useState<PartyResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch network stats on load
  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => {
        if (!data.error) setStats(data);
      })
      .catch(() => {});
  }, []);

  const lookupParty = async (searchQuery?: string) => {
    const q = searchQuery || query;
    if (!q.trim()) return;
    
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`/api/lookup?q=${encodeURIComponent(q.trim())}`);
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
      }
    } catch {
      setError('Failed to fetch party information');
    }
    
    setLoading(false);
  };

  const selectResult = (partyId: string) => {
    setQuery(partyId);
    lookupParty(partyId);
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return dateStr;
    }
  };

  const isActiveRecently = (dateStr: string) => {
    try {
      const diff = Date.now() - new Date(dateStr).getTime();
      return diff < 24 * 60 * 60 * 1000; // 24 hours
    } catch {
      return false;
    }
  };

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Canton Party Intelligence
          </h1>
          <p className="text-gray-400 text-sm md:text-base">
            Search validators, sponsors, and party IDs across the Canton Network
          </p>
        </div>

        {/* Network Stats */}
        {stats && (
          <div className="bg-gray-900/50 rounded-xl p-4 md:p-6 mb-6 border border-gray-800">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <StatCard label="Validators" value={stats.totalValidators} />
              <StatCard label="Super Validators" value={stats.totalSponsors} />
              <StatCard label="Active Today" value={stats.activeToday} color="green" />
              <StatCard label="With Contact" value={stats.withContact} />
              <StatCard label="Latest Round" value={stats.latestRound.toLocaleString()} />
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Top Sponsors */}
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-3">Top Super Validators</h3>
                <div className="space-y-2">
                  {stats.sponsorStats.slice(0, 8).map((s, i) => (
                    <button
                      key={s.sponsor}
                      onClick={() => selectResult(s.sponsor)}
                      className="w-full flex items-center justify-between p-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg text-sm transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-gray-500 w-4">{i + 1}</span>
                        <span className="text-blue-400 truncate">{s.sponsorName}</span>
                      </span>
                      <span className="text-gray-400">{s.validatorCount} validators</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Version Distribution */}
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-3">Software Versions</h3>
                <div className="space-y-2">
                  {stats.versionStats.slice(0, 8).map(v => (
                    <div key={v.version} className="flex items-center gap-3">
                      <span className="text-xs font-mono text-gray-300 w-16">{v.version}</span>
                      <div className="flex-1 h-6 bg-gray-800 rounded overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center px-2"
                          style={{ width: `${(v.count / stats.totalValidators) * 100}%` }}
                        >
                          <span className="text-xs text-white/80">{v.count}</span>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 w-12 text-right">
                        {((v.count / stats.totalValidators) * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search Box */}
        <div className="bg-gray-900 rounded-xl p-4 md:p-6 mb-6 border border-gray-800">
          <div className="flex gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && lookupParty()}
              placeholder="Search by name, party ID, or fingerprint..."
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 font-mono text-sm"
            />
            <button
              onClick={() => lookupParty()}
              disabled={loading || !query.trim()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors whitespace-nowrap"
            >
              {loading ? '...' : 'Search'}
            </button>
          </div>
          
          {/* Quick Examples */}
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="text-gray-500">Try:</span>
            {['Digital-Asset', 'Cumberland', 'Five-North', 'DSO'].map(example => (
              <button
                key={example}
                onClick={() => { setQuery(example); lookupParty(example); }}
                className="text-blue-400 hover:text-blue-300 hover:underline"
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 mb-6 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-4">
            {/* Search Results List */}
            {result.type === 'search_results' && result.results && (
              <div className="bg-gray-900 rounded-xl p-4 md:p-6 border border-gray-800">
                <h2 className="text-lg font-semibold mb-4">
                  Found {result.count} matches for "{result.query}"
                </h2>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {result.results.map((r, i) => (
                    <button
                      key={i}
                      onClick={() => selectResult(r.validator)}
                      className="w-full text-left p-3 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-blue-400 font-mono text-sm">{r.validatorName}</span>
                        <span className={`text-xs ${isActiveRecently(r.lastActiveAt) ? 'text-green-400' : 'text-gray-500'}`}>
                          {isActiveRecently(r.lastActiveAt) ? '● Active' : '○ Inactive'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span>Sponsor: {r.sponsorName}</span>
                        {r.version && <span>v{r.version}</span>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Not Found */}
            {result.type === 'not_found' && (
              <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 text-center">
                <div className="text-4xl mb-4">🔍</div>
                <p className="text-gray-400">{result.message}</p>
              </div>
            )}

            {/* Party Details */}
            {result.type === 'party' && (
              <>
                {/* Party Overview */}
                <div className="bg-gray-900 rounded-xl p-4 md:p-6 border border-gray-800">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-semibold text-white mb-1">{result.namespace}</h2>
                      <div className="flex gap-2">
                        {result.isValidator && (
                          <span className="px-2 py-0.5 bg-blue-900/50 text-blue-400 text-xs rounded">Validator</span>
                        )}
                        {result.isSponsor && (
                          <span className="px-2 py-0.5 bg-purple-900/50 text-purple-400 text-xs rounded">Super Validator</span>
                        )}
                        {result.namespace === 'DSO' && (
                          <span className="px-2 py-0.5 bg-yellow-900/50 text-yellow-400 text-xs rounded">DSO</span>
                        )}
                      </div>
                    </div>
                    {result.validatorInfo && (
                      <div className={`px-3 py-1 rounded-full text-xs ${
                        isActiveRecently(result.validatorInfo.lastActiveAt) 
                          ? 'bg-green-900/50 text-green-400' 
                          : 'bg-gray-800 text-gray-400'
                      }`}>
                        {isActiveRecently(result.validatorInfo.lastActiveAt) ? '● Active' : '○ Inactive'}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-gray-500">Party ID:</span>
                      <code className="ml-2 text-gray-300 text-xs break-all bg-gray-800 px-2 py-0.5 rounded">
                        {result.partyId}
                      </code>
                    </div>
                    {result.participantId && (
                      <div>
                        <span className="text-gray-500">Participant ID:</span>
                        <code className="ml-2 text-gray-300 text-xs break-all bg-gray-800 px-2 py-0.5 rounded">
                          {result.participantId}
                        </code>
                      </div>
                    )}
                  </div>
                </div>

                {/* Validator Info */}
                {result.validatorInfo && (
                  <div className="bg-gray-900 rounded-xl p-4 md:p-6 border border-gray-800">
                    <h3 className="text-sm font-semibold text-gray-400 mb-4">Validator Details</h3>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Sponsor:</span>
                        <button
                          onClick={() => result.validatorInfo?.sponsor && selectResult(result.validatorInfo.sponsor)}
                          className="ml-2 text-blue-400 hover:underline"
                        >
                          {result.validatorInfo.sponsorName}
                        </button>
                      </div>
                      <div>
                        <span className="text-gray-500">Last Active:</span>
                        <span className="ml-2 text-gray-300">{formatDate(result.validatorInfo.lastActiveAt)}</span>
                      </div>
                      {result.validatorInfo.metadata?.version && (
                        <div>
                          <span className="text-gray-500">Version:</span>
                          <span className="ml-2 text-gray-300">{result.validatorInfo.metadata.version}</span>
                        </div>
                      )}
                      {result.validatorInfo.metadata?.contactPoint && (
                        <div>
                          <span className="text-gray-500">Contact:</span>
                          <span className="ml-2 text-gray-300">{result.validatorInfo.metadata.contactPoint}</span>
                        </div>
                      )}
                      {result.validatorInfo.faucetState && (
                        <>
                          <div>
                            <span className="text-gray-500">First Round:</span>
                            <span className="ml-2 text-gray-300">
                              {result.validatorInfo.faucetState.firstReceivedFor?.number || 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Coupons Missed:</span>
                            <span className="ml-2 text-gray-300">
                              {result.validatorInfo.faucetState.numCouponsMissed || '0'}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Sponsor Info (if this party sponsors validators) */}
                {result.sponsorInfo && (
                  <div className="bg-gray-900 rounded-xl p-4 md:p-6 border border-gray-800">
                    <h3 className="text-sm font-semibold text-gray-400 mb-4">
                      Sponsored Validators ({result.sponsorInfo.validatorCount})
                    </h3>
                    <div className="grid md:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                      {result.sponsorInfo.validators.map((v, i) => (
                        <button
                          key={i}
                          onClick={() => selectResult(v.validator)}
                          className="text-left p-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-blue-400 text-sm truncate">{v.validatorName}</span>
                            <span className={`text-xs ${isActiveRecently(v.lastActiveAt) ? 'text-green-400' : 'text-gray-500'}`}>
                              {v.version && `v${v.version}`}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                    {result.sponsorInfo.validatorCount > 20 && (
                      <p className="text-xs text-gray-500 mt-2">
                        Showing 20 of {result.sponsorInfo.validatorCount} validators
                      </p>
                    )}
                  </div>
                )}

                {/* Sibling Validators */}
                {result.siblingValidators && result.siblingValidators.others.length > 0 && (
                  <div className="bg-gray-900 rounded-xl p-4 md:p-6 border border-gray-800">
                    <h3 className="text-sm font-semibold text-gray-400 mb-4">
                      Other validators from {result.siblingValidators.sponsorName} ({result.siblingValidators.totalCount - 1} others)
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {result.siblingValidators.others.map((v, i) => (
                        <button
                          key={i}
                          onClick={() => selectResult(v.validator)}
                          className="px-3 py-1.5 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg text-sm text-blue-400 transition-colors"
                        >
                          {v.validatorName}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Explorer Links */}
                {result.explorers && (
                  <div className="bg-gray-900 rounded-xl p-4 md:p-6 border border-gray-800">
                    <h3 className="text-sm font-semibold text-gray-400 mb-4">View on Explorers</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                      {result.explorers.map((explorer) => (
                        <a
                          key={explorer.name}
                          href={explorer.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
                        >
                          <span>{explorer.name}</span>
                          <span className="text-gray-500">↗</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-gray-600 text-xs">
          <p>Data from CantonNodes API • Updated every 5 minutes</p>
          <p className="mt-1">
            <a href="https://github.com/ted-gc/canton-party-intel" className="hover:text-gray-400">GitHub</a>
            {' • '}
            Built by Ted 🦞
          </p>
        </div>
      </div>
    </main>
  );
}

function StatCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="text-center p-3 bg-gray-800/50 rounded-lg">
      <div className={`text-2xl font-bold ${color === 'green' ? 'text-green-400' : 'text-white'}`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}
