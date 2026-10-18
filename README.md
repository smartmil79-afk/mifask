# Mifask (Next.js + Supabase + Paystack)

## Setup
1. Create a project at supabase.com. In SQL Editor, run `supabase/schema.sql`.
2. In Supabase > Authentication, enable Email (turn off "Confirm email" while testing if you like).
3. Copy `.env.example` to `.env.local` and fill in the Supabase keys and your Paystack secret key.
4. `npm install` then `npm run dev` (http://localhost:3000).
5. Paystack dashboard > Settings > API & Webhooks: set the webhook URL to `https://YOUR-DOMAIN/api/paystack/webhook`
   (use a tunnel such as ngrok when testing locally). Use your `sk_test_` key first.
6. Deploy on Vercel: import the repo, add the same env vars (set NEXT_PUBLIC_SITE_URL to your domain).

## How promotion works
Seller clicks Promote > Paystack checkout. The webhook verifies Paystack's signature and the amount, then marks the
promotion paid and sets its dates. The homepage shows the top 5 active promotions (Premium first, then Pro, then Basic).
Buying again while a promotion is active extends it.

## Edit before launch
Contact details and social handles: `components/Footer.tsx`. Prices and durations: `lib/constants.ts`.
Phone-number sign-in needs an SMS provider (e.g. Twilio) configured in Supabase Auth.

## Admin and moderation
Run `supabase/admin.sql` after `schema.sql`, then make yourself admin with the SQL at the bottom of that file.
Admins get an **Admin** link in the header: stats, reported ads (Remove ad or Dismiss) and the latest ads with a Remove button.
Signed-in users can report ads from the ad page; each user can report an ad once. Admin rights are enforced by database
policies, not just by hiding the page.

## Wallet, escrow and daily tokens
Run `supabase/wallet.sql` after `admin.sql`. Everything that moves money lives in database functions, so users cannot edit balances.
- **Add money:** Paystack checkout. The webhook credits the wallet once per payment (duplicates are ignored).
- **Pay a seller:** "Pay with wallet" on an ad holds the money (escrow). The buyer taps "I received it" to pay the seller; the seller or an admin can refund. Admins can settle disputes on the Admin page.
- **Daily tokens:** 1 token a day (Lagos time), +3 bonus on every 7th day in a row. Spend them on Basic (7), Pro (30) or Premium (55). Change the numbers in `wallet.sql` (`buy_promo`, `claim_daily_tokens`) and `lib/constants.ts`.
- **Promotions** can now be bought with card, wallet money or tokens.
- Not included: withdrawing seller money to a bank account. Paystack Transfers needs a verified business, so add it after launch.
- Holding customer money may need a licence or a payments partner in Nigeria. Check with a lawyer before going live.

See SETUP.md for the full Supabase, GitHub and Vercel steps. Run the SQL files in this order: schema, admin, wallet, extras.
"# mifask" 
