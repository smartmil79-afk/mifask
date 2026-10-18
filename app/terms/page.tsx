import Doc from "@/components/Doc";
export const metadata = { title: "Terms of use" };
export default function Page() {
  return (<Doc title="Terms of use">
    <p className="meta">Template text. Have a Nigerian lawyer review it before launch.</p>
    <h3>Using Mifask</h3><p>You must be 18 or older. Post only items you own and describe them honestly.</p>
    <h3>Not allowed</h3><p>Illegal items, counterfeit goods, weapons, stolen property, adult content and scams. We remove such ads and may close accounts.</p>
    <h3>Wallet payments</h3><p>When you pay a seller from your wallet, the money is held until you confirm you received the item. If there is a dispute, our team reviews it and decides whether to pay the seller or refund the buyer.</p>
    <h3>Promotions and tokens</h3><p>Sponsored ads run for the plan period and are not refundable once active. Daily tokens have no cash value and cannot be withdrawn.</p>
    <h3>Withdrawals</h3><p>Minimum ₦1,000. A ₦50 fee applies. Payouts go to the bank account you saved, usually within 24 hours.</p>
    <h3>Liability</h3><p>Mifask connects buyers and sellers. We do not own the items sold. Inspect items before you confirm payment.</p>
  </Doc>);
}
