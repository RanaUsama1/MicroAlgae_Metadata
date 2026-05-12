import { useState } from 'react';
import { fetchNCBIAssemblyData } from './services/ncbiService';
import { fetchFromBackend } from './services/backendService';
import { ResultCard } from './components/ResultCards';
import { DatabaseTabs, type DatabaseType } from './components/DatabaseTabs';
import { SearchPanels } from './components/SearchPanels';
import type { UnifiedSearchResponse } from './types/databases';
import { USE_BACKEND, BACKEND_API_URL } from './config';

export default function App() {
  const [activeDatabase, setActiveDatabase] = useState<DatabaseType>('assembly');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<UnifiedSearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (query: string, options?: any) => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      if (!query.trim()) {
        setError('Please enter a search query');
        setLoading(false);
        return;
      }

      // Check if backend is configured
      if (USE_BACKEND && BACKEND_API_URL) {
        // Use unified backend service
        const result = await fetchFromBackend(activeDatabase, query, options);
        setData(result);
      } else {
        // Direct NCBI calls (only Assembly database supported without backend)
        if (activeDatabase === 'assembly') {
          console.log('Using direct NCBI API for assembly');
          const assemblyResult = await fetchNCBIAssemblyData([query]);
          
          // Convert to UnifiedSearchResponse
          const result: UnifiedSearchResponse = {
            database: 'assembly',
            query,
            results: assemblyResult.metadata.map(data => ({ database: 'assembly' as const, data })),
            failed: assemblyResult.failed_accessions,
            message: assemblyResult.message
          };
          setData(result);
        } else {
          setError(
            `❌ Backend not configured! Direct NCBI calls only work for Assembly database.\n\n` +
            `To use ${activeDatabase.toUpperCase()} database:\n` +
            `1. Deploy the backend (see QUICK_START.md)\n` +
            `2. Set VITE_BACKEND_URL environment variable\n` +
            `3. Rebuild the app\n\n` +
            `Or switch to Assembly tab to search genome assemblies without backend.`
          );
        }
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(
        err instanceof Error 
          ? `Error: ${err.message}\n\nTip: Make sure your backend is running and accessible.`
          : 'An error occurred while fetching data'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleExportJSON = () => {
    if (!data) return;
    
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ncbi_assembly_data_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-3 rounded-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-slate-900">NCBI Assembly Data Fetcher</h1>
              <p className="text-slate-600 mt-1">Fetch comprehensive genome assembly data from NCBI</p>
              <div className="mt-2 flex items-center gap-2">
                {USE_BACKEND && BACKEND_API_URL ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Backend API + MongoDB Cache
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded">
                    ⚠️ Direct NCBI (Assembly Only)
                  </span>
                )}
                <span className="text-xs text-slate-500">
                  {USE_BACKEND && BACKEND_API_URL ? BACKEND_API_URL : 'Direct NCBI API - No backend'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Backend Warning */}
        {(!USE_BACKEND || !BACKEND_API_URL) && activeDatabase !== 'assembly' && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-orange-900 font-semibold">Backend Not Configured</h3>
                <p className="text-orange-700 text-sm mt-1">
                  {activeDatabase.charAt(0).toUpperCase() + activeDatabase.slice(1)} database requires a backend. 
                  Currently, only <strong>Assembly</strong> database works without backend.
                </p>
                <p className="text-orange-700 text-sm mt-2">
                  <strong>To enable all databases:</strong> Deploy the backend and set <code className="bg-orange-100 px-1 rounded">VITE_BACKEND_URL</code> environment variable.
                  See <code className="bg-orange-100 px-1 rounded">QUICK_START.md</code> for instructions.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Database Tabs */}
        <div className="mb-8">
          <DatabaseTabs
            activeDatabase={activeDatabase}
            onDatabaseChange={(db) => {
              setActiveDatabase(db);
              setData(null);
              setError(null);
            }}
          />
        </div>

        {/* Search Panel */}
        <div className="bg-white rounded-lg shadow-lg border border-slate-200 p-6 mb-8">
          <SearchPanels
            database={activeDatabase}
            onSearch={handleSearch}
            loading={loading}
          />
          
          {data && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <button
                onClick={handleExportJSON}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export JSON
              </button>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-red-900 font-semibold">Error</h3>
                <p className="text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Results Summary */}
        {data && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-green-900">Results Summary</h3>
                <p className="text-green-700 mt-1">{data.message}</p>
                {data.from_cache && (
                  <p className="text-xs text-green-600 mt-1">✅ Loaded from cache (instant!)</p>
                )}
              </div>
              <div className="flex gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{data.results.length}</div>
                  <div className="text-sm text-green-700">Retrieved</div>
                </div>
                {data.failed.length > 0 && (
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-600">{data.failed.length}</div>
                    <div className="text-sm text-red-700">Failed</div>
                  </div>
                )}
              </div>
            </div>
            {data.failed.length > 0 && (
              <div className="mt-4 pt-4 border-t border-green-200">
                <p className="text-sm font-medium text-green-900">Failed queries:</p>
                <p className="text-sm text-green-700 mt-1">{data.failed.join(', ')}</p>
              </div>
            )}
          </div>
        )}

        {/* Result Cards - Uses discriminated union */}
        {data && data.results.length > 0 && (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-slate-900">
              {data.database.charAt(0).toUpperCase() + data.database.slice(1)} Results
            </h2>
            {data.results.map((result, index) => (
              <ResultCard key={index} result={result} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !data && !error && (
          <div className="bg-white rounded-lg shadow-lg border border-slate-200 p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Ready to Fetch Data</h3>
            <p className="text-slate-600 max-w-md mx-auto">
              Enter one or more NCBI assembly accession numbers above and click "Fetch Data" to retrieve comprehensive genome assembly information.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between text-sm text-slate-600">
            <p>NCBI Assembly Data Fetcher</p>
            <div className="flex items-center gap-2">
              <span>Powered by</span>
              <a 
                href="https://www.ncbi.nlm.nih.gov/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                NCBI E-utilities
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
