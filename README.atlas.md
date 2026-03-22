# MongoDB Atlas Deploy Guide

**Node.js:**
1. Copy `.env.example` → `.env`  
2. Atlas URI → `MONGODB_URI=...`
3. `npm run dev` → connects Atlas

**PHP:**
1. Copy `config/.env.example` → `config/.env`  
2. Set `MONGODB_URI=...`
3. PHP files include config/.env → Atlas

**Verify Atlas:**
- Cluster → Browse → knowzilla/user_management collections
- Test register → new user doc

**Vercel (Node):** `vercel --prod` + env MONGODB_URI

No local mongod needed - pure Atlas! ✅
