# Debugging Null/N/A Values in NCBI Data

## Why Am I Still Seeing N/A Values?

Even with the corrected API implementation, you may still see N/A values. Here's why and how to investigate:

## 1. Data Not Available in NCBI Datasets API

### The Problem
The NCBI website (web interface) often displays MORE data than what's available through their APIs. The website scrapes data from multiple internal sources and databases, while the API only exposes a subset.

### Example
For accession `GCA_937870615` (your example):
- **ENA Website Shows**: Assembly software (MegaHit), Coverage (23x), all statistics
- **NCBI Datasets API Returns**: Limited subset of these fields

### Why This Happens
- APIs are designed for programmatic access and may lag behind web interface features
- Some metadata is stored in unstructured formats that APIs can't easily expose
- Different databases (ENA vs NCBI) have different metadata requirements

## 2. GenBank (GCA) vs RefSeq (GCF) Differences

### GenBank Assemblies (GCA_*)
- Submitted directly by researchers
- May have incomplete metadata
- Less stringent quality requirements
- More diverse range of data completeness

### RefSeq Assemblies (GCF_*)
- Curated by NCBI
- Generally more complete metadata
- Higher quality standards
- Better API coverage

**Tip**: If you have a GCA accession with missing data, check if there's a corresponding GCF version.

## 3. How to Debug Using This Tool

### Step 1: Check the Debug Panels
Each assembly card now includes "Debug: Raw API Responses" section. Expand it to see:

1. **NCBI Datasets API Response** - The primary data source
2. **E-utilities ESummary Response** - Fallback metadata
3. **BioSample Data** - Sample-specific information

### Step 2: Inspect the Raw JSON
Look for the specific field you're missing in the raw responses:

```json
{
  "reports": [{
    "assembly_stats": {
      "total_sequence_length": "16695881",  // ✅ Available
      "number_of_contigs": 1211,            // ✅ Available
      "contig_n50": 16526,                  // ✅ Available
      "genome_coverage": null               // ❌ Not in API
    }
  }]
}
```

### Step 3: Check Browser Console
Open your browser's Developer Tools (F12) and check the Console tab. You'll see:
- `Fetching from: https://api.ncbi.nlm.nih.gov/datasets/v2/genome/accession/XXX`
- `Datasets API response for XXX:` followed by the full JSON

## 4. Common Fields That May Be Missing

### Often Missing from API
- `genome_coverage` - Coverage depth (shows on website, not in API)
- `assembly_software` - Software used for assembly
- `biosample.description` - Detailed sample description
- `biosample.submitter` - Submitter organization details

### Usually Available
- `total_sequence_length` - Total genome size
- `number_of_contigs` - Contig count
- `contig_n50` / `scaffold_n50` - Assembly quality metrics
- `gc_percent` or `gc_count` - GC content

## 5. What This Tool Does to Minimize N/A

```
┌─────────────────────────────────────┐
│  1. NCBI Datasets API v2            │
│     Primary source for assembly     │
│     statistics                      │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  2. E-utilities ESummary            │
│     Fallback for missing metadata   │
│     (dates, biosample ID, etc)      │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  3. BioSample API                   │
│     Sample-specific information     │
│     (requires XML parsing)          │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  4. Intelligent Merging             │
│     Combines all sources            │
│     Uses first non-null value       │
└─────────────────────────────────────┘
```

## 6. Solutions When Data Is Missing

### Option A: Use the Website
For one-off queries, use the NCBI or ENA website directly:
- NCBI: https://www.ncbi.nlm.nih.gov/datasets/genome/{accession}/
- ENA: https://www.ebi.ac.uk/ena/browser/view/{accession}

### Option B: Web Scraping (Advanced)
If you need this data programmatically and it's not in the API, you may need to:
1. Fetch the HTML page
2. Parse the HTML to extract specific fields
3. Be respectful of rate limits

### Option C: Use Alternative APIs
- **ENA API**: Sometimes has different/more complete data
- **Assembly FTP**: Download assembly_report.txt for detailed stats

### Option D: Contact NCBI
If a field should be in the API but isn't:
- Email: info@ncbi.nlm.nih.gov
- Suggest API improvements on their GitHub

## 7. Specific Field Mapping

Here's where each field comes from in the current implementation:

| Field | Primary Source | Fallback | Notes |
|-------|---------------|----------|-------|
| Genome Size | `assembly_stats.total_sequence_length` | ESummary | Almost always available |
| Contig Count | `assembly_stats.number_of_contigs` | ESummary | Usually available |
| Contig N50 | `assembly_stats.contig_n50` | ESummary | Usually available |
| GC % | `assembly_stats.gc_percent` or calculated from `gc_count` | ESummary | Usually available |
| Coverage | ESummary | - | Often missing in API |
| Assembly Software | - | - | Not exposed in standard APIs |
| BioSample Description | BioSample XML | - | Requires XML parsing |

## 8. Example: Investigating GCA_937870615

Looking at your example accession `GCA_937870615`:

**What ENA Shows:**
```
Coverage: 23
Program: MegaHit
Total Length: 16695881
Contig Count: 1211
Contig N50: 16526
```

**What NCBI API Returns:**
```json
{
  "assembly_stats": {
    "total_sequence_length": "16695881",  // ✅
    "number_of_contigs": 1211,            // ✅
    "contig_n50": 16526,                  // ✅
    "gc_count": "XXXXX",                  // ✅
    // Coverage: NOT HERE                 // ❌
    // Assembly software: NOT HERE         // ❌
  }
}
```

**Conclusion**: The API provides the statistics but not the metadata like coverage and assembly software. This is a limitation of the API, not your code.

## 9. Testing Your Fixes

Use these test cases:

### Good Coverage (RefSeq)
- `GCF_000005845.2` - E. coli (expect most fields filled)
- `GCF_000001405.40` - Human (expect complete data)

### Limited Coverage (GenBank MAGs)
- `GCA_937870615` - Micromonas (expect some N/A)
- `GCA_000001` (older assemblies may have missing data)

## 10. Final Checklist

- [ ] Checked the Debug panels in the UI
- [ ] Looked at browser console for API responses
- [ ] Compared with NCBI website to confirm data exists
- [ ] Tried both GCA and GCF versions if available
- [ ] Understood which fields are simply not in the API

Remember: **If the data isn't in the raw API response shown in the debug panel, there's no way to extract it without web scraping or using alternative data sources.**
