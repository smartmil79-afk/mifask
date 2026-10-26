# Mifask (Next.js + Supabase)
Classifieds marketplace with wallet, escrow payments, daily tokens, sponsored ads, withdrawals, admin panel and a help assistant.
See SETUP.md for setup and hosting. Run the SQL files in this order: schema, admin, wallet, extras, manual.

## Payments (manual for now)
Customers pay by bank transfer, upload the receipt, and an admin confirms it on the Admin page.
- Sponsored ad: after you approve, the ad enters the top 5 for the plan period (Basic 1 week, Pro 1 month, Premium 2 months).
- Wallet top-up: after you approve, the wallet is credited.
- Edit your bank account in `lib/constants.ts` (`BANK_DETAILS`).
- Approve only after you see the money in your bank account.
Wallet escrow, daily tokens, withdrawals and the other features work as before.
