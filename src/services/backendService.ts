import { BACKEND_API_URL } from '../config';
import type { DatabaseType, UnifiedSearchResponse, DatabaseResult } from '../types/databases';
import { parseBackendResponse } from './parserFactory';

/**
 * Fetch data from backend for ANY database type
 */
export async function fetchFromBackend(
  database: DatabaseType,
  query: string,
  options?: { organism?: string; searchType?: string }
): Promise<UnifiedSearchResponse> {
  try {
    // Build endpoint based on database type
    let endpoint = '';
    switch (database) {
      case 'assembly':
        endpoint = `${BACKEND_API_URL}/api/assembly/${query}`;
        break;
      case 'nucleotide':
        endpoint = `${BACKEND_API_URL}/api/nucleotide/${query}`;
        break;
      case 'gene':
        if (options?.searchType === 'id') {
          endpoint = `${BACKEND_API_URL}/api/gene/id/${query}`;
        } else {
          const organism = options?.organism || 'human';
          endpoint = `${BACKEND_API_URL}/api/gene/symbol/${query}?organism=${organism}`;
        }
        break;
      case 'protein':
        endpoint = `${BACKEND_API_URL}/api/protein/${query}`;
        break;
      case 'taxonomy':
        endpoint = `${BACKEND_API_URL}/api/taxonomy/${encodeURIComponent(query)}`;
        break;
    }

    console.log(`🔄 Fetching ${database}/${query} from backend: ${endpoint}`);
    
    const response = await fetch(endpoint);
    
    if (!response.ok) {
      throw new Error(`Backend error: ${response.status} ${response.statusText}`);
    }
    
    const backendData = await response.json();
    
    // Check if from cache
    if (backendData.from_cache) {
      console.log(`✅ Cache HIT for ${query} (instant result!)`);
    } else {
      console.log(`⚠️  Cache MISS for ${query} (fetched from NCBI)`);
    }
    
    // Check for errors in backend response
    if (backendData.error) {
      throw new Error(backendData.error);
    }
    
    // Parse the backend response using factory
    const parsedResult: DatabaseResult = parseBackendResponse(database, backendData);
    
    return {
      database,
      query,
      results: [parsedResult],
      failed: [],
      message: 'Success',
      from_cache: backendData.from_cache
    };
    
  } catch (error) {
    console.error(`❌ Error fetching ${database}/${query}:`, error);
    return {
      database,
      query,
      results: [],
      failed: [query],
      message: error instanceof Error ? error.message : 'Unknown error',
      from_cache: false
    };
  }
}
