import Doc from "@/components/Doc";
export const metadata = { title: "Privacy policy" };
export default function Page() {
  return (<Doc title="Privacy policy">
    <p className="meta">Template text. Have a Nigerian lawyer review it before launch.</p>
    <h3>What we collect</h3><p>Your email, ad details and photos, phone number you list on ads, wallet activity, and bank details you save for payouts.</p>
    <h3>Why</h3><p>To run your account, show your ads, process payments and withdrawals, and keep the site safe.</p>
    <h3>Who sees it</h3><p>Your ads and phone number are visible to signed-in users. Payments are received by bank transfer and checked by our team. Data is hosted with Supabase. Messages you send on Mifask are visible to the people in the chat, and to our team if a report is made. We do not sell your data.</p>
    <h3>Your choices</h3><p>You can delete your ads at any time. To delete your account or ask what we hold about you, email mifask@proton.me.</p>
  </Doc>);
}
