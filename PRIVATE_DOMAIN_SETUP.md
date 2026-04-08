# Private Domain Setup Guide

This document explains how to configure MedVault to use a private domain instead of localhost.

## Private Domain Domains

The application is configured to use the following private domains:

- **API Server**: `api.medvault.local:5000`
- **Client App**: `app.medvault.local:5173`

## Setup Instructions

### 1. Update Your Hosts File

To use the private domain locally, you need to add entries to your `/etc/hosts` file (Linux/Mac) or `C:\Windows\System32\drivers\etc\hosts` (Windows).

**On Linux/Mac:**
```bash
sudo nano /etc/hosts
```

Add these lines:
```
127.0.0.1    api.medvault.local
127.0.0.1    app.medvault.local
```

Save and exit (Ctrl+X, then Y, then Enter in nano).

**On Windows:**
1. Open Notepad as Administrator
2. Open `C:\Windows\System32\drivers\etc\hosts`
3. Add these lines:
```
127.0.0.1    api.medvault.local
127.0.0.1    app.medvault.local
```
4. Save and close

### 2. Verify Hosts File Changes

Test the hosts file configuration:

```bash
# On Linux/Mac
ping api.medvault.local
ping app.medvault.local

# On Windows (use Command Prompt)
ping api.medvault.local
ping app.medvault.local
```

### 3. Environment Variables

The following environment variables are already configured:

**Server (.env file):**
```
API_URL=http://api.medvault.local:5000
CLIENT_URL=http://app.medvault.local:5173
```

**Client (.env file):**
```
VITE_API_URL=http://api.medvault.local:5000
```

### 4. Run the Application

Start the development servers as usual:

```bash
# Terminal 1: Start the backend server
cd server
npm install
npm start

# Terminal 2: Start the frontend development server
cd client
npm install
npm run dev
```

### 5. Access the Application

Open your browser and navigate to:
- **Client App**: http://app.medvault.local:5173
- **API Server**: http://api.medvault.local:5000

## Switching Between Localhost and Private Domain

### To Use Localhost (Original Setup)

Update your environment files:

**server/.env:**
```
API_URL=http://localhost:5000
CLIENT_URL=http://localhost:5173
```

**client/.env:**
```
VITE_API_URL=http://localhost:5000
```

### To Use Private Domain (Current Setup)

All files are already configured for the private domain in the .env files.

## Fallback Behavior

The application includes fallback logic for development:

- **CORS**: Accepts both private domain and localhost origins in development
- **Vite Proxy**: Uses environment variable with fallback to private domain
- **API Calls**: Configured via `VITE_API_URL` environment variable

## Troubleshooting

### CORS Errors

If you encounter CORS errors:
1. Verify the hosts file is correctly updated
2. Restart your browser or clear the browser cache
3. Check that both `API_URL` and `CLIENT_URL` are correctly set in `.env` files

### Connection Refused

If the application cannot connect to the API:
1. Ensure the backend server is running on the correct port
2. Check that the firewall allows connections to `api.medvault.local:5000`
3. Verify the hosts file entries

### DNS Resolution Issues

If the private domain doesn't resolve:
1. Clear system DNS cache:
   - **Linux**: `sudo systemctl restart systemd-resolved`
   - **Mac**: `sudo dscacheutil -flushcache`
   - **Windows**: `ipconfig /flushdns`

## Production Deployment

For production deployment, update the environment variables to use your actual domain:

```
API_URL=https://api.yourdomain.com
CLIENT_URL=https://yourdomain.com
```

Ensure your domain's DNS records point to your production servers.
