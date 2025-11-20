# PrevisionMarket

Prediction market web app with PIX deposits, admin-approved mint/burn on Polygon, and BRL3 token integration.

## Stack & Dev Commands
- Frontend: Vite + React in `client/`
- Backend: Express + tsx dev server in `server/`
- Shared Drizzle schema in `shared/`
- Start dev: `npm run dev`
- Build: `npm run build` → `dist/` (client + bundled server)
- Prod start: `npm start`
- Sync DB schema: `npm run db:push`

## Setup
1) `npm install`
2) Environment variables:
   - `DATABASE_URL` (Postgres, required)
   - `SESSION_SECRET` (required for sessions)
   - `PORT` (optional, defaults to 5000)
   - `VITE_POLYGON_RPC_URL` (optional Polygon RPC fallback, otherwise uses `https://polygon-rpc.com`)
   - `AI_INTEGRATIONS_OPENAI_BASE_URL` / `AI_INTEGRATIONS_OPENAI_API_KEY` (optional, only for the AI assistant feature)
3) Apply schema changes (new wallet/tx columns): `npm run db:push`
4) Run `npm run dev`

## Blockchain Configuration
- Network: Polygon Mainnet (`0x89`)
- Admin wallet: `0xCD83c3f36396bcb3569240a3Cb34f037ba310926`
- BRL3 token: `0x2F6370EC3b1ebB60cF359fb264E5e576ceEb6dcE`
- Decimals: 18
- Config + helpers: `client/src/blockchain/config.ts`
- ABI: `client/src/blockchain/brl3Abi.ts`
- MetaMask integration: `client/src/contexts/MetaMaskContext.tsx` and `client/src/lib/metamask-workflows.ts`

## Deposit → Admin Approve → Mint
1) User (Portfolio → Depósito) enters amount, wallet address (auto-filled from MetaMask), and uploads PDF proof.
2) Backend stores pending deposit with `walletAddress`, proof path, and status `pending`.
3) Admin (`/admin`, Depósitos tab) connects MetaMask with the admin wallet, checks proof, and clicks “Approve & Mint.” MetaMask mints BRL3 to the user wallet.
4) After confirmation, the frontend posts `txHash` + `amountRaw` to `/api/deposits/:id/confirm-mint`, which marks the deposit approved, updates the off-chain balance, and stores the tx hash/minted amounts.

## Withdrawal → Admin Approve → Burn
1) User requests withdrawal with amount, wallet address (defaults to MetaMask), and PIX key.
2) Admin (`/admin`, Saques tab) approves, signs a burn from the user wallet (MetaMask admin wallet pays gas), then posts `txHash` + `amountRaw` to `/api/withdrawals/:id/confirm-burn`.
3) Backend marks the withdrawal complete, updates off-chain balances, and logs the tx hash.
4) Ensure the user wallet holds the BRL3 being burned and has granted allowance for `burnFrom` when needed.

Notes:
- Deposit proofs are saved under `uploads/deposit-proofs/`.
- Admin on-chain actions must use MetaMask on Polygon with the admin wallet above.
- User BRL3 balances are 1:1 with BRL; raw on-chain amounts use 18 decimals (wei-style).
