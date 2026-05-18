# $RIOT Chat — Wallet Connect with Suiet Wallet Kit

## Setup

1. Extract this ZIP file
2. Copy your agent images (J1.jpg - J18.jpg) to `public/assets/`
3. Open terminal in this folder
4. Run:

```bash
npm install
npm run dev
```

5. Open browser at `http://localhost:5173`

## Build for Production

```bash
npm run build
```

Deploy the `dist/` folder to Vercel/Netlify.

## Wallet Connect

Click "Connect" button → Suiet Wallet Kit modal opens → Select your wallet → Approve in wallet extension.

## Tech Stack
- React 18 + Vite
- @suiet/wallet-kit (official Suiet wallet adapter)
- @mysten/sui.js (Sui SDK)
