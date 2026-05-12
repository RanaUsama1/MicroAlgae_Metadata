import type { DatabaseType, DatabaseResult, NucleotideData, GeneData, ProteinData, TaxonomyData } from '../types/databases';
import type { NCBIAssemblyData } from '../types/ncbi';

// Helper functions
const parseIntSafe = (value: any): number | null => {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return Math.floor(value);
  if (typeof value === 'string') {
    const parsed = parseInt(value.replace(/,/g, ''));
    return isNaN(parsed) ? null : parsed;
  }
  return null;
};

const parseFloatSafe = (value: any): number | null => {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value.replace(/,/g, ''));
    return isNaN(parsed) ? null : parsed;
  }
  return null;
};

const formatBytes = (bytes: number): string => {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

// Parse Assembly data
function parseAssemblyData(backendData: any): NCBIAssemblyData {
  const datasetsData = backendData.datasets_data;
  const esummaryData = backendData.esummary_data;
  
  const report = datasetsData?.reports?.[0];
  const assemblyInfo = report?.assembly_info;
  const assemblyStats = report?.assembly_stats;
  const organism = report?.organism;
  const biosampleObj = report?.biosample;
  
  // Parse meta XML if present
  let metaStats: any = {};
  if (esummaryData?.meta && typeof esummaryData.meta === 'string') {
    const metaXml = esummaryData.meta;
    const totalLengthMatch = metaXml.match(/<Stat category="total_sequence_length"[^>]*>(\d+)<\/Stat>/);
    if (totalLengthMatch) metaStats.total_length = totalLengthMatch[1];
    const contigCountMatch = metaXml.match(/<Stat category="contig_count"[^>]*>(\d+)<\/Stat>/);
    if (contigCountMatch) metaStats.contig_count = contigCountMatch[1];
    const gcPercentMatch = metaXml.match(/<Stat category="gc_percent"[^>]*>([\d.]+)<\/Stat>/);
    if (gcPercentMatch) metaStats.gc_percent = gcPercentMatch[1];
  }
  
  const totalLength = parseIntSafe(assemblyStats?.total_sequence_length) || parseIntSafe(metaStats?.total_length);
  const contigCount = parseIntSafe(assemblyStats?.number_of_contigs) || parseIntSafe(metaStats?.contig_count);
  const scaffoldCount = parseIntSafe(assemblyStats?.number_of_scaffolds) || contigCount;
  const contigN50 = parseIntSafe(esummaryData?.contign50) || parseIntSafe(assemblyStats?.contig_n50);
  const scaffoldN50 = parseIntSafe(esummaryData?.scaffoldn50) || parseIntSafe(assemblyStats?.scaffold_n50) || contigN50;
  const contigL50 = parseIntSafe(metaStats?.contig_l50) || parseIntSafe(assemblyStats?.contig_l50);
  const scaffoldL50 = parseIntSafe(metaStats?.scaffold_l50) || parseIntSafe(assemblyStats?.scaffold_l50) || contigL50;
  const gcPercent = parseFloatSafe(metaStats?.gc_percent) || parseFloatSafe(assemblyStats?.gc_percent);
  
  return {
    accession: backendData.accession,
    organism: {
      scientific_name: organism?.organism_name || esummaryData?.speciesname || 'Unknown',
      common_name: organism?.common_name || esummaryData?.organism || 'Unknown',
      tax_id: String(organism?.tax_id || esummaryData?.taxid || 'Unknown')
    },
    assembly: {
      name: assemblyInfo?.assembly_name || esummaryData?.assemblyname || 'Unknown',
      level: assemblyInfo?.assembly_level || esummaryData?.assemblystatus || 'Unknown',
      submission_date: assemblyInfo?.release_date || esummaryData?.seqreleasedate || 'Unknown',
      last_update: esummaryData?.lastupdatedate || assemblyInfo?.release_date || 'Unknown'
    },
    statistics: {
      genome_size_bp: totalLength,
      genome_size_human: totalLength ? formatBytes(totalLength) : null,
      contigs: { count: contigCount, n50: contigN50, l50: contigL50 },
      scaffolds: { count: scaffoldCount, n50: scaffoldN50, l50: scaffoldL50 },
      gc_percent: gcPercent,
      genome_coverage: esummaryData?.coverage ? `${esummaryData.coverage}x` : null
    },
    biosample: {
      accession: biosampleObj?.accession || esummaryData?.biosampleaccn || '',
      description: null,
      submitter: null,
      attributes: {}
    },
    assembly_metadata: {
      quality: assemblyInfo?.assembly_type || null,
      assembly_software: null,
      completeness: report?.checkm_info?.completeness || null,
      contamination: report?.checkm_info?.contamination || null
    },
    external_links: {
      ncbi: `https://www.ncbi.nlm.nih.gov/datasets/genome/${backendData.accession}/`,
      ena: `https://www.ebi.ac.uk/ena/browser/view/${backendData.accession.replace('GCF_', 'GCA_')}`
    },
    meta: {
      source: backendData.from_cache ? 'cache' : 'ncbi',
      last_updated: backendData.fetched_at || new Date().toISOString()
    },
    raw_api_responses: { datasets: datasetsData, esummary: esummaryData }
  };
}

// Parse Nucleotide data
function parseNucleotideData(backendData: any): NucleotideData {
  const summary = backendData.esummary_data || {};
  
  return {
    accession: backendData.accession,
    title: summary.title || 'Unknown',
    organism: {
      scientific_name: summary.organism || 'Unknown',
      common_name: summary.commonname || 'Unknown',
      tax_id: String(summary.taxid || 'Unknown')
    },
    sequence: {
      length: parseIntSafe(summary.slen) || 0,
      moltype: summary.moltype || 'Unknown',
      topology: summary.topology || 'linear'
    },
    gene: {
      symbol: summary.gene || null,
      synonyms: summary.extra?.split('|').filter(Boolean) || [],
      chromosome: summary.chromosome || null,
      map_location: summary.maplocation || null
    },
    cds: summary.cds ? {
      start: parseIntSafe(summary.cds.split('..')[0]),
      end: parseIntSafe(summary.cds.split('..')[1]),
      protein_accession: summary.protein || null,
      translation_length: null
    } : null,
    dates: {
      create_date: summary.createdate || 'Unknown',
      update_date: summary.updatedate || 'Unknown'
    },
    references: {
      pubmed_ids: summary.pubmedids || []
    },
    external_links: {
      ncbi: `https://www.ncbi.nlm.nih.gov/nuccore/${backendData.accession}`,
      gene_link: summary.gene ? `https://www.ncbi.nlm.nih.gov/gene/?term=${summary.gene}` : null,
      protein_link: summary.protein ? `https://www.ncbi.nlm.nih.gov/protein/${summary.protein}` : null
    },
    meta: {
      source: backendData.from_cache ? 'cache' : 'ncbi',
      last_updated: backendData.fetched_at || new Date().toISOString()
    },
    raw_api_responses: { esummary: summary }
  };
}

// Parse Gene data
function parseGeneData(backendData: any): GeneData {
  const summary = backendData.esummary_data || {};
  const datasets = backendData.datasets_data?.reports?.[0];
  
  const geneId = summary.uid || backendData.gene_id || 'Unknown';
  const symbol = datasets?.gene?.symbol || summary.name || backendData.symbol || 'Unknown';
  
  return {
    gene_id: String(geneId),
    symbol: symbol,
    description: datasets?.gene?.description || summary.description || 'Unknown',
    organism: {
      scientific_name: datasets?.organism?.organism_name || summary.organism?.scientificname || backendData.organism || 'Unknown',
      common_name: datasets?.organism?.common_name || summary.organism?.commonname || 'Unknown',
      tax_id: String(datasets?.organism?.tax_id || summary.organism?.taxid || 'Unknown')
    },
    location: {
      chromosome: datasets?.gene?.chromosomes?.[0] || summary.chromosome || 'Unknown',
      map_location: summary.maplocation || 'Unknown',
      genomic_range: datasets?.gene?.genomic_ranges?.[0] ? {
        start: datasets.gene.genomic_ranges[0].range[0].begin,
        end: datasets.gene.genomic_ranges[0].range[0].end,
        strand: datasets.gene.genomic_ranges[0].orientation || '+'
      } : null
    },
    gene_type: datasets?.gene?.type || summary.genetypelist || 'protein-coding',
    transcripts: datasets?.gene?.transcripts?.map((t: any) => ({
      accession: t.accession,
      protein_accession: t.protein?.accession || null,
      length: t.length || 0
    })) || [],
    aliases: summary.otheraliases?.split(',').map((a: string) => a.trim()) || [],
    summary: summary.summary || null,
    external_links: {
      ncbi: `https://www.ncbi.nlm.nih.gov/gene/${geneId}`,
      omim: summary.mim ? `https://omim.org/entry/${summary.mim}` : null,
      ensembl: null
    },
    meta: {
      source: backendData.from_cache ? 'cache' : 'ncbi',
      last_updated: backendData.fetched_at || new Date().toISOString()
    },
    raw_api_responses: { esummary: summary, datasets }
  };
}

// Parse Protein data
function parseProteinData(backendData: any): ProteinData {
  const summary = backendData.esummary_data || {};
  
  return {
    accession: backendData.accession,
    title: summary.title || 'Unknown',
    organism: {
      scientific_name: summary.organism || 'Unknown',
      tax_id: String(summary.taxid || 'Unknown')
    },
    sequence: {
      length: parseIntSafe(summary.slen) || 0,
      molecular_weight: null
    },
    gene: {
      symbol: summary.gene || null,
      gene_id: summary.geneid || null
    },
    coding_sequence: {
      nucleotide_accession: summary.sourcemol || null
    },
    dates: {
      create_date: summary.createdate || 'Unknown',
      update_date: summary.updatedate || 'Unknown'
    },
    external_links: {
      ncbi: `https://www.ncbi.nlm.nih.gov/protein/${backendData.accession}`,
      gene_link: summary.gene ? `https://www.ncbi.nlm.nih.gov/gene/?term=${summary.gene}` : null
    },
    meta: {
      source: backendData.from_cache ? 'cache' : 'ncbi',
      last_updated: backendData.fetched_at || new Date().toISOString()
    },
    raw_api_responses: { esummary: summary }
  };
}

// Parse Taxonomy data
function parseTaxonomyData(backendData: any): TaxonomyData {
  const summary = backendData.esummary_data || {};
  
  return {
    tax_id: backendData.tax_id || String(summary.taxid) || 'Unknown',
    scientific_name: summary.scientificname || backendData.query || 'Unknown',
    common_name: summary.commonname || null,
    rank: summary.rank || 'Unknown',
    lineage: summary.lineage?.split('; ').map((name: string) => ({
      rank: 'unknown',
      name: name,
      tax_id: 'unknown'
    })) || [],
    genetic_code: {
      id: parseIntSafe(summary.geneticcode) || 1,
      name: 'Standard'
    },
    mitochondrial_genetic_code: summary.mgcid ? {
      id: parseIntSafe(summary.mgcid) || 0,
      name: summary.mgcname || 'Unknown'
    } : null,
    external_links: {
      ncbi: `https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=${backendData.tax_id || summary.taxid}`
    },
    meta: {
      source: backendData.from_cache ? 'cache' : 'ncbi',
      last_updated: backendData.fetched_at || new Date().toISOString()
    },
    raw_api_responses: { esummary: summary }
  };
}

// Factory function
export function parseBackendResponse(database: DatabaseType, backendData: any): DatabaseResult {
  switch (database) {
    case 'assembly':
      return { database: 'assembly', data: parseAssemblyData(backendData) };
    case 'nucleotide':
      return { database: 'nucleotide', data: parseNucleotideData(backendData) };
    case 'gene':
      return { database: 'gene', data: parseGeneData(backendData) };
    case 'protein':
      return { database: 'protein', data: parseProteinData(backendData) };
    case 'taxonomy':
      return { database: 'taxonomy', data: parseTaxonomyData(backendData) };
    default:
      throw new Error(`Unknown database type: ${database}`);
  }
}
