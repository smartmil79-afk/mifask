# Mifask setup: Supabase, GitHub and Vercel

You need: Node.js 20+, Git, and free accounts on Supabase, GitHub and Vercel.

## Costs and plans (read first)
- **Vercel Hobby is free but only for personal, non-commercial use.** A marketplace that takes money is commercial, so go live on **Vercel Pro (about $20 per month per user)**. Hobby is fine for testing.
- **Supabase Free pauses a project after 1 week without activity.** For real customers use **Supabase Pro (about $25 per month)**.
- Prices change. Check vercel.com/pricing and supabase.com/pricing before you pay.

## 1. Supabase
1. supabase.com > New project. Save the database password.
2. SQL Editor > New query. Paste and Run each file from the `supabase/` folder **in this order**:
   `schema.sql`, `admin.sql`, `wallet.sql`, `extras.sql`, `manual.sql`, then `update1.sql`, then `messages.sql` (buyer-seller chat), then `security.sql` (protects admins who turn on two-step login). Optional: `seed.sql` adds sample listings (run it after you sign up and make yourself admin).
3. Storage: you should see two buckets, `ad-images` (public) and `receipts` (private).
4. Authentication > Sign In / Providers: Email on. Authentication > URL Configuration: add `https://YOUR-SITE/auth/callback` (or, simpler, `https://YOUR-SITE/**`, which also covers password reset) under Redirect URLs so verification links sign people in.
5. Settings > API Keys (or Connect): copy the Project URL, the publishable key (`sb_publishable_...`) and the secret key (`sb_secret_...`).

## 2. Run it on your computer
```
cp .env.example .env.local      # then fill in the values (Windows: copy .env.example .env.local)
npm install
npm run dev                     # http://localhost:3000
npm run build                   # check for errors before deploying
```
Make yourself admin (SQL Editor, use your email):
```
update profiles set is_admin = true where id = (select id from auth.users where email = 'you@example.com');
```

## 3. Your bank account
Open `lib/constants.ts` and edit `BANK_DETAILS` (bank, account number, account name). Customers will see it when they pay.

## 4. GitHub and Vercel
Push to a private GitHub repository, import it in Vercel, add the 4 environment variables from `.env.example`, set `NEXT_PUBLIC_SITE_URL` to your Vercel address, deploy, then in Supabase > Authentication > URL Configuration set the Site URL to the same address.

## 5. How manual payments work
1. A seller picks a plan (or a wallet top-up), sees your bank details, transfers the money and uploads the receipt with its transaction ID.
2. You open **Admin > Payment receipts to confirm**, check **your bank account**, then press **Money received, approve**.
3. The ad enters the top 5 (or the wallet is credited). Reject if the money did not arrive.
Never approve from the receipt image alone: images can be faked. The same transaction ID cannot be submitted twice.

## Before real customers
- Supabase's built-in email is rate limited. Add your own SMTP provider under Authentication.
- Replace the placeholder social handles in `components/Footer.tsx`.
- Have a lawyer review Terms and Privacy, and check the rules for holding customer money in Nigeria.
