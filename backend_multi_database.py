"""
NCBI Multi-Database Backend with MongoDB Caching
Supports: Assembly, Nucleotide, Gene, Protein, Taxonomy
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
import requests
from datetime import datetime
import time
import os
import re
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# MongoDB
MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
client = MongoClient(MONGODB_URI)
db = client.ncbi_cache

# Collections for each database
assemblies = db.assemblies
nucleotides = db.nucleotides
genes = db.genes
proteins = db.proteins
taxonomies = db.taxonomies

# Create indexes
assemblies.create_index('accession', unique=True)
nucleotides.create_index('accession', unique=True)
genes.create_index([('symbol', 1), ('tax_id', 1)], unique=True)
proteins.create_index('accession', unique=True)
taxonomies.create_index('tax_id', unique=True)

# Rate limiting
last_request_time = 0
MIN_REQUEST_INTERVAL = 0.35
NCBI_API_KEY = os.getenv('NCBI_API_KEY', '')

def rate_limited_request(url):
    """Make rate-limited request to NCBI"""
    global last_request_time
    current_time = time.time()
    time_since_last = current_time - last_request_time
    
    if time_since_last < MIN_REQUEST_INTERVAL:
        time.sleep(MIN_REQUEST_INTERVAL - time_since_last)
    
    if NCBI_API_KEY and 'ncbi.nlm.nih.gov' in url:
        separator = '&' if '?' in url else '?'
        url = f"{url}{separator}api_key={NCBI_API_KEY}"
    
    last_request_time = time.time()
    return requests.get(url, timeout=30)

def detect_database_type(query):
    """Auto-detect database type from query string"""
    query = query.strip()
    
    # Assembly accessions
    if re.match(r'^GC[FA]_\d+\.\d+$', query):
        return 'assembly'
    
    # Nucleotide accessions
    if re.match(r'^N[CGMRW]_\d+\.\d+$', query):
        return 'nucleotide'
    
    # Protein accessions
    if re.match(r'^[NYXWAZ]P_\d+\.\d+$', query):
        return 'protein'
    
    # Gene ID (numeric)
    if re.match(r'^\d+$', query):
        return 'gene'
    
    # Tax ID or gene symbol
    if query.isdigit():
        return 'taxonomy'
    
    # Gene symbol (letters, possibly with numbers)
    if re.match(r'^[A-Z][A-Z0-9\-]+$', query, re.IGNORECASE):
        return 'gene'
    
    # Organism name (spaces)
    if ' ' in query:
        return 'taxonomy'
    
    return 'unknown'

# ==================== ASSEMBLY ====================

@app.route('/api/assembly/<accession>', methods=['GET'])
def get_assembly(accession):
    """Fetch assembly data"""
    cached = assemblies.find_one({'accession': accession})
    if cached:
        print(f"✓ Cache HIT: assembly/{accession}")
        cached['_id'] = str(cached['_id'])
        cached['from_cache'] = True
        return jsonify(cached)
    
    print(f"⚠ Cache MISS: assembly/{accession}")
    
    try:
        # Your existing assembly fetch code here
        datasets_url = f"https://api.ncbi.nlm.nih.gov/datasets/v2/genome/accession/{accession}/dataset_report"
        datasets_resp = rate_limited_request(datasets_url)
        datasets_data = datasets_resp.json() if datasets_resp.ok else None
        
        search_url = f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=assembly&term={accession}&retmode=json"
        search_resp = rate_limited_request(search_url)
        search_data = search_resp.json()
        
        esummary_data = None
        if search_data.get('esearchresult', {}).get('idlist'):
            assembly_id = search_data['esearchresult']['idlist'][0]
            summary_url = f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=assembly&id={assembly_id}&retmode=json"
            summary_resp = rate_limited_request(summary_url)
            esummary_data = summary_resp.json().get('result', {}).get(assembly_id)
        
        result = {
            'accession': accession,
            'datasets_data': datasets_data,
            'esummary_data': esummary_data,
            'fetched_at': datetime.utcnow().isoformat(),
            'from_cache': False
        }
        
        assemblies.insert_one(result.copy())
        result['_id'] = str(result.get('_id', ''))
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e), 'accession': accession}), 500

# ==================== NUCLEOTIDE ====================

@app.route('/api/nucleotide/<accession>', methods=['GET'])
def get_nucleotide(accession):
    """Fetch nucleotide/sequence data"""
    cached = nucleotides.find_one({'accession': accession})
    if cached:
        print(f"✓ Cache HIT: nucleotide/{accession}")
        cached['_id'] = str(cached['_id'])
        cached['from_cache'] = True
        return jsonify(cached)
    
    print(f"⚠ Cache MISS: nucleotide/{accession}")
    
    try:
        # Search for UID
        search_url = f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=nuccore&term={accession}&retmode=json"
        search_resp = rate_limited_request(search_url)
        search_data = search_resp.json()
        
        if not search_data.get('esearchresult', {}).get('idlist'):
            return jsonify({'error': 'Accession not found', 'accession': accession}), 404
        
        uid = search_data['esearchresult']['idlist'][0]
        
        # Get summary
        summary_url = f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=nuccore&id={uid}&retmode=json"
        summary_resp = rate_limited_request(summary_url)
        summary_data = summary_resp.json().get('result', {}).get(uid, {})
        
        # Get detailed record (GenBank format in XML)
        fetch_url = f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=nuccore&id={uid}&rettype=gb&retmode=xml"
        fetch_resp = rate_limited_request(fetch_url)
        fetch_data = fetch_resp.text
        
        result = {
            'accession': accession,
            'esummary_data': summary_data,
            'efetch_data': fetch_data,
            'fetched_at': datetime.utcnow().isoformat(),
            'from_cache': False
        }
        
        nucleotides.insert_one(result.copy())
        result['_id'] = str(result.get('_id', ''))
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e), 'accession': accession}), 500

# ==================== GENE ====================

@app.route('/api/gene/symbol/<symbol>', methods=['GET'])
def get_gene_by_symbol(symbol):
    """Fetch gene data by symbol"""
    organism = request.args.get('organism', 'human')
    
    # Create cache key
    cache_key = f"{symbol}_{organism}"
    cached = genes.find_one({'cache_key': cache_key})
    if cached:
        print(f"✓ Cache HIT: gene/{symbol} ({organism})")
        cached['_id'] = str(cached['_id'])
        cached['from_cache'] = True
        return jsonify(cached)
    
    print(f"⚠ Cache MISS: gene/{symbol} ({organism})")
    
    try:
        # Try Datasets API first (better for genes)
        datasets_url = f"https://api.ncbi.nlm.nih.gov/datasets/v2/gene/symbol/{symbol}/taxon/{organism}/dataset_report"
        datasets_resp = rate_limited_request(datasets_url)
        datasets_data = datasets_resp.json() if datasets_resp.ok else None
        
        # Fallback to E-utilities
        search_term = f"{symbol}[Gene Name] AND {organism}[Organism]"
        search_url = f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=gene&term={search_term}&retmode=json"
        search_resp = rate_limited_request(search_url)
        search_data = search_resp.json()
        
        esummary_data = None
        if search_data.get('esearchresult', {}).get('idlist'):
            gene_id = search_data['esearchresult']['idlist'][0]
            summary_url = f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=gene&id={gene_id}&retmode=json"
            summary_resp = rate_limited_request(summary_url)
            esummary_data = summary_resp.json().get('result', {}).get(gene_id, {})
        
        result = {
            'cache_key': cache_key,
            'symbol': symbol,
            'organism': organism,
            'datasets_data': datasets_data,
            'esummary_data': esummary_data,
            'fetched_at': datetime.utcnow().isoformat(),
            'from_cache': False
        }
        
        genes.insert_one(result.copy())
        result['_id'] = str(result.get('_id', ''))
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e), 'symbol': symbol}), 500

@app.route('/api/gene/id/<gene_id>', methods=['GET'])
def get_gene_by_id(gene_id):
    """Fetch gene data by Gene ID"""
    cached = genes.find_one({'gene_id': gene_id})
    if cached:
        print(f"✓ Cache HIT: gene ID {gene_id}")
        cached['_id'] = str(cached['_id'])
        cached['from_cache'] = True
        return jsonify(cached)
    
    print(f"⚠ Cache MISS: gene ID {gene_id}")
    
    try:
        summary_url = f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=gene&id={gene_id}&retmode=json"
        summary_resp = rate_limited_request(summary_url)
        esummary_data = summary_resp.json().get('result', {}).get(gene_id, {})
        
        result = {
            'gene_id': gene_id,
            'esummary_data': esummary_data,
            'fetched_at': datetime.utcnow().isoformat(),
            'from_cache': False
        }
        
        genes.insert_one(result.copy())
        result['_id'] = str(result.get('_id', ''))
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e), 'gene_id': gene_id}), 500

# ==================== PROTEIN ====================

@app.route('/api/protein/<accession>', methods=['GET'])
def get_protein(accession):
    """Fetch protein data"""
    cached = proteins.find_one({'accession': accession})
    if cached:
        print(f"✓ Cache HIT: protein/{accession}")
        cached['_id'] = str(cached['_id'])
        cached['from_cache'] = True
        return jsonify(cached)
    
    print(f"⚠ Cache MISS: protein/{accession}")
    
    try:
        search_url = f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=protein&term={accession}&retmode=json"
        search_resp = rate_limited_request(search_url)
        search_data = search_resp.json()
        
        if not search_data.get('esearchresult', {}).get('idlist'):
            return jsonify({'error': 'Protein not found', 'accession': accession}), 404
        
        uid = search_data['esearchresult']['idlist'][0]
        
        summary_url = f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=protein&id={uid}&retmode=json"
        summary_resp = rate_limited_request(summary_url)
        summary_data = summary_resp.json().get('result', {}).get(uid, {})
        
        result = {
            'accession': accession,
            'esummary_data': summary_data,
            'fetched_at': datetime.utcnow().isoformat(),
            'from_cache': False
        }
        
        proteins.insert_one(result.copy())
        result['_id'] = str(result.get('_id', ''))
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e), 'accession': accession}), 500

# ==================== TAXONOMY ====================

@app.route('/api/taxonomy/<name_or_id>', methods=['GET'])
def get_taxonomy(name_or_id):
    """Fetch taxonomy data by name or Tax ID"""
    cached = taxonomies.find_one({'query': name_or_id})
    if cached:
        print(f"✓ Cache HIT: taxonomy/{name_or_id}")
        cached['_id'] = str(cached['_id'])
        cached['from_cache'] = True
        return jsonify(cached)
    
    print(f"⚠ Cache MISS: taxonomy/{name_or_id}")
    
    try:
        search_url = f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=taxonomy&term={name_or_id}&retmode=json"
        search_resp = rate_limited_request(search_url)
        search_data = search_resp.json()
        
        if not search_data.get('esearchresult', {}).get('idlist'):
            return jsonify({'error': 'Taxonomy not found', 'query': name_or_id}), 404
        
        tax_id = search_data['esearchresult']['idlist'][0]
        
        summary_url = f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=taxonomy&id={tax_id}&retmode=json"
        summary_resp = rate_limited_request(summary_url)
        summary_data = summary_resp.json().get('result', {}).get(tax_id, {})
        
        result = {
            'query': name_or_id,
            'tax_id': tax_id,
            'esummary_data': summary_data,
            'fetched_at': datetime.utcnow().isoformat(),
            'from_cache': False
        }
        
        taxonomies.insert_one(result.copy())
        result['_id'] = str(result.get('_id', ''))
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e), 'query': name_or_id}), 500

# ==================== SMART SEARCH ====================

@app.route('/api/search', methods=['POST'])
def smart_search():
    """Auto-detect database and search"""
    query = request.json.get('query', '')
    database = detect_database_type(query)
    
    if database == 'assembly':
        return get_assembly(query)
    elif database == 'nucleotide':
        return get_nucleotide(query)
    elif database == 'protein':
        return get_protein(query)
    elif database == 'gene':
        if query.isdigit():
            return get_gene_by_id(query)
        else:
            return get_gene_by_symbol(query)
    elif database == 'taxonomy':
        return get_taxonomy(query)
    else:
        return jsonify({'error': 'Could not detect database type', 'query': query}), 400

# ==================== UTILITY ====================

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'databases': {
            'assemblies': assemblies.count_documents({}),
            'nucleotides': nucleotides.count_documents({}),
            'genes': genes.count_documents({}),
            'proteins': proteins.count_documents({}),
            'taxonomies': taxonomies.count_documents({})
        }
    })

@app.route('/api/detect/<query>', methods=['GET'])
def detect_db(query):
    """Detect which database a query belongs to"""
    return jsonify({
        'query': query,
        'detected_database': detect_database_type(query)
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)
