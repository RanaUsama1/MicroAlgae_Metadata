import type { DatabaseResult } from '../types/databases';
import { AssemblyCard } from './AssemblyCard';

// Nucleotide Card
function NucleotideCard({ data }: { data: DatabaseResult & { database: 'nucleotide' } }) {
  const nuc = data.data;
  
  return (
    <div className="bg-white rounded-lg shadow-lg border border-purple-200 overflow-hidden">
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">{nuc.title}</h2>
        <div className="flex items-center gap-4 text-sm opacity-90">
          <span>Accession: {nuc.accession}</span>
          <span>•</span>
          <span>Length: {nuc.sequence.length.toLocaleString()} bp</span>
        </div>
      </div>
      
      <div className="p-6 space-y-6">
        <section>
          <h3 className="text-lg font-semibold text-slate-800 mb-3">🧬 Sequence Information</h3>
          <div className="bg-slate-50 rounded-lg p-4 space-y-2">
            <InfoRow label="Molecule Type" value={nuc.sequence.moltype} />
            <InfoRow label="Topology" value={nuc.sequence.topology} />
            <InfoRow label="Length" value={`${nuc.sequence.length.toLocaleString()} bp`} />
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-slate-800 mb-3">🧫 Gene Information</h3>
          <div className="bg-slate-50 rounded-lg p-4 space-y-2">
            <InfoRow label="Gene Symbol" value={nuc.gene.symbol} />
            <InfoRow label="Chromosome" value={nuc.gene.chromosome} />
            <InfoRow label="Map Location" value={nuc.gene.map_location} />
            {nuc.gene.synonyms.length > 0 && (
              <InfoRow label="Synonyms" value={nuc.gene.synonyms.join(', ')} />
            )}
          </div>
        </section>

        {nuc.cds && (
          <section>
            <h3 className="text-lg font-semibold text-slate-800 mb-3">⚗️ Coding Sequence</h3>
            <div className="bg-slate-50 rounded-lg p-4 space-y-2">
              <InfoRow label="CDS Start" value={nuc.cds.start} />
              <InfoRow label="CDS End" value={nuc.cds.end} />
              <InfoRow label="Protein Product" value={nuc.cds.protein_accession} />
            </div>
          </section>
        )}

        <section>
          <h3 className="text-lg font-semibold text-slate-800 mb-3">🦠 Organism</h3>
          <div className="bg-slate-50 rounded-lg p-4 space-y-2">
            <InfoRow label="Scientific Name" value={nuc.organism.scientific_name} />
            <InfoRow label="Common Name" value={nuc.organism.common_name} />
            <InfoRow label="Tax ID" value={nuc.organism.tax_id} />
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-slate-800 mb-3">🔗 External Links</h3>
          <div className="flex gap-3">
            <a href={nuc.external_links.ncbi} target="_blank" rel="noopener noreferrer" 
               className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium text-center transition-colors">
              View on NCBI
            </a>
            {nuc.external_links.gene_link && (
              <a href={nuc.external_links.gene_link} target="_blank" rel="noopener noreferrer"
                 className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium text-center transition-colors">
                View Gene
              </a>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

// Gene Card
function GeneCard({ data }: { data: DatabaseResult & { database: 'gene' } }) {
  const gene = data.data;
  
  return (
    <div className="bg-white rounded-lg shadow-lg border border-green-200 overflow-hidden">
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">{gene.symbol}</h2>
        <p className="text-sm opacity-90">{gene.description}</p>
        <div className="flex items-center gap-4 text-sm mt-2 opacity-90">
          <span>Gene ID: {gene.gene_id}</span>
          <span>•</span>
          <span>{gene.location.chromosome}</span>
        </div>
      </div>
      
      <div className="p-6 space-y-6">
        <section>
          <h3 className="text-lg font-semibold text-slate-800 mb-3">📍 Location</h3>
          <div className="bg-slate-50 rounded-lg p-4 space-y-2">
            <InfoRow label="Chromosome" value={gene.location.chromosome} />
            <InfoRow label="Map Location" value={gene.location.map_location} />
            {gene.location.genomic_range && (
              <>
                <InfoRow label="Start" value={gene.location.genomic_range.start.toLocaleString()} />
                <InfoRow label="End" value={gene.location.genomic_range.end.toLocaleString()} />
                <InfoRow label="Strand" value={gene.location.genomic_range.strand} />
              </>
            )}
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-slate-800 mb-3">🧬 Gene Details</h3>
          <div className="bg-slate-50 rounded-lg p-4 space-y-2">
            <InfoRow label="Type" value={gene.gene_type} />
            {gene.aliases.length > 0 && (
              <InfoRow label="Aliases" value={gene.aliases.join(', ')} />
            )}
          </div>
        </section>

        {gene.transcripts.length > 0 && (
          <section>
            <h3 className="text-lg font-semibold text-slate-800 mb-3">📝 Transcripts ({gene.transcripts.length})</h3>
            <div className="bg-slate-50 rounded-lg p-4 space-y-3">
              {gene.transcripts.slice(0, 5).map((t, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm border-b border-slate-200 pb-2 last:border-0">
                  <span className="font-mono text-blue-600">{t.accession}</span>
                  <div className="flex gap-3">
                    <span className="text-slate-600">{t.length} bp</span>
                    {t.protein_accession && (
                      <span className="text-green-600">→ {t.protein_accession}</span>
                    )}
                  </div>
                </div>
              ))}
              {gene.transcripts.length > 5 && (
                <p className="text-sm text-slate-500 text-center">...and {gene.transcripts.length - 5} more</p>
              )}
            </div>
          </section>
        )}

        <section>
          <h3 className="text-lg font-semibold text-slate-800 mb-3">🦠 Organism</h3>
          <div className="bg-slate-50 rounded-lg p-4 space-y-2">
            <InfoRow label="Scientific Name" value={gene.organism.scientific_name} />
            <InfoRow label="Common Name" value={gene.organism.common_name} />
            <InfoRow label="Tax ID" value={gene.organism.tax_id} />
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-slate-800 mb-3">🔗 External Links</h3>
          <div className="flex gap-3">
            <a href={gene.external_links.ncbi} target="_blank" rel="noopener noreferrer"
               className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium text-center transition-colors">
              View on NCBI Gene
            </a>
            {gene.external_links.omim && (
              <a href={gene.external_links.omim} target="_blank" rel="noopener noreferrer"
                 className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium text-center transition-colors">
                View in OMIM
              </a>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

// Protein Card
function ProteinCard({ data }: { data: DatabaseResult & { database: 'protein' } }) {
  const protein = data.data;
  
  return (
    <div className="bg-white rounded-lg shadow-lg border border-orange-200 overflow-hidden">
      <div className="bg-gradient-to-r from-orange-600 to-red-600 p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">{protein.title}</h2>
        <div className="flex items-center gap-4 text-sm opacity-90">
          <span>Accession: {protein.accession}</span>
          <span>•</span>
          <span>Length: {protein.sequence.length} aa</span>
        </div>
      </div>
      
      <div className="p-6 space-y-6">
        <section>
          <h3 className="text-lg font-semibold text-slate-800 mb-3">⚗️ Protein Information</h3>
          <div className="bg-slate-50 rounded-lg p-4 space-y-2">
            <InfoRow label="Length" value={`${protein.sequence.length} amino acids`} />
            <InfoRow label="Molecular Weight" value={protein.sequence.molecular_weight ? `${protein.sequence.molecular_weight} Da` : null} />
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-slate-800 mb-3">🧫 Gene Information</h3>
          <div className="bg-slate-50 rounded-lg p-4 space-y-2">
            <InfoRow label="Gene Symbol" value={protein.gene.symbol} />
            <InfoRow label="Gene ID" value={protein.gene.gene_id} />
            <InfoRow label="Coding Sequence" value={protein.coding_sequence.nucleotide_accession} />
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-slate-800 mb-3">🦠 Organism</h3>
          <div className="bg-slate-50 rounded-lg p-4 space-y-2">
            <InfoRow label="Scientific Name" value={protein.organism.scientific_name} />
            <InfoRow label="Tax ID" value={protein.organism.tax_id} />
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-slate-800 mb-3">🔗 External Links</h3>
          <div className="flex gap-3">
            <a href={protein.external_links.ncbi} target="_blank" rel="noopener noreferrer"
               className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium text-center transition-colors">
              View on NCBI
            </a>
            {protein.external_links.gene_link && (
              <a href={protein.external_links.gene_link} target="_blank" rel="noopener noreferrer"
                 className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium text-center transition-colors">
                View Gene
              </a>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

// Taxonomy Card
function TaxonomyCard({ data }: { data: DatabaseResult & { database: 'taxonomy' } }) {
  const taxon = data.data;
  
  return (
    <div className="bg-white rounded-lg shadow-lg border border-cyan-200 overflow-hidden">
      <div className="bg-gradient-to-r from-cyan-600 to-blue-600 p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">{taxon.scientific_name}</h2>
        <div className="flex items-center gap-4 text-sm opacity-90">
          <span>Tax ID: {taxon.tax_id}</span>
          <span>•</span>
          <span>Rank: {taxon.rank}</span>
        </div>
      </div>
      
      <div className="p-6 space-y-6">
        <section>
          <h3 className="text-lg font-semibold text-slate-800 mb-3">🦠 Taxonomy Information</h3>
          <div className="bg-slate-50 rounded-lg p-4 space-y-2">
            <InfoRow label="Scientific Name" value={taxon.scientific_name} />
            <InfoRow label="Common Name" value={taxon.common_name} />
            <InfoRow label="Rank" value={taxon.rank} />
            <InfoRow label="Tax ID" value={taxon.tax_id} />
          </div>
        </section>

        {taxon.lineage.length > 0 && (
          <section>
            <h3 className="text-lg font-semibold text-slate-800 mb-3">📊 Lineage</h3>
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="space-y-1 text-sm">
                {taxon.lineage.map((l, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-slate-400">{'→'.repeat(idx)}</span>
                    <span className="text-slate-700">{l.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <section>
          <h3 className="text-lg font-semibold text-slate-800 mb-3">🧬 Genetic Code</h3>
          <div className="bg-slate-50 rounded-lg p-4 space-y-2">
            <InfoRow label="Code" value={`${taxon.genetic_code.id} (${taxon.genetic_code.name})`} />
            {taxon.mitochondrial_genetic_code && (
              <InfoRow label="Mitochondrial Code" value={`${taxon.mitochondrial_genetic_code.id} (${taxon.mitochondrial_genetic_code.name})`} />
            )}
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-slate-800 mb-3">🔗 External Links</h3>
          <a href={taxon.external_links.ncbi} target="_blank" rel="noopener noreferrer"
             className="block bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm font-medium text-center transition-colors">
            View on NCBI Taxonomy
          </a>
        </section>
      </div>
    </div>
  );
}

// Helper component
const InfoRow = ({ label, value }: { label: string; value: string | number | null }) => (
  <div className="flex justify-between py-2 border-b border-slate-100 last:border-b-0">
    <span className="text-sm font-medium text-slate-600">{label}:</span>
    <span className="text-sm text-slate-900 font-mono">
      {value !== null && value !== undefined && value !== 'Unknown' && value !== '' ? value : (
        <span className="text-slate-400 italic">N/A</span>
      )}
    </span>
  </div>
);

// Main component with discriminated union
export function ResultCard({ result }: { result: DatabaseResult }) {
  switch (result.database) {
    case 'assembly':
      return <AssemblyCard data={result.data} />;
    case 'nucleotide':
      return <NucleotideCard data={result as DatabaseResult & { database: 'nucleotide' }} />;
    case 'gene':
      return <GeneCard data={result as DatabaseResult & { database: 'gene' }} />;
    case 'protein':
      return <ProteinCard data={result as DatabaseResult & { database: 'protein' }} />;
    case 'taxonomy':
      return <TaxonomyCard data={result as DatabaseResult & { database: 'taxonomy' }} />;
    default:
      return <div>Unknown database type</div>;
  }
}
