# CLEANUP_REPORT

## Removed
- `attached_assets/` and the `@assets` alias in `vite.config.ts` (unused pasted prompts/images).
- `server/blockchain/*`, `server/controllers/tokenController.ts`, `server/routes/tokenRoutes.ts` (legacy private-key mint/burn API replaced by MetaMask-admin flow).

## Updated / Added
- New blockchain config and ABI at `client/src/blockchain/config.ts` and `client/src/blockchain/brl3Abi.ts` (Polygon mainnet, BRL3 address, admin wallet, 18 decimals).
- Pending deposit/withdrawal schema and routes now store `walletAddress`, `txHash`, and minted/burned raw amounts; admin UI mint/burn buttons use MetaMask to target the user’s wallet.
- Portfolio deposit/withdraw forms now require a wallet address (MetaMask connect buttons) before submitting requests.

## Follow-up
- Run `npm run db:push` to apply the new wallet/tx columns to the database before deploying.
