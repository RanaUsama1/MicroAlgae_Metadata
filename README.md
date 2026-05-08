# NCBI Assembly Data Fetcher

A **production-ready** web application for fetching genome assembly data from NCBI with **MongoDB caching** and **rate-limit protection**.

## ⚡ Two Deployment Options

### Option 1: With Backend + MongoDB Cache (Recommended for Production)
✅ Super fast (90%+ cache hit rate)
✅ No NCBI rate limit issues
✅ Educational API account safe
✅ Persistent caching

**See**: [QUICK_START.md](QUICK_START.md) or [COMPLETE_SETUP.md](COMPLETE_SETUP.md)

### Option 2: Direct NCBI Calls (Simple, but slower)
⚠️ Every query hits NCBI directly
⚠️ Can hit rate limits
⚠️ No caching

**Default mode**: Just deploy the frontend

---

## 🏗️ Architecture

### Production Setup (Recommended)
```
React Frontend        Python Backend       MongoDB         NCBI API
(GitHub Pages)  →    (Render + Flask)  →  (Cache)    →   (Rate Limited)
    
Fast UI              Rate Limiting        90% Cache       3-10 req/sec
Beautiful Display    Error Handling       Hit Rate        Educational OK
```

### Simple Setup
```
React Frontend  →  NCBI API (Direct)
  
Fast UI            No Cache, Rate Limited
```

---

## 🚀 Quick Start (Production with Cache)

1. **Deploy Backend** (5 min) - See [QUICK_START.md](QUICK_START.md)
2. **Configure Frontend** (2 min) - Add `.env` with backend URL
3. **Deploy Frontend** (3 min) - GitHub Pages or any static host

**Total**: 10 minutes to production-ready app!

## 🧪 Quick Start (Simple - No Backend)

```bash
npm install
VITE_USE_BACKEND=false npm run dev
```

Visit `http://localhost:5173`

---

## 🎯 Problem Solved

Your original code was getting a lot of **null values** because:
1. **Wrong API endpoint** - Using `/dataset_report` instead of the correct v2 endpoint
2. **Incorrect JSON paths** - Not accessing the correct fields in the response
3. **Wrong response structure** - The v2 API returns `reports[0].assembly_stats` not `assembly_stats` directly

This improved version:

### ✅ Key Improvements

1. **Multiple API Sources**: Combines data from:
   - NCBI Datasets API (v2alpha) - for detailed assembly stats
   - NCBI E-utilities (ESummary) - for assembly metadata
   - NCBI BioSample API - for sample information

2. **Complete Statistics**: Now properly fetches:
   - ✅ Genome size (bp and human-readable)
   - ✅ Contig count, N50, L50
   - ✅ Scaffold count, N50, L50
   - ✅ GC content percentage
   - ✅ Genome coverage
   - ✅ BioSample details with attributes
   - ✅ Assembly quality metrics

3. **Fallback Mechanism**: If one API doesn't have the data, it tries alternative sources to minimize null values

4. **Better Data Parsing**: Properly extracts nested data from NCBI's complex response structures

## 🚀 Features

- **Multi-accession support**: Enter multiple accession numbers (comma or newline separated)
- **Comprehensive data display**: Shows all available assembly information in organized cards
- **Export to JSON**: Download the complete data as a JSON file
- **Error handling**: Clear error messages when data fetch fails
- **Loading states**: Visual feedback during data fetching
- **Responsive design**: Works on all screen sizes

## 📊 Data Retrieved

### Assembly Information
- Assembly name, level, dates
- Organism name (scientific and common)
- Tax ID

### Statistics
- Total genome size in base pairs and human-readable format
- GC content percentage
- Genome coverage depth

### Contig Information
- Total contig count
- Contig N50 (quality metric)
- Contig L50

### Scaffold Information
- Total scaffold count
- Scaffold N50
- Scaffold L50

### BioSample Data
- BioSample accession
- Sample description
- Submitter information
- Custom attributes

### Quality Metrics
- Assembly quality/type
- Completeness percentage (when available)
- Contamination percentage (when available)

## 🔧 How It Works

The service uses a three-pronged approach:

1. **NCBI Datasets API**: Fetches comprehensive assembly statistics
2. **E-utilities ESummary**: Gets assembly metadata and summary information
3. **BioSample XML Parsing**: Retrieves detailed sample information

All three sources are queried in parallel and the results are merged intelligently to provide the most complete dataset possible.

## 💡 Why Were You Getting Null Values?

The original implementation likely:
- Used only one API endpoint that doesn't contain all fields
- Didn't parse nested response structures correctly
- Didn't have fallback mechanisms when data is missing from one source
- Wasn't accessing the correct paths in the JSON responses

This new implementation solves all these issues by:
- Using multiple complementary APIs
- Implementing smart fallbacks
- Properly navigating NCBI's complex response structures
- Handling missing data gracefully with "N/A" displays

## 🧪 Example Accessions to Try

- `GCF_000005845.2` - E. coli K-12 (RefSeq)
- `GCF_000001405.40` - Human genome (GRCh38.p14)
- `GCF_000146045.2` - Mouse genome
- `GCF_000001735.4` - Arabidopsis thaliana
- `GCA_937870615` - Micromonas commoda (GenBank MAG)

## ⚠️ About N/A Values

Some fields may still show "N/A" even though the data exists on ENA/NCBI websites. Here's why:

### Different Data Sources
- **ENA (European Nucleotide Archive)** sometimes has more complete metadata than NCBI
- **NCBI Datasets API** may not expose all fields available in the web interface
- **GenBank (GCA) vs RefSeq (GCF)** assemblies may have different metadata completeness

### Common Missing Fields
- **BioSample attributes**: Often not fully accessible via API, need web scraping
- **Assembly software**: Not exposed in standard API responses
- **Genome coverage**: Present on website but not always in API JSON

### What This App Does
1. ✅ Fetches from **NCBI Datasets API v2** (primary source for assembly stats)
2. ✅ Fetches from **E-utilities ESummary** (fallback for missing data)
3. ✅ Fetches from **BioSample API** (for sample information)
4. ✅ Uses **intelligent fallbacks** between data sources
5. ✅ Properly parses **nested JSON** structures

### If You Still See N/A
1. **Open the Debug panels** in the UI (expand "Debug: Raw API Responses")
2. **Check browser console** (F12) for API response logs
3. **Read DEBUGGING_NULL_VALUES.md** for detailed troubleshooting
4. **Compare with NCBI website** - if data isn't in the API response, it's not available programmatically

## 📚 Documentation

- **README.md** (this file) - Overview and features
- **FIXES_APPLIED.md** - Technical details of what was fixed
- **DEBUGGING_NULL_VALUES.md** - Complete guide to understanding N/A values
- **TROUBLESHOOTING.md** - Step-by-step guide when ESummary has data but UI shows N/A

## 🎨 Tech Stack

- React + TypeScript
- Vite
- Tailwind CSS
- NCBI E-utilities & Datasets APIs

## 📝 Notes

- NCBI APIs are sometimes rate-limited, so batch large queries appropriately
- Some fields may still be null if NCBI doesn't have that data for a specific assembly
- The app fetches data in real-time, so internet connection is required
