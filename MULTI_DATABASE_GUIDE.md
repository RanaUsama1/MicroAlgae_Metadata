# 🔬 Multi-Database NCBI Search Guide

## 📚 Supported Databases

### 1. Assembly (Current - Working ✅)
**Search by**: GCF_, GCA_ accessions
**Example**: `GCF_000005845.2`
**Returns**: Genome assembly metadata, statistics

### 2. Nucleotide (NEW 🆕)
**Search by**:
- Accession: `NM_007294.4` (BRCA1 mRNA)
- Accession: `NC_000017.11` (Human chromosome 17)
- Gene name: `BRCA1`
- Organism + gene: `human BRCA1`

**Returns**: 
- Sequence metadata
- Gene features
- Coding regions (CDS)
- Exons/Introns
- Sequence length
- Organism info

### 3. Gene (NEW 🆕)
**Search by**:
- Gene symbol: `BRCA1`, `TP53`, `EGFR`
- Gene ID: `672` (BRCA1 gene ID)
- Organism + symbol: `human BRCA1`

**Returns**:
- Gene information
- Chromosome location
- Transcripts (mRNA variants)
- Protein products
- Function/description
- Aliases

### 4. Protein (NEW 🆕)
**Search by**: 
- Accession: `NP_009225.1`
- Protein name

**Returns**:
- Protein metadata
- Amino acid sequence
- Molecular weight
- Function

### 5. Taxonomy (NEW 🆕)
**Search by**:
- Organism name: `Escherichia coli`
- Tax ID: `562`

**Returns**:
- Taxonomy hierarchy
- Scientific name
- Common name
- Lineage

---

## 🏗️ Architecture

```
Frontend UI
    ↓
Database Selector (Assembly/Nucleotide/Gene/Protein/Taxonomy)
    ↓
Search Input (Accession/Name/Symbol)
    ↓
Backend API Endpoints:
    /api/assembly/<accession>
    /api/nucleotide/<accession>
    /api/gene/<symbol>
    /api/protein/<accession>
    /api/taxonomy/<name>
    ↓
MongoDB Cache (per database)
    ↓
NCBI APIs:
    - E-utilities (esearch, esummary, efetch)
    - Datasets API v2
```

---

## 🔍 NCBI API Endpoints

### Nucleotide
```
# Search by accession
https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=nuccore&id=<uid>&retmode=json

# Fetch sequence
https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=nuccore&id=<uid>&rettype=gb&retmode=xml

# Datasets API (for some nucleotide records)
https://api.ncbi.nlm.nih.gov/datasets/v2/gene/accession/<accession>/dataset_report
```

### Gene
```
# Search by symbol
https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=gene&term=BRCA1[Gene%20Name]+AND+human[Organism]&retmode=json

# Get gene info
https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=gene&id=<gene_id>&retmode=json

# Datasets API (better for genes)
https://api.ncbi.nlm.nih.gov/datasets/v2/gene/symbol/BRCA1/taxon/human/dataset_report
```

### Protein
```
# Similar to nucleotide but db=protein
https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=protein&id=<uid>&retmode=json
```

### Taxonomy
```
# Search by name
https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=taxonomy&term=Escherichia+coli&retmode=json

# Get taxonomy info
https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=taxonomy&id=<tax_id>&retmode=json
```

---

## 📊 Data Fields by Database

### Nucleotide Record
```json
{
  "accession": "NM_007294.4",
  "title": "Homo sapiens BRCA1 DNA repair associated (BRCA1), transcript variant 1, mRNA",
  "organism": "Homo sapiens",
  "sequence_length": 7258,
  "moltype": "mRNA",
  "gene": "BRCA1",
  "chromosome": "17",
  "cds": {
    "start": 232,
    "end": 5825,
    "protein_accession": "NP_009225.1"
  },
  "exons": [...],
  "create_date": "1997/02/03",
  "update_date": "2024/01/15"
}
```

### Gene Record
```json
{
  "gene_id": "672",
  "symbol": "BRCA1",
  "description": "BRCA1 DNA repair associated",
  "organism": "Homo sapiens",
  "chromosome": "17",
  "map_location": "17q21.31",
  "type": "protein-coding",
  "transcripts": [
    {
      "accession": "NM_007294.4",
      "protein": "NP_009225.1"
    }
  ],
  "aliases": ["BRCAI", "BRCC1", "RNF53"],
  "summary": "Full gene description..."
}
```

---

## 🚀 Implementation Plan

### Phase 1: Backend Updates
1. Add endpoints for each database
2. MongoDB collections per database
3. Database-specific parsers

### Phase 2: Frontend Updates
1. Database selector dropdown
2. Smart search input (detects accession type)
3. Database-specific result cards
4. Unified search interface

### Phase 3: Features
1. Cross-database linking
2. Sequence viewer
3. Gene location visualizer
4. Export in multiple formats

---

## 💡 Smart Search Feature

Detect what user is searching for:

```
GCF_000005845.2   → Assembly
GCA_019044685.2   → Assembly
NM_007294.4       → Nucleotide (mRNA)
NC_000017.11      → Nucleotide (Chromosome)
NG_005905.2       → Nucleotide (Gene)
NP_009225.1       → Protein
672               → Gene ID
BRCA1             → Gene Symbol
Escherichia coli  → Taxonomy
```

---

## 🎨 UI Design

```
┌─────────────────────────────────────────────┐
│  NCBI Multi-Database Search                  │
├─────────────────────────────────────────────┤
│  Database: [Assembly ▼] [Nucleotide] [Gene] │
│                                              │
│  Search: [GCF_000005845.2 or BRCA1    ] 🔍  │
│                                              │
│  Or search by:                               │
│  ○ Accession  ○ Gene Symbol  ○ Organism     │
└─────────────────────────────────────────────┘

Results:
┌─────────────────────────────────────────────┐
│  🧬 BRCA1 - DNA Repair Associated           │
│  Gene ID: 672 | Chromosome: 17q21.31        │
│  Organism: Homo sapiens (human)             │
│                                              │
│  📊 Transcripts: 3 variants                  │
│  🧪 Protein Products: 3 isoforms            │
│  📍 Location: chr17:43,044,295-43,125,364   │
└─────────────────────────────────────────────┘
```

---

## 🔧 Backend Code Structure

```python
# backend/app.py

@app.route('/api/nucleotide/<accession>', methods=['GET'])
def get_nucleotide(accession):
    # Check cache
    cached = db.nucleotide.find_one({'accession': accession})
    if cached:
        return jsonify(cached)
    
    # Fetch from NCBI
    data = fetch_nucleotide_from_ncbi(accession)
    
    # Cache and return
    db.nucleotide.insert_one(data)
    return jsonify(data)

@app.route('/api/gene/symbol/<symbol>', methods=['GET'])
def get_gene_by_symbol(symbol):
    organism = request.args.get('organism', 'human')
    # Similar pattern...

@app.route('/api/search', methods=['POST'])
def smart_search():
    query = request.json['query']
    database = detect_database_type(query)  # Auto-detect
    # Route to appropriate handler
```

---

## 📝 Next Steps

I'll now create:
1. ✅ Types for all databases
2. ✅ Backend endpoints for nucleotide/gene/protein
3. ✅ Frontend database selector
4. ✅ Result cards for each database type
5. ✅ Smart search detection

Ready to implement? Let me know which database you want first!

**Recommendation**: Start with **Nucleotide + Gene** as they're most commonly used together.
