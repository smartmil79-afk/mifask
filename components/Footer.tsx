import { PLANS } from "@/lib/constants";
export default function Footer() {
  return (
    <footer><div className="wrap"><div className="cols">
      <div><h3>mifask</h3><p>Nigeria’s friendly marketplace. Post free ads, promote to sell faster.</p></div>
      <div><h3>Contact us</h3><a href="mailto:mifask@proton.me">mifask@proton.me</a><a href="tel:+2348121483131">0812 148 3131</a><a href="https://wa.me/2348121483131">WhatsApp: 0812 148 3131</a></div>
      <div><h3>Follow us</h3><a href="https://instagram.com/mifask">Instagram @mifask</a><a href="https://x.com/mifask">X @mifask</a><a href="https://facebook.com/mifask">Facebook /mifask</a><a href="https://tiktok.com/@mifask">TikTok @mifask</a></div>
      <div><h3>Help</h3><a href="/safety">Safety tips</a><a href="/help">Help &amp; FAQ</a><a href="/terms">Terms of use</a><a href="/privacy">Privacy policy</a></div>
      <div><h3>Promote your ad</h3>{Object.values(PLANS).map((p) => <a key={p.name}>{p.name} · ₦{p.price.toLocaleString()} · {p.label}</a>)}</div>
    </div></div></footer>
  );
}
