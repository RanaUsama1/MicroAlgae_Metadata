# Deployment Guide: React Frontend + Python Backend + MongoDB

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│  GitHub Pages (Frontend)                                     │
│  - React + TypeScript + Tailwind                            │
│  - Calls YOUR backend API                                   │
│  - Fast UI, no direct NCBI calls                            │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ↓ HTTPS
┌─────────────────────────────────────────────────────────────┐
│  Render (Backend - app.py)                                   │
│  - Receives accession requests                              │
│  - Checks MongoDB cache first                               │
│  - Calls NCBI API if not cached                             │
│  - Stores results in MongoDB                                │
│  - Returns data to frontend                                 │
└─────────────────┬───────────────────────────────────────────┘
                  │
        ┌─────────┴─────────┐
        ↓                   ↓
┌──────────────┐    ┌──────────────┐
│   MongoDB    │    │   NCBI API   │
│   (Cache)    │    │ (Rate limited)│
└──────────────┘    └──────────────┘
```

## Benefits

1. ✅ **No NCBI blocking** - All requests go through your backend with rate limiting
2. ✅ **Super fast** - MongoDB caching means instant results for repeated queries
3. ✅ **Professional** - Beautiful React UI + robust Python backend
4. ✅ **Scalable** - Backend can handle rate limiting, retries, error handling
5. ✅ **Educational account safe** - Your backend controls all NCBI API calls

## Step 1: Update Your Backend (app.py)

Your backend should expose this endpoint:

```python
# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
import requests
from datetime import datetime
import time

app = Flask(__name__)
CORS(app)  # Allow frontend to call your API

# MongoDB setup
client = MongoClient("your_mongodb_connection_string")
db = client.ncbi_cache
assemblies = db.assemblies

# Rate limiting (NCBI allows 3 requests/second without API key, 10 with key)
last_request_time = 0
MIN_REQUEST_INTERVAL = 0.35  # 350ms between requests (safe for 3 req/sec)

def rate_limited_request(url):
    """Make rate-limited request to NCBI"""
    global last_request_time
    current_time = time.time()
    time_since_last = current_time - last_request_time
    
    if time_since_last < MIN_REQUEST_INTERVAL:
        time.sleep(MIN_REQUEST_INTERVAL - time_since_last)
    
    last_request_time = time.time()
    return requests.get(url, timeout=30)

@app.route('/api/assembly/<accession>', methods=['GET'])
def get_assembly(accession):
    """Fetch assembly data - from cache or NCBI"""
    
    # Check cache first
    cached = assemblies.find_one({'accession': accession})
    if cached:
        print(f"✓ Cache HIT for {accession}")
        cached['_id'] = str(cached['_id'])  # Convert ObjectId to string
        cached['from_cache'] = True
        return jsonify(cached)
    
    print(f"⚠ Cache MISS for {accession} - fetching from NCBI...")
    
    try:
        # Fetch from NCBI Datasets API
        datasets_url = f"https://api.ncbi.nlm.nih.gov/datasets/v2/genome/accession/{accession}/dataset_report"
        datasets_response = rate_limited_request(datasets_url)
        datasets_data = datasets_response.json() if datasets_response.ok else None
        
        # Fetch from ESummary API
        search_url = f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=assembly&term={accession}&retmode=json"
        search_response = rate_limited_request(search_url)
        search_data = search_response.json()
        
        esummary_data = None
        if search_data.get('esearchresult', {}).get('idlist'):
            assembly_id = search_data['esearchresult']['idlist'][0]
            summary_url = f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=assembly&id={assembly_id}&retmode=json"
            summary_response = rate_limited_request(summary_url)
            esummary_data = summary_response.json().get('result', {}).get(assembly_id)
        
        # Combine data
        result = {
            'accession': accession,
            'datasets_data': datasets_data,
            'esummary_data': esummary_data,
            'fetched_at': datetime.utcnow().isoformat(),
            'from_cache': False
        }
        
        # Store in MongoDB
        assemblies.insert_one(result.copy())
        result['_id'] = str(result.get('_id'))
        
        print(f"✓ Successfully fetched and cached {accession}")
        return jsonify(result)
        
    except Exception as e:
        print(f"✗ Error fetching {accession}: {str(e)}")
        return jsonify({'error': str(e), 'accession': accession}), 500

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'timestamp': datetime.utcnow().isoformat()})

if __name__ == '__main__':
    app.run(debug=True)
```

## Step 2: Update Frontend to Call Your Backend

I'll modify the React code to call YOUR backend instead of NCBI directly.

## Step 3: Environment Variables

Create `.env` file for backend:

```env
MONGODB_URI=your_mongodb_connection_string
NCBI_API_KEY=your_educational_api_key  # Optional but recommended
FLASK_ENV=production
PORT=5000
```

## Step 4: Deploy Backend to Render

1. Push `app.py` to GitHub
2. In Render dashboard:
   - Create new Web Service
   - Connect GitHub repo
   - Set environment variables
   - Deploy

## Step 5: Deploy Frontend to GitHub Pages

1. Update `BACKEND_URL` in frontend code
2. Build: `npm run build`
3. Deploy `dist` folder to GitHub Pages

## NCBI Rate Limits

### Without API Key
- **3 requests per second**
- **Educational use allowed**

### With API Key (Recommended)
- **10 requests per second**
- Get free key at: https://www.ncbi.nlm.nih.gov/account/

### Best Practices
1. ✅ Use MongoDB caching (90%+ cache hit rate)
2. ✅ Implement rate limiting in backend
3. ✅ Add delays between requests
4. ✅ Handle 429 (Too Many Requests) errors with retry
5. ✅ Use your API key in backend

## Advantages Over Direct NCBI Calls

| Direct NCBI | Your Backend + Cache |
|-------------|---------------------|
| ❌ Rate limited per user | ✅ Centralized rate limiting |
| ❌ No caching | ✅ MongoDB caching |
| ❌ Slow repeated queries | ✅ Instant cache hits |
| ❌ Browser CORS issues | ✅ No CORS problems |
| ❌ Exposed API calls | ✅ Backend controls everything |

## Next Steps

1. I'll modify the React frontend to call your backend
2. You update your `app.py` with the code above
3. Test locally first
4. Deploy backend to Render
5. Deploy frontend to GitHub Pages
6. Enjoy fast, cached results! 🚀
