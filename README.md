# Zoom OAuth Demo (Local Development)

Lightweight OAuth 2.0 demo using Zoom, Express, and vanilla HTML/JS. Designed for localhost/dev only—no secrets in the frontend and minimal dependencies.

## Features
- Zoom OAuth login (code exchange handled server-side, secrets stay in `.env`)
- Fetches user profile (name, email, Zoom ID, account details)
- Lists upcoming meetings (uses bearer token)
- Clean, Zoom-inspired UI (no external UI frameworks)

## Prerequisites
- Node.js 18+
- A Zoom OAuth app (User-managed) with redirect URI: `http://localhost:5500/callback.html`
- Enable scopes in Zoom Marketplace (set in app, not URL):
  - `user:read:user`
  - `user:read:email`
  - `user:read:pm_room`
  - `meeting:read:list_meetings`

## Setup
1) Install dependencies  
```bash
npm install
```

2) Configure environment  
Create `.env` based on `.env.example`:
```
CLIENT_ID=your_client_id
CLIENT_SECRET=your_client_secret
REDIRECT_URI=http://localhost:5500/callback.html
PORT=5500
```

## Run
- Dev: `npm run dev`
- Prod-style: `npm start`

App will be available at `http://localhost:5500`.

## How it works
1. `index.html` fetches `/config` (client id + redirect URI) and redirects to Zoom authorize (no scopes in URL—scopes are set in the Marketplace).
2. Zoom redirects back to `callback.html?code=...`.
3. Frontend sends the code to `/oauth/token`; backend exchanges it using client secret (server-side).
4. Frontend calls `/user` and `/meetings` with the returned access token to show profile + upcoming meetings.

## Endpoints (backend)
- `GET /config` — exposes non-sensitive client config.
- `POST /oauth/token` — exchanges auth code for tokens.
- `GET /user` — returns current user profile (uses bearer access token).
- `GET /meetings` — returns upcoming meetings (uses bearer access token).

## Security notes
- Never expose `CLIENT_SECRET` in frontend code.
- Keep `.env` out of version control.
- This demo is for localhost; add HTTPS, CSRF protection, secure token handling, and real session management before any production use.

## UI
- Soft dark-blue gradient background, centered cards, rounded corners.
- Primary action: “Login with Zoom”; secondary: “Start over” on callback page.
- Profile card + Account details + Upcoming meetings (friendly empty state).

## Troubleshooting
- Invalid scope: ensure Marketplace scopes match the required list above.
- Redirect mismatch: check `REDIRECT_URI` in both `.env` and Zoom app settings.
- Token errors: verify client ID/secret and that you re-authorize after scope changes.

