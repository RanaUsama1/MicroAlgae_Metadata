import { DebugPanel } from './DebugPanel';
import type { NCBIAssemblyData } from '../types/ncbi';

interface AssemblyCardProps {
  data: NCBIAssemblyData;
}

export function AssemblyCard({ data }: AssemblyCardProps) {
  const InfoRow = ({ label, value }: { label: string; value: string | number | null }) => (
    <div className="flex justify-between py-2 border-b border-slate-100 last:border-b-0">
      <span className="text-sm font-medium text-slate-600">{label}:</span>
      <span className="text-sm text-slate-900 font-mono">
        {value !== null && value !== undefined && value !== 'Unknown' ? value : (
          <span className="text-slate-400 italic">N/A</span>
        )}
      </span>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">{data.organism.scientific_name}</h2>
        <div className="flex items-center gap-4 text-sm opacity-90">
          <span>Accession: {data.accession}</span>
          <span>•</span>
          <span>Tax ID: {data.organism.tax_id}</span>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Assembly Information */}
        <section>
          <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <span className="text-blue-600">🧬</span>
            Assembly Information
          </h3>
          <div className="bg-slate-50 rounded-lg p-4">
            <InfoRow label="Assembly Name" value={data.assembly.name} />
            <InfoRow label="Assembly Level" value={data.assembly.level} />
            <InfoRow label="Common Name" value={data.organism.common_name} />
            <InfoRow label="Submission Date" value={data.assembly.submission_date} />
            <InfoRow label="Last Update" value={data.assembly.last_update} />
          </div>
        </section>

        {/* Statistics */}
        <section>
          <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <span className="text-green-600">📊</span>
            Assembly Statistics
          </h3>
          <div className="bg-slate-50 rounded-lg p-4">
            <InfoRow label="Genome Size (bp)" value={data.statistics.genome_size_bp?.toLocaleString() ?? null} />
            <InfoRow label="Genome Size" value={data.statistics.genome_size_human} />
            <InfoRow label="GC Content" value={data.statistics.gc_percent ? `${data.statistics.gc_percent.toFixed(2)}%` : null} />
            <InfoRow label="Genome Coverage" value={data.statistics.genome_coverage} />
          </div>
        </section>

        {/* Contigs */}
        <section>
          <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <span className="text-purple-600">🔗</span>
            Contig Statistics
          </h3>
          <div className="bg-slate-50 rounded-lg p-4">
            <InfoRow label="Contig Count" value={data.statistics.contigs.count?.toLocaleString() ?? null} />
            <InfoRow label="Contig N50" value={data.statistics.contigs.n50?.toLocaleString() ?? null} />
            <InfoRow label="Contig L50" value={data.statistics.contigs.l50?.toLocaleString() ?? null} />
          </div>
        </section>

        {/* Scaffolds */}
        <section>
          <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <span className="text-orange-600">🏗️</span>
            Scaffold Statistics
          </h3>
          <div className="bg-slate-50 rounded-lg p-4">
            <InfoRow label="Scaffold Count" value={data.statistics.scaffolds.count?.toLocaleString() ?? null} />
            <InfoRow label="Scaffold N50" value={data.statistics.scaffolds.n50?.toLocaleString() ?? null} />
            <InfoRow label="Scaffold L50" value={data.statistics.scaffolds.l50?.toLocaleString() ?? null} />
          </div>
        </section>

        {/* BioSample */}
        {data.biosample.accession && (
          <section>
            <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <span className="text-pink-600">🧪</span>
              BioSample Information
            </h3>
            <div className="bg-slate-50 rounded-lg p-4">
              <InfoRow label="BioSample Accession" value={data.biosample.accession} />
              <InfoRow label="Description" value={data.biosample.description} />
              <InfoRow label="Submitter" value={data.biosample.submitter} />
              {Object.keys(data.biosample.attributes).length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <p className="text-sm font-medium text-slate-600 mb-2">Attributes:</p>
                  <div className="space-y-1">
                    {Object.entries(data.biosample.attributes).map(([key, value]) => (
                      <div key={key} className="text-xs flex justify-between">
                        <span className="text-slate-500">{key}:</span>
                        <span className="text-slate-700 font-mono">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Quality Metrics */}
        <section>
          <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <span className="text-red-600">✓</span>
            Quality Metrics
          </h3>
          <div className="bg-slate-50 rounded-lg p-4">
            <InfoRow label="Quality" value={data.assembly_metadata.quality} />
            <InfoRow label="Completeness" value={data.assembly_metadata.completeness ? `${data.assembly_metadata.completeness}%` : null} />
            <InfoRow label="Contamination" value={data.assembly_metadata.contamination ? `${data.assembly_metadata.contamination}%` : null} />
          </div>
        </section>

        {/* External Links */}
        <section>
          <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <span className="text-cyan-600">🔗</span>
            External Links
          </h3>
          <div className="flex gap-3">
            <a
              href={data.external_links.ncbi}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium text-center transition-colors"
            >
              View on NCBI
            </a>
            <a
              href={data.external_links.ena}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium text-center transition-colors"
            >
              View on ENA
            </a>
          </div>
        </section>

        {/* Debug Information */}
        {data.raw_api_responses && (
          <section>
            <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <span className="text-slate-600">🐛</span>
              Debug: Raw API Responses
            </h3>
            <div className="space-y-2">
              {data.raw_api_responses.datasets && (
                <DebugPanel 
                  data={data.raw_api_responses.datasets} 
                  title="NCBI Datasets API Response" 
                />
              )}
              {data.raw_api_responses.esummary && (
                <DebugPanel 
                  data={data.raw_api_responses.esummary} 
                  title="E-utilities ESummary Response" 
                />
              )}
              {data.raw_api_responses.biosample && (
                <DebugPanel 
                  data={data.raw_api_responses.biosample} 
                  title="BioSample Data" 
                />
              )}
            </div>
          </section>
        )}

        {/* Metadata */}
        <div className="text-xs text-slate-400 text-center pt-4 border-t border-slate-100">
          Last updated: {new Date(data.meta.last_updated).toLocaleString()}
        </div>
      </div>
    </div>
  );
}
