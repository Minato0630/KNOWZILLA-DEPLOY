# Knowzilla Node.js/MongoDB/Vercel

## Run Local (VSCode)
1. `npm install`
2. Copy .env.example → .env, add MongoDB Atlas URI

3. `npm start` or `npm run dev`
4. http://localhost:3000/index.html

## Deploy Vercel
1. vercel login
2. vercel --prod

## API Endpoints
- POST /api/register (JSON user data)
- POST /api/login (JSON {registration_no, password})
- GET /api/session (current user or null)
- POST /api/logout 
- POST /api/contact/review/subscribe
- GET /api/reviews

**Auth flow:** Login/Register → session cookie → /api/session shows "Welcome, name"

**Test:** http://localhost:3000/login.html
Reg: TEST123 / testpass123

Frontend updated: login errors fixed, index shows welcome/logout.
