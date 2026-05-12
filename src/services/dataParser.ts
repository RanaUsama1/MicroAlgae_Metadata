import type { NCBIAssemblyData } from '../types/ncbi';

/**
 * Parse backend response (which contains both datasets_data and esummary_data)
 * into our NCBIAssemblyData format
 */
export function parseBackendResponse(backendData: any): NCBIAssemblyData {
  const accession = backendData.accession;
  const datasetsData = backendData.datasets_data;
  const esummaryData = backendData.esummary_data;
  
  // Extract from Datasets API (if available)
  const report = datasetsData?.reports?.[0];
  const assemblyInfo = report?.assembly_info;
  const assemblyStats = report?.assembly_stats;
  const organism = report?.organism;
  const biosampleObj = report?.biosample;
  
  // Helper to parse integers safely
  const parseIntSafe = (value: any): number | null => {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'number') return Math.floor(value);
    if (typeof value === 'string') {
      const parsed = parseInt(value.replace(/,/g, ''));
      return isNaN(parsed) ? null : parsed;
    }
    return null;
  };
  
  // Helper to parse floats safely
  const parseFloatSafe = (value: any): number | null => {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value.replace(/,/g, ''));
      return isNaN(parsed) ? null : parsed;
    }
    return null;
  };
  
  // Format bytes
  const formatBytes = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };
  
  // Parse ESummary meta XML if present
  let metaStats: any = {};
  if (esummaryData?.meta && typeof esummaryData.meta === 'string') {
    const metaXml = esummaryData.meta;
    const totalLengthMatch = metaXml.match(/<Stat category="total_sequence_length"[^>]*>(\d+)<\/Stat>/);
    if (totalLengthMatch) metaStats.total_length = totalLengthMatch[1];
    const contigCountMatch = metaXml.match(/<Stat category="contig_count"[^>]*>(\d+)<\/Stat>/);
    if (contigCountMatch) metaStats.contig_count = contigCountMatch[1];
    const scaffoldCountMatch = metaXml.match(/<Stat category="scaffold_count"[^>]*>(\d+)<\/Stat>/);
    if (scaffoldCountMatch) metaStats.scaffold_count = scaffoldCountMatch[1];
    const contigL50Match = metaXml.match(/<Stat category="contig_l50"[^>]*>(\d+)<\/Stat>/);
    if (contigL50Match) metaStats.contig_l50 = contigL50Match[1];
    const scaffoldL50Match = metaXml.match(/<Stat category="scaffold_l50"[^>]*>(\d+)<\/Stat>/);
    if (scaffoldL50Match) metaStats.scaffold_l50 = scaffoldL50Match[1];
    const gcPercentMatch = metaXml.match(/<Stat category="gc_percent"[^>]*>([\d.]+)<\/Stat>/);
    if (gcPercentMatch) metaStats.gc_percent = gcPercentMatch[1];
  }
  
  // Extract statistics - Datasets API first, then ESummary
  const totalLength = parseIntSafe(assemblyStats?.total_sequence_length) ||
                     parseIntSafe(metaStats?.total_length);
  
  const contigCount = parseIntSafe(assemblyStats?.number_of_contigs) ||
                     parseIntSafe(metaStats?.contig_count);
  
  const scaffoldCount = parseIntSafe(assemblyStats?.number_of_scaffolds) ||
                       parseIntSafe(metaStats?.scaffold_count) ||
                       contigCount;
  
  const contigN50 = parseIntSafe(esummaryData?.contign50) ||
                   parseIntSafe(assemblyStats?.contig_n50);
  
  const scaffoldN50 = parseIntSafe(esummaryData?.scaffoldn50) ||
                     parseIntSafe(assemblyStats?.scaffold_n50) ||
                     contigN50;
  
  const contigL50 = parseIntSafe(esummaryData?.contigl50) ||
                   parseIntSafe(metaStats?.contig_l50) ||
                   parseIntSafe(assemblyStats?.contig_l50);
  
  const scaffoldL50 = parseIntSafe(esummaryData?.scaffoldl50) ||
                     parseIntSafe(metaStats?.scaffold_l50) ||
                     parseIntSafe(assemblyStats?.scaffold_l50) ||
                     contigL50;
  
  const gcCount = parseIntSafe(metaStats?.gc_count) ||
                 parseIntSafe(assemblyStats?.gc_count);
  
  const gcPercent = parseFloatSafe(metaStats?.gc_percent) ||
                   parseFloatSafe(assemblyStats?.gc_percent) ||
                   (gcCount && totalLength ? (gcCount / totalLength) * 100 : null);
  
  const coverage = esummaryData?.coverage ||
                  assemblyStats?.genome_coverage;
  
  // Extract organism and assembly info
  const taxid = organism?.tax_id || esummaryData?.taxid || 'Unknown';
  const speciesName = organism?.organism_name || esummaryData?.speciesname || 'Unknown';
  const biosampleAccession = biosampleObj?.accession || esummaryData?.biosampleaccn || '';
  const assemblyName = assemblyInfo?.assembly_name || esummaryData?.assemblyname || 'Unknown';
  const assemblyLevel = assemblyInfo?.assembly_level || esummaryData?.assemblystatus || 'Unknown';
  const submissionDate = assemblyInfo?.release_date || esummaryData?.seqreleasedate || 'Unknown';
  const lastUpdate = esummaryData?.lastupdatedate || assemblyInfo?.release_date || 'Unknown';
  
  return {
    accession,
    organism: {
      scientific_name: speciesName,
      common_name: organism?.common_name || esummaryData?.organism || 'Unknown',
      tax_id: String(taxid)
    },
    assembly: {
      name: assemblyName,
      level: assemblyLevel,
      submission_date: submissionDate,
      last_update: lastUpdate
    },
    statistics: {
      genome_size_bp: totalLength,
      genome_size_human: totalLength ? formatBytes(totalLength) : null,
      contigs: {
        count: contigCount,
        n50: contigN50,
        l50: contigL50
      },
      scaffolds: {
        count: scaffoldCount,
        n50: scaffoldN50,
        l50: scaffoldL50
      },
      gc_percent: gcPercent,
      genome_coverage: coverage ? `${coverage}x` : null
    },
    biosample: {
      accession: biosampleAccession,
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
      ncbi: `https://www.ncbi.nlm.nih.gov/datasets/genome/${accession}/`,
      ena: `https://www.ebi.ac.uk/ena/browser/view/${accession.replace('GCF_', 'GCA_')}`
    },
    meta: {
      source: backendData.from_cache ? 'cache' : 'ncbi',
      last_updated: backendData.fetched_at || new Date().toISOString()
    },
    raw_api_responses: {
      datasets: datasetsData,
      esummary: esummaryData,
      biosample: null
    }
  };
}
