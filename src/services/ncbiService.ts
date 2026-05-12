import type { NCBIAssemblyData, NCBIResponse } from '../types/ncbi';

const NCBI_API_BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
const NCBI_DATASETS_API = 'https://api.ncbi.nlm.nih.gov/datasets/v2';

// Format bytes to human readable
function formatBytes(bytes: number | string): string {
  const numBytes = typeof bytes === 'string' ? parseInt(bytes) : bytes;
  if (!numBytes || numBytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(numBytes) / Math.log(k));
  return Math.round((numBytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// Helper to get value from multiple possible field names (case-insensitive search)
function getFieldValue(obj: any, ...fieldNames: string[]): any {
  if (!obj) return null;
  
  for (const fieldName of fieldNames) {
    // Try exact match first
    if (obj[fieldName] !== undefined && obj[fieldName] !== null) {
      return obj[fieldName];
    }
    
    // Try case-insensitive match
    const keys = Object.keys(obj);
    const matchedKey = keys.find(k => k.toLowerCase() === fieldName.toLowerCase());
    if (matchedKey && obj[matchedKey] !== undefined && obj[matchedKey] !== null) {
      return obj[matchedKey];
    }
  }
  
  return null;
}

// Parse integer from various formats
function parseIntSafe(value: any): number | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return Math.floor(value);
  if (typeof value === 'string') {
    const parsed = parseInt(value.replace(/,/g, ''));
    return isNaN(parsed) ? null : parsed;
  }
  return null;
}

// Parse float from various formats
function parseFloatSafe(value: any): number | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value.replace(/,/g, ''));
    return isNaN(parsed) ? null : parsed;
  }
  return null;
}

// Fetch assembly data using NCBI Datasets API v2
async function fetchAssemblyFromDatasets(accession: string): Promise<any> {
  try {
    // Use the correct v2 API endpoint - dataset_report returns ALL metadata!
    const url = `${NCBI_DATASETS_API}/genome/accession/${accession}/dataset_report`;
    console.log(`Fetching from Datasets API: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn(`Datasets API failed for ${accession}: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.warn(`Error response:`, errorText);
      return null;
    }
    
    const data = await response.json();
    console.log(`✓ Datasets API SUCCESS for ${accession}:`, data);
    return data;
  } catch (error) {
    console.warn(`Error fetching from Datasets API for ${accession}:`, error);
    return null;
  }
}

// Fetch assembly summary using ESummary
async function fetchAssemblySummary(accession: string): Promise<any> {
  try {
    // First search for the assembly ID
    const searchUrl = `${NCBI_API_BASE}/esearch.fcgi?db=assembly&term=${accession}&retmode=json`;
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();
    
    if (!searchData.esearchresult?.idlist?.length) {
      return null;
    }
    
    const assemblyId = searchData.esearchresult.idlist[0];
    
    // Fetch summary
    const summaryUrl = `${NCBI_API_BASE}/esummary.fcgi?db=assembly&id=${assemblyId}&retmode=json`;
    const summaryResponse = await fetch(summaryUrl);
    const summaryData = await summaryResponse.json();
    
    const result = summaryData.result?.[assemblyId];
    console.log(`ESummary response for ${accession}:`, result);
    return result;
  } catch (error) {
    console.warn(`Error fetching assembly summary for ${accession}:`, error);
    return null;
  }
}

// Fetch BioSample data
async function fetchBioSampleData(biosampleId: string): Promise<any> {
  if (!biosampleId) return null;
  
  try {
    const searchUrl = `${NCBI_API_BASE}/esearch.fcgi?db=biosample&term=${biosampleId}&retmode=json`;
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();
    
    if (!searchData.esearchresult?.idlist?.length) {
      return null;
    }
    
    const bioSampleUid = searchData.esearchresult.idlist[0];
    
    // Fetch full record
    const fetchUrl = `${NCBI_API_BASE}/efetch.fcgi?db=biosample&id=${bioSampleUid}&retmode=xml`;
    const fetchResponse = await fetch(fetchUrl);
    const xmlText = await fetchResponse.text();
    
    return parseXMLBioSample(xmlText);
  } catch (error) {
    console.warn(`Error fetching BioSample data for ${biosampleId}:`, error);
    return null;
  }
}

// Simple XML parser for BioSample
function parseXMLBioSample(xml: string): any {
  const result: any = {
    description: null,
    submitter: null,
    attributes: {}
  };
  
  // Extract description
  const descMatch = xml.match(/<Description>[\s\S]*?<Title>(.*?)<\/Title>/);
  if (descMatch) {
    result.description = descMatch[1];
  }
  
  // Extract submitter
  const submitterMatch = xml.match(/<Owner>[\s\S]*?<Name[^>]*>(.*?)<\/Name>/);
  if (submitterMatch) {
    result.submitter = submitterMatch[1];
  }
  
  // Extract attributes
  const attributeMatches = xml.matchAll(/<Attribute[^>]*attribute_name="([^"]*)"[^>]*>(.*?)<\/Attribute>/g);
  for (const match of attributeMatches) {
    result.attributes[match[1]] = match[2];
  }
  
  return result;
}

// Main function to fetch comprehensive assembly data
export async function fetchNCBIAssemblyData(accessions: string[]): Promise<NCBIResponse> {
  const metadata: NCBIAssemblyData[] = [];
  const failed: string[] = [];
  
  for (const accession of accessions) {
    try {
      console.log(`Fetching data for ${accession}...`);
      
      // Try both APIs to get complete data
      const [datasetsData, summaryData] = await Promise.all([
        fetchAssemblyFromDatasets(accession),
        fetchAssemblySummary(accession)
      ]);
      
      console.log(`=== Data Sources for ${accession} ===`);
      console.log('Datasets API available:', !!datasetsData);
      console.log('ESummary available:', !!summaryData);
      
      // Extract data from Datasets API v2 response structure
      // The response structure is: { reports: [ { accession, organism, assembly_info, assembly_stats, ... } ] }
      const report = datasetsData?.reports?.[0];
      const assemblyInfo = report?.assembly_info;
      const assemblyStats = report?.assembly_stats;
      const organism = report?.organism;
      const biosampleObj = report?.biosample;
      
      console.log('==============================================');
      console.log('Assembly Stats from Datasets:', assemblyStats);
      console.log('----------------------------------------------');
      console.log('FULL ESummary object:', summaryData);
      console.log('----------------------------------------------');
      console.log('Keys in ESummary root:', summaryData ? Object.keys(summaryData) : 'null');
      console.log('summaryData.Meta:', summaryData?.Meta);
      console.log('summaryData.Meta.Stats:', summaryData?.Meta?.Stats);
      
      // Log ALL properties that might contain stats
      if (summaryData) {
        console.log('--- Searching for stats in ESummary ---');
        const allKeys = Object.keys(summaryData);
        allKeys.forEach(key => {
          const value = summaryData[key];
          const keyLower = key.toLowerCase();
          if (keyLower.includes('length') || keyLower.includes('contig') || 
              keyLower.includes('scaffold') || keyLower.includes('gc') ||
              keyLower.includes('stat') || keyLower.includes('n50') || 
              keyLower.includes('l50') || keyLower.includes('coverage')) {
            console.log(`  ${key}:`, value);
          }
        });
        console.log('---------------------------------------');
      }
      
      console.log('==============================================');
      
      // Extract data from ESummary as fallback
      const taxid = organism?.tax_id || summaryData?.taxid || 'Unknown';
      const speciesName = organism?.organism_name || summaryData?.speciesname || 'Unknown';
      const biosampleAccession = biosampleObj?.accession || summaryData?.biosample?.accession || '';
      const assemblyName = assemblyInfo?.assembly_name || summaryData?.assemblyname || 'Unknown';
      const assemblyLevel = assemblyInfo?.assembly_level || summaryData?.assemblystatus || 'Unknown';
      const submissionDate = assemblyInfo?.release_date || summaryData?.seqreleasedate || 'Unknown';
      const lastUpdate = summaryData?.lastupdatedate || assemblyInfo?.release_date || 'Unknown';
      
      // Get BioSample data if available
      let bioSampleData = null;
      if (biosampleAccession) {
        bioSampleData = await fetchBioSampleData(biosampleAccession);
      }
      
      // Extract assembly statistics - The data is at ROOT LEVEL, not in Meta.Stats!
      // Search through ALL keys in summaryData for stats
      const stats = summaryData || {};
      
      console.log('=== EXTRACTION DEBUG ===');
      console.log('Searching in summaryData root for stats...');
      
      // Helper to find a value by searching for key variations
      const findValue = (keywords: string[]) => {
        if (!summaryData) return null;
        for (const keyword of keywords) {
          const key = Object.keys(summaryData).find(k => 
            k.toLowerCase() === keyword.toLowerCase() ||
            k.toLowerCase().replace(/_/g, '') === keyword.toLowerCase().replace(/_/g, '')
          );
          if (key && summaryData[key] !== null && summaryData[key] !== undefined) {
            console.log(`  Found ${keywords[0]} in key "${key}":`, summaryData[key]);
            return summaryData[key];
          }
        }
        return null;
      };
      
      // DIRECT EXTRACTION - ESummary has data at ROOT level and in XML meta field!
      // Root level has: scaffoldn50, contign50, coverage, etc.
      // meta field is an XML string with stats
      
      console.log('summaryData.contign50:', summaryData?.contign50);
      console.log('summaryData.scaffoldn50:', summaryData?.scaffoldn50);
      console.log('summaryData.coverage:', summaryData?.coverage);
      console.log('summaryData.meta (XML):', summaryData?.meta);
      
      // Parse meta XML string to extract stats
      let metaStats: any = {};
      if (summaryData?.meta && typeof summaryData.meta === 'string') {
        const metaXml = summaryData.meta;
        
        // Extract total_sequence_length
        const totalLengthMatch = metaXml.match(/<Stat category="total_sequence_length"[^>]*>(\d+)<\/Stat>/);
        if (totalLengthMatch) metaStats.total_length = totalLengthMatch[1];
        
        // Extract contig_count
        const contigCountMatch = metaXml.match(/<Stat category="contig_count"[^>]*>(\d+)<\/Stat>/);
        if (contigCountMatch) metaStats.contig_count = contigCountMatch[1];
        
        // Extract scaffold_count
        const scaffoldCountMatch = metaXml.match(/<Stat category="scaffold_count"[^>]*>(\d+)<\/Stat>/);
        if (scaffoldCountMatch) metaStats.scaffold_count = scaffoldCountMatch[1];
        
        // Extract contig_l50
        const contigL50Match = metaXml.match(/<Stat category="contig_l50"[^>]*>(\d+)<\/Stat>/);
        if (contigL50Match) metaStats.contig_l50 = contigL50Match[1];
        
        // Extract scaffold_l50
        const scaffoldL50Match = metaXml.match(/<Stat category="scaffold_l50"[^>]*>(\d+)<\/Stat>/);
        if (scaffoldL50Match) metaStats.scaffold_l50 = scaffoldL50Match[1];
        
        // Extract gc_percent
        const gcPercentMatch = metaXml.match(/<Stat category="gc_percent"[^>]*>([\d.]+)<\/Stat>/);
        if (gcPercentMatch) metaStats.gc_percent = gcPercentMatch[1];
        
        console.log('Parsed meta stats:', metaStats);
      }
      
      // Extract from parsed meta XML
      const totalLength = parseIntSafe(metaStats?.total_length) ||
                         parseIntSafe(assemblyStats?.total_sequence_length);
      
      const contigCount = parseIntSafe(metaStats?.contig_count) ||
                         parseIntSafe(assemblyStats?.number_of_contigs);
      
      const scaffoldCount = parseIntSafe(metaStats?.scaffold_count) ||
                           parseIntSafe(assemblyStats?.number_of_scaffolds) ||
                           contigCount;
      
      // N50 values are at root level: contign50, scaffoldn50 (no underscores!)
      const contigN50 = parseIntSafe(summaryData?.contign50) ||
                       parseIntSafe(metaStats?.contig_n50) ||
                       parseIntSafe(assemblyStats?.contig_n50);
      
      const scaffoldN50 = parseIntSafe(summaryData?.scaffoldn50) ||
                         parseIntSafe(metaStats?.scaffold_n50) ||
                         parseIntSafe(assemblyStats?.scaffold_n50) ||
                         contigN50;
      
      const contigL50 = parseIntSafe(summaryData?.contigl50) ||
                       parseIntSafe(metaStats?.contig_l50) ||
                       parseIntSafe(assemblyStats?.contig_l50);
      
      const scaffoldL50 = parseIntSafe(summaryData?.scaffoldl50) ||
                         parseIntSafe(metaStats?.scaffold_l50) ||
                         parseIntSafe(assemblyStats?.scaffold_l50) ||
                         contigL50;
      
      // GC percent from parsed meta XML
      const gcCount = parseIntSafe(metaStats?.gc_count) ||
                     parseIntSafe(assemblyStats?.gc_count);
      
      const gcPercent = parseFloatSafe(metaStats?.gc_percent) ||
                       parseFloatSafe(assemblyStats?.gc_percent) ||
                       (gcCount && totalLength ? (gcCount / totalLength) * 100 : null);
      
      // Coverage is at root level
      const coverage = summaryData?.coverage ||
                      assemblyStats?.genome_coverage;
      
      // Log extracted values for debugging
      console.log(`=== Extracted Values for ${accession} ===`);
      console.log('Total Length:', totalLength);
      console.log('Contig Count:', contigCount);
      console.log('Contig N50:', contigN50);
      console.log('Contig L50:', contigL50);
      console.log('Scaffold Count:', scaffoldCount);
      console.log('Scaffold N50:', scaffoldN50);
      console.log('Scaffold L50:', scaffoldL50);
      console.log('GC %:', gcPercent);
      console.log('Coverage:', coverage);
      
      // Construct the metadata object
      const assemblyData: NCBIAssemblyData = {
        accession,
        organism: {
          scientific_name: speciesName,
          common_name: organism?.common_name || summaryData?.commonname || organism?.infraspecific_name || 'Unknown',
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
          description: bioSampleData?.description || null,
          submitter: bioSampleData?.submitter || null,
          attributes: bioSampleData?.attributes || {}
        },
        assembly_metadata: {
          quality: assemblyInfo?.assembly_type || null,
          assembly_software: null, // Not readily available in standard APIs
          completeness: report?.checkm_info?.completeness || null,
          contamination: report?.checkm_info?.contamination || null
        },
        external_links: {
          ncbi: `https://www.ncbi.nlm.nih.gov/datasets/genome/${accession}/`,
          ena: `https://www.ebi.ac.uk/ena/browser/view/${accession.replace('GCF_', 'GCA_')}`
        },
        meta: {
          source: 'assembly',
          last_updated: new Date().toISOString()
        },
        raw_api_responses: {
          datasets: datasetsData,
          esummary: summaryData,
          biosample: bioSampleData
        }
      };
      
      metadata.push(assemblyData);
      console.log(`✓ Successfully fetched data for ${accession}`);
      
    } catch (error) {
      console.error(`Failed to fetch data for ${accession}:`, error);
      failed.push(accession);
    }
  }
  
  return {
    database: 'assembly',
    query: accessions,
    metadata,
    failed_accessions: failed,
    message: `${metadata.length} succeeded, ${failed.length} failed`
  };
}
