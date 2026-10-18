# Mifask setup: Supabase, GitHub and Vercel

You need: Node.js 20+, Git, and free accounts on Supabase, GitHub, Vercel and Paystack.

## 1. Create the Supabase project
1. supabase.com > New project. Pick the closest region offered and save the database password.
2. Open **SQL Editor** > New query. Paste and Run each file from the `supabase/` folder, **in this order**:
   `schema.sql`, `admin.sql`, `wallet.sql`, `extras.sql`.
3. **Storage** tab: confirm a public bucket named `ad-images` exists (schema.sql creates it).
4. **Authentication > Sign In / Providers**: Email must be on. While testing you can turn off "Confirm email".
5. Keys: click **Connect** or open **Settings > API Keys**. Copy the Project URL, the **publishable** key (`sb_publishable_...`) and the **secret** key (`sb_secret_...`). Older projects show `anon` and `service_role` instead; use those the same way.

## 2. Run it on your computer
```
cd mifask
cp .env.example .env.local      # then fill in the values
npm install
npm run dev                     # http://localhost:3000
npm run build                   # check for errors before deploying
```
Sign up, then make yourself admin (SQL Editor, use your email):
```
update profiles set is_admin = true where id = (select id from auth.users where email = 'you@example.com');
```

## 3. Put the code on GitHub
1. github.com > New repository. Name it `mifask`, choose Private, do NOT add a README.
2. In the `mifask` folder:
```
git init
git add .
git commit -m "Mifask first version"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/mifask.git
git push -u origin main
```
`.env.local` is ignored by `.gitignore`, so your keys are not uploaded. Check with `git status` before committing.

## 4. Host on Vercel
1. vercel.com > sign in with GitHub > Add New > Project > import `mifask`.
2. Add the 5 environment variables from `.env.example`. Set `NEXT_PUBLIC_SITE_URL` to your Vercel address (for example `https://mifask.vercel.app`).
3. Deploy. Every `git push` to `main` redeploys automatically.
4. Supabase > **Authentication > URL Configuration**: set Site URL to your Vercel address and add it under Redirect URLs.
5. Paystack > **Settings > API Keys & Webhooks**: set the webhook URL to `https://YOUR-SITE/api/paystack/webhook`.
6. Test: sign up, post an ad with photos, add ₦100 to the wallet with a Paystack test card, claim tokens.

## 5. Before real customers
- Switch to Paystack live keys after your business is verified, and update `PAYSTACK_SECRET_KEY` in Vercel, then redeploy.
- Supabase's built-in email sender is for testing and is rate limited. Add your own SMTP provider under Authentication before launch.
- Replace the placeholder email, phone and social handles in `components/Footer.tsx`.
- Have a lawyer review `terms` and `privacy`, and check the rules for holding customer money in Nigeria.
- Custom domain: Vercel > Settings > Domains. Then update `NEXT_PUBLIC_SITE_URL`, the Supabase URLs and the Paystack webhook.

## Troubleshooting
- "function ... does not exist": a SQL file was skipped or run out of order.
- Photos fail to upload: check the `ad-images` bucket exists and is public.
- Wallet not credited after payment: webhook URL wrong, or `PAYSTACK_SECRET_KEY` differs from the key that took the payment.
- Admin link missing: run the admin SQL above, then sign out and in.
