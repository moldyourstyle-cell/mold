# MOLD AI Fitting Room (starter)

## Requirements
- Node.js 18+
- Decart account/API key: https://platform.decart.ai/api-keys

## Run on your local network
1. `npm install`
2. Create `.env` in the project root and add `DECART_API_KEY=your_key` (server only)
3. Terminal A: `npm run server`
4. Terminal B: `npm run dev`
5. In the Vite output, open the **Network** URL (for example `http://192.168.1.20:5173`) on a device connected to the same Wi-Fi.
6. Allow camera access, upload a product garment image, and start fitting.

**Camera note:** Browsers generally allow camera access on `localhost` or secure HTTPS pages. A plain HTTP LAN address may be blocked on phones. For phone testing, serve the app over HTTPS using a trusted local development certificate or a secure tunnel. Keep `.env` on the computer running the server; never put the permanent key in frontend code.

**Note:** This is an MVP scaffold. Confirm the Decart SDK token response format and model entitlement against your account. Add consent/privacy policy, rate limits, auth, and cost controls before public launch.
