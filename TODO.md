# MedVault TODO

## Completed
- Added VITE_API_URL environment variable in client/.env
- Updated client/src/services/api.js to use VITE_API_URL with fallback to proxy

## Next Steps
- Set client/.env to VITE_API_URL=https://afyalock.com
- Test: cd client && npm run dev
- Restart Vite dev server if running to load env vars
