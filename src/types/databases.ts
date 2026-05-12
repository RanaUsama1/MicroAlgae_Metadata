// Common metadata
export interface CommonMeta {
  source: string;
  last_updated: string;
  from_cache?: boolean;
}

// Nucleotide (mRNA, chromosomes, etc.)
export interface NucleotideData {
  accession: string;
  title: string;
  organism: {
    scientific_name: string;
    common_name: string;
    tax_id: string;
  };
  sequence: {
    length: number;
    moltype: string; // mRNA, genomic DNA, etc.
    topology: string; // linear, circular
  };
  gene: {
    symbol: string | null;
    synonyms: string[];
    chromosome: string | null;
    map_location: string | null;
  };
  cds: {
    start: number | null;
    end: number | null;
    protein_accession: string | null;
    translation_length: number | null;
  } | null;
  dates: {
    create_date: string;
    update_date: string;
  };
  references: {
    pubmed_ids: string[];
  };
  external_links: {
    ncbi: string;
    gene_link: string | null;
    protein_link: string | null;
  };
  meta: CommonMeta;
  raw_api_responses?: {
    esummary?: any;
    efetch?: any;
  };
}

// Gene database
export interface GeneData {
  gene_id: string;
  symbol: string;
  description: string;
  organism: {
    scientific_name: string;
    common_name: string;
    tax_id: string;
  };
  location: {
    chromosome: string;
    map_location: string;
    genomic_range: {
      start: number;
      end: number;
      strand: string;
    } | null;
  };
  gene_type: string; // protein-coding, ncRNA, etc.
  transcripts: {
    accession: string;
    protein_accession: string | null;
    length: number;
  }[];
  aliases: string[];
  summary: string | null;
  external_links: {
    ncbi: string;
    omim: string | null;
    ensembl: string | null;
  };
  meta: CommonMeta;
  raw_api_responses?: {
    esummary?: any;
    datasets?: any;
  };
}

// Protein database
export interface ProteinData {
  accession: string;
  title: string;
  organism: {
    scientific_name: string;
    tax_id: string;
  };
  sequence: {
    length: number; // amino acids
    molecular_weight: number | null;
  };
  gene: {
    symbol: string | null;
    gene_id: string | null;
  };
  coding_sequence: {
    nucleotide_accession: string | null;
  };
  dates: {
    create_date: string;
    update_date: string;
  };
  external_links: {
    ncbi: string;
    gene_link: string | null;
  };
  meta: CommonMeta;
  raw_api_responses?: {
    esummary?: any;
  };
}

// Taxonomy database
export interface TaxonomyData {
  tax_id: string;
  scientific_name: string;
  common_name: string | null;
  rank: string; // species, genus, family, etc.
  lineage: {
    rank: string;
    name: string;
    tax_id: string;
  }[];
  genetic_code: {
    id: number;
    name: string;
  };
  mitochondrial_genetic_code: {
    id: number;
    name: string;
  } | null;
  external_links: {
    ncbi: string;
  };
  meta: CommonMeta;
  raw_api_responses?: {
    esummary?: any;
  };
}

// Database type enum
export type DatabaseType = 'assembly' | 'nucleotide' | 'gene' | 'protein' | 'taxonomy';

// Discriminated union for all database results
export type DatabaseResult = 
  | { database: 'assembly'; data: import('./ncbi').NCBIAssemblyData }
  | { database: 'nucleotide'; data: NucleotideData }
  | { database: 'gene'; data: GeneData }
  | { database: 'protein'; data: ProteinData }
  | { database: 'taxonomy'; data: TaxonomyData };

// Generic search response
export interface UnifiedSearchResponse {
  database: DatabaseType;
  query: string;
  results: DatabaseResult[];
  failed: string[];
  message: string;
  from_cache?: boolean;
}
