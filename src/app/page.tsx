'use client';

import { useState } from 'react';

interface ExplorerResult {
  name: string;
  status: 'loading' | 'success' | 'error' | 'not_found';
  data?: Record<string, unknown>;
  error?: string;
  url?: string;
}

interface PartyInfo {
  partyId: string;
  namespace: string;
  fingerprint: string;
  explorers: ExplorerResult[];
  participantId?: string;
  isValidator?: boolean;
  validatorInfo?: Record<string, unknown>;
}

const EXPLORERS = [
  { id: 'cantonnodes', name: 'CantonNodes', baseUrl: 'https://api.cantonnodes.com' },
  { id: 'ccview', name: 'CCView.io', baseUrl: 'https://ccview.io' },
  { id: 'cantonscan', name: 'CantonScan', baseUrl: 'https://www.cantonscan.com' },
  { id: 'lighthouse', name: '5N Lighthouse', baseUrl: 'https://lighthouse.cantonloop.com' },
  { id: 'ccexplorer', name: 'CC Explorer', baseUrl: 'https://ccexplorer.io' },
  { id: 'thetie', name: 'The Tie', baseUrl: 'https://canton.thetie.io' },
];

export default function Home() {
  const [partyId, setPartyId] = useState('');
  const [loading, setLoading] = useState(false);
  const [partyInfo, setPartyInfo] = useState<PartyInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parsePartyId = (id: string) => {
    const parts = id.split('::');
    if (parts.length === 2) {
      return { namespace: parts[0], fingerprint: parts[1] };
    }
    return { namespace: 'unknown', fingerprint: id };
  };

  const lookupParty = async () => {
    if (!partyId.trim()) return;
    
    setLoading(true);
    setError(null);
    
    const { namespace, fingerprint } = parsePartyId(partyId.trim());
    
    // Initialize results
    const results: ExplorerResult[] = EXPLORERS.map(e => ({
      name: e.name,
      status: 'loading' as const,
      url: e.id === 'ccview' ? `${e.baseUrl}/governance/${encodeURIComponent(partyId)}` :
           e.id === 'cantonscan' ? `${e.baseUrl}/party/${encodeURIComponent(partyId)}` :
           e.baseUrl
    }));
    
    setPartyInfo({
      partyId: partyId.trim(),
      namespace,
      fingerprint,
      explorers: results
    });

    // Fetch from API
    try {
      const response = await fetch(`/api/lookup?partyId=${encodeURIComponent(partyId.trim())}`);
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        setPartyInfo(prev => prev ? {
          ...prev,
          ...data,
          explorers: data.explorers || prev.explorers
        } : null);
      }
    } catch (err) {
      setError('Failed to fetch party information');
    }
    
    setLoading(false);
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Canton Party Intelligence
          </h1>
          <p className="text-gray-400">
            Look up any Canton Network party ID across all available explorers
          </p>
        </div>

        {/* Search Box */}
        <div className="bg-gray-900 rounded-xl p-6 mb-8 border border-gray-800">
          <div className="flex gap-4">
            <input
              type="text"
              value={partyId}
              onChange={(e) => setPartyId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && lookupParty()}
              placeholder="Enter Party ID (e.g., DSO::1220b1431ef217342db44d516bb9befde802be7d8899637d290895fa58880f19accc)"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 font-mono text-sm"
            />
            <button
              onClick={lookupParty}
              disabled={loading || !partyId.trim()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
            >
              {loading ? 'Searching...' : 'Lookup'}
            </button>
          </div>
          
          {/* Quick Examples */}
          <div className="mt-4 text-sm text-gray-500">
            <span className="mr-2">Examples:</span>
            <button
              onClick={() => setPartyId('DSO::1220b1431ef217342db44d516bb9befde802be7d8899637d290895fa58880f19accc')}
              className="text-blue-400 hover:underline mr-4"
            >
              DSO Party
            </button>
            <button
              onClick={() => setPartyId('Digital-Asset-2::12209b21d512c6a7e2f5d215266fe6568cb732caaef7ff04e308f990a652340d3529')}
              className="text-blue-400 hover:underline"
            >
              Digital Asset SV
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 mb-8 text-red-400">
            {error}
          </div>
        )}

        {/* Results */}
        {partyInfo && (
          <div className="space-y-6">
            {/* Party Overview */}
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <h2 className="text-xl font-semibold mb-4">Party Overview</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Namespace:</span>
                  <span className="ml-2 text-blue-400 font-mono">{partyInfo.namespace}</span>
                </div>
                <div>
                  <span className="text-gray-500">Type:</span>
                  <span className="ml-2">
                    {partyInfo.namespace === 'DSO' ? '🏛️ DSO' :
                     partyInfo.isValidator ? '✅ Validator' : '👤 Party'}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500">Fingerprint:</span>
                  <span className="ml-2 text-gray-300 font-mono text-xs break-all">{partyInfo.fingerprint}</span>
                </div>
                {partyInfo.participantId && (
                  <div className="col-span-2">
                    <span className="text-gray-500">Participant ID:</span>
                    <span className="ml-2 text-gray-300 font-mono text-xs break-all">{partyInfo.participantId}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Validator Info */}
            {partyInfo.isValidator && partyInfo.validatorInfo && (
              <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                <h2 className="text-xl font-semibold mb-4">🔒 Validator Information</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Sponsor:</span>
                    <span className="ml-2 text-gray-300 font-mono text-xs">
                      {String(partyInfo.validatorInfo.sponsor || 'Unknown').split('::')[0]}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Last Active:</span>
                    <span className="ml-2 text-green-400">
                      {partyInfo.validatorInfo.lastActiveAt ? 
                        new Date(String(partyInfo.validatorInfo.lastActiveAt)).toLocaleString() : 'Unknown'}
                    </span>
                  </div>
                  {partyInfo.validatorInfo.metadata && (
                    <>
                      <div>
                        <span className="text-gray-500">Version:</span>
                        <span className="ml-2">{String((partyInfo.validatorInfo.metadata as Record<string, unknown>).version || 'Unknown')}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Contact:</span>
                        <span className="ml-2">{String((partyInfo.validatorInfo.metadata as Record<string, unknown>).contactPoint || 'N/A')}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Explorer Links */}
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <h2 className="text-xl font-semibold mb-4">🔍 Explorer Links</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {partyInfo.explorers.map((explorer) => (
                  <a
                    key={explorer.name}
                    href={explorer.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <div className={`w-3 h-3 rounded-full ${
                      explorer.status === 'success' ? 'bg-green-500' :
                      explorer.status === 'error' ? 'bg-red-500' :
                      explorer.status === 'not_found' ? 'bg-yellow-500' :
                      'bg-gray-500 animate-pulse'
                    }`} />
                    <span>{explorer.name}</span>
                    <span className="ml-auto text-gray-500">↗</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12 text-gray-600 text-sm">
          <p>Data sourced from CantonNodes API and SV Scan endpoints</p>
        </div>
      </div>
    </main>
  );
}
