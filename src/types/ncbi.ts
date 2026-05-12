export interface NCBIAssemblyData {
  accession: string;
  organism: {
    scientific_name: string;
    common_name: string;
    tax_id: string;
  };
  assembly: {
    name: string;
    level: string;
    submission_date: string;
    last_update: string;
  };
  statistics: {
    genome_size_bp: number | null;
    genome_size_human: string | null;
    contigs: {
      count: number | null;
      n50: number | null;
      l50: number | null;
    };
    scaffolds: {
      count: number | null;
      n50: number | null;
      l50: number | null;
    };
    gc_percent: number | null;
    genome_coverage: string | null;
  };
  biosample: {
    accession: string;
    description: string | null;
    submitter: string | null;
    attributes: Record<string, any>;
  };
  assembly_metadata: {
    quality: string | null;
    assembly_software: string | null;
    completeness: number | null;
    contamination: number | null;
  };
  external_links: {
    ncbi: string;
    ena: string;
  };
  meta: {
    source: string;
    last_updated: string;
  };
  raw_api_responses?: {
    datasets?: any;
    esummary?: any;
    biosample?: any;
  };
}

export interface NCBIResponse {
  database: string;
  query: string[];
  metadata: NCBIAssemblyData[];
  failed_accessions: string[];
  message: string;
}
