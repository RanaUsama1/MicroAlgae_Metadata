import { useState } from 'react';

export type DatabaseType = 'assembly' | 'nucleotide' | 'gene' | 'protein' | 'taxonomy';

interface DatabaseTab {
  id: DatabaseType;
  label: string;
  icon: string;
  description: string;
}

const databases: DatabaseTab[] = [
  {
    id: 'assembly',
    label: 'Assembly',
    icon: '🧬',
    description: 'Genome assemblies (GCF_, GCA_)'
  },
  {
    id: 'nucleotide',
    label: 'Nucleotide',
    icon: '🧪',
    description: 'Sequences, genes, mRNA (NM_, NC_)'
  },
  {
    id: 'gene',
    label: 'Gene',
    icon: '🧫',
    description: 'Gene information (BRCA1, TP53)'
  },
  {
    id: 'protein',
    label: 'Protein',
    icon: '⚗️',
    description: 'Protein sequences (NP_, XP_)'
  },
  {
    id: 'taxonomy',
    label: 'Taxonomy',
    icon: '🦠',
    description: 'Organism information'
  }
];

interface DatabaseTabsProps {
  activeDatabase: DatabaseType;
  onDatabaseChange: (database: DatabaseType) => void;
}

export function DatabaseTabs({ activeDatabase, onDatabaseChange }: DatabaseTabsProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      {/* Desktop Tabs */}
      <div className="hidden md:flex border-b border-slate-200">
        {databases.map((db) => (
          <button
            key={db.id}
            onClick={() => onDatabaseChange(db.id)}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-all ${
              activeDatabase === db.id
                ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <span className="text-xl">{db.icon}</span>
              <span>{db.label}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Mobile Dropdown */}
      <div className="md:hidden p-4 border-b border-slate-200">
        <select
          value={activeDatabase}
          onChange={(e) => onDatabaseChange(e.target.value as DatabaseType)}
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        >
          {databases.map((db) => (
            <option key={db.id} value={db.id}>
              {db.icon} {db.label} - {db.description}
            </option>
          ))}
        </select>
      </div>

      {/* Database Description */}
      <div className="px-6 py-3 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{databases.find(d => d.id === activeDatabase)?.icon}</span>
          <div>
            <h3 className="font-semibold text-slate-900">
              {databases.find(d => d.id === activeDatabase)?.label}
            </h3>
            <p className="text-sm text-slate-600">
              {databases.find(d => d.id === activeDatabase)?.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
