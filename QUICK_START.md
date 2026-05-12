# 🚀 Quick Start - 3 Steps to Deploy

## Step 1: Deploy Backend (5 minutes)

```bash
# 1. Copy the backend code from COMPLETE_SETUP.md into app.py
# 2. Create requirements.txt
# 3. Push to GitHub
git add .
git commit -m "Backend with MongoDB cache"
git push

# 4. Go to Render.com
#    - New Web Service
#    - Connect GitHub repo
#    - Add environment variables:
#      MONGODB_URI=mongodb+srv://your_atlas_connection
#      NCBI_API_KEY=your_educational_key
#    - Deploy!

# 5. Copy your Render URL: https://your-app.onrender.com
```

## Step 2: Configure Frontend (2 minutes)

```bash
# Create .env file
echo "VITE_BACKEND_URL=https://your-app.onrender.com" > .env
echo "VITE_USE_BACKEND=true" >> .env

# Test locally
npm install
npm run dev
```

## Step 3: Deploy Frontend (3 minutes)

```bash
# Build
npm run build

# Deploy to GitHub Pages
npm install -g gh-pages
gh-pages -d dist

# Or manually upload dist/index.html to your GitHub Pages repo
```

## ✅ Verification

1. **Open your site**: `https://yourusername.github.io/repo-name/`
2. **You should see**: Green badge "Backend API + MongoDB Cache"
3. **Search**: `GCF_000005845.2`
4. **First time**: Takes 2-3 seconds (fetching from NCBI)
5. **Second time**: INSTANT! (from MongoDB cache)
6. **Console shows**: `✅ Cache HIT for GCF_000005845.2 (instant result!)`

## 🎉 Done!

Now you have a **production-ready** app with:
- Beautiful React UI
- MongoDB caching
- NCBI-safe rate limiting
- Educational account protected

---

## 🆘 Need Help?

### Backend not responding?
Check Render logs for errors

### Frontend showing "Direct NCBI Calls"?
Make sure .env has `VITE_USE_BACKEND=true` and rebuild

### MongoDB errors?
Verify MONGODB_URI in Render environment variables

### Still getting null values?
Open browser console (F12) and check what backend returns
