# Push notification demo client

TypeScript, Vite, and React demo UI that registers the browser with OneSignal, syncs the subscription id to the backend API, and includes a panel to trigger test sends.

## Prerequisites

- Node.js 20 or newer
- A OneSignal web app configured for your site (including allowed origins / localhost if you test locally)
- The backend API running and reachable from the browser (see `../backend/README.md`)

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the environment template:

   ```bash
   cp .env.example .env
   ```

3. Edit `.env`:

   | Variable | Description |
   |----------|-------------|
   | `VITE_ONESIGNAL_APP_ID` | Same OneSignal app ID as used by the backend |
   | `VITE_API_URL` | Base URL of the API (no trailing slash), e.g. `http://localhost:3000` |

4. Start the dev server:

   ```bash
   npm run dev
   ```

   Open the URL printed in the terminal (by default `http://localhost:5173`).

## Production build

```bash
npm run build
```

Static output is written to `dist/`. Serve those files with any static host over HTTPS in production so web push and the OneSignal service worker behave correctly.

Preview the build locally:

```bash
npm run preview
```

## Using the demo

1. Allow notifications when prompted and complete subscribe so the app can read a OneSignal subscription id and call `POST /subscribe` on the API.
2. Use **Send notification** only with a backend `API_KEY` you paste into the field; that key is not stored in the frontend bundle.

## Notes

- The service worker file `public/OneSignalSDKWorker.js` loads the official OneSignal v16 worker script from their CDN; keep it in place for web push.
- For local development, OneSignal is initialized with `allowLocalhostAsSecureOrigin` so you can test on `http://localhost`.
