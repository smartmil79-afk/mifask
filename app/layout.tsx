import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import ChatWidget from "@/components/ChatWidget";
export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: { default: "Mifask – Buy and sell anything in Nigeria", template: "%s | Mifask" },
  description: "Post free ads, chat with sellers on WhatsApp, and pay safely with your Mifask wallet.",
  openGraph: { siteName: "Mifask", type: "website" },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="en"><head><link href="https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" /></head><body><Header /><div className="wrap">{children}</div><Footer /><BottomNav /><ChatWidget /></body></html>);
}
