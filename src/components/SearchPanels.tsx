import { useState } from 'react';
import type { DatabaseType } from './DatabaseTabs';

interface SearchPanelsProps {
  database: DatabaseType;
  onSearch: (query: string, options?: any) => void;
  loading: boolean;
}

export function SearchPanels({ database, onSearch, loading }: SearchPanelsProps) {
  const [query, setQuery] = useState('');
  const [organism, setOrganism] = useState('human');
  const [searchType, setSearchType] = useState<'symbol' | 'id'>('symbol');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    onSearch(query, { organism, searchType });
  };

  // Assembly Search Panel
  if (database === 'assembly') {
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Assembly Accession
          </label>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., GCF_000005845.2 or GCA_019044685.2"
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-mono text-sm"
          />
          <p className="mt-2 text-xs text-slate-500">
            💡 Examples: GCF_000005845.2 (E. coli), GCF_000001405.40 (Human)
          </p>
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-400 disabled:to-slate-500 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg disabled:cursor-not-allowed"
        >
          {loading ? 'Searching...' : 'Search Assembly'}
        </button>
      </form>
    );
  }

  // Nucleotide Search Panel
  if (database === 'nucleotide') {
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Nucleotide Accession
          </label>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., NM_007294.4, NC_000017.11, NG_005905.2"
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-mono text-sm"
          />
          <p className="mt-2 text-xs text-slate-500">
            💡 Examples: NM_007294.4 (BRCA1 mRNA), NC_000017.11 (Human Chr 17)
          </p>
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-slate-400 disabled:to-slate-500 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg disabled:cursor-not-allowed"
        >
          {loading ? 'Searching...' : 'Search Nucleotide'}
        </button>
      </form>
    );
  }

  // Gene Search Panel
  if (database === 'gene') {
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-4 mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="searchType"
              checked={searchType === 'symbol'}
              onChange={() => setSearchType('symbol')}
              className="w-4 h-4 text-blue-600"
            />
            <span className="text-sm font-medium text-slate-700">Gene Symbol</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="searchType"
              checked={searchType === 'id'}
              onChange={() => setSearchType('id')}
              className="w-4 h-4 text-blue-600"
            />
            <span className="text-sm font-medium text-slate-700">Gene ID</span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            {searchType === 'symbol' ? 'Gene Symbol' : 'Gene ID'}
          </label>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchType === 'symbol' ? 'e.g., BRCA1, TP53, EGFR' : 'e.g., 672'}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-mono text-sm"
          />
        </div>

        {searchType === 'symbol' && (
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Organism (optional)
            </label>
            <select
              value={organism}
              onChange={(e) => setOrganism(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="human">Human (Homo sapiens)</option>
              <option value="mouse">Mouse (Mus musculus)</option>
              <option value="rat">Rat (Rattus norvegicus)</option>
              <option value="zebrafish">Zebrafish (Danio rerio)</option>
              <option value="fruit fly">Fruit fly (Drosophila melanogaster)</option>
              <option value="e coli">E. coli (Escherichia coli)</option>
            </select>
          </div>
        )}

        <p className="text-xs text-slate-500">
          💡 Examples: BRCA1 (breast cancer gene), TP53 (tumor suppressor), GAPDH (housekeeping)
        </p>

        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-slate-400 disabled:to-slate-500 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg disabled:cursor-not-allowed"
        >
          {loading ? 'Searching...' : 'Search Gene'}
        </button>
      </form>
    );
  }

  // Protein Search Panel
  if (database === 'protein') {
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Protein Accession
          </label>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., NP_009225.1, XP_011536034.1"
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-mono text-sm"
          />
          <p className="mt-2 text-xs text-slate-500">
            💡 Examples: NP_009225.1 (BRCA1 protein), NP_000537.3 (TP53)
          </p>
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 disabled:from-slate-400 disabled:to-slate-500 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg disabled:cursor-not-allowed"
        >
          {loading ? 'Searching...' : 'Search Protein'}
        </button>
      </form>
    );
  }

  // Taxonomy Search Panel
  if (database === 'taxonomy') {
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Organism Name or Tax ID
          </label>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., Escherichia coli, Homo sapiens, 562"
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
          />
          <p className="mt-2 text-xs text-slate-500">
            💡 Examples: Escherichia coli, Homo sapiens (human), 562 (E. coli tax ID)
          </p>
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 disabled:from-slate-400 disabled:to-slate-500 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg disabled:cursor-not-allowed"
        >
          {loading ? 'Searching...' : 'Search Taxonomy'}
        </button>
      </form>
    );
  }

  return null;
}
