import "./globals.css";
import "./update5.css";
import { headers } from "next/headers";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ChatWidget from "@/components/ChatWidget";
import Popups from "@/components/Popups";
export const viewport = { width: "device-width", initialScale: 1, colorScheme: "light dark", themeColor: "#e8f0ea" };
export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: { default: "Mifask - Buy and sell anything in Nigeria", template: "%s | Mifask" },
  description: "Post free ads, chat with sellers on WhatsApp, and pay safely with your Mifask wallet.",
  openGraph: { siteName: "Mifask", type: "website" },
};
const BARE = ["/login", "/forgot", "/reset", "/register"];
export default function RootLayout({ children }: { children: React.ReactNode }) {
  const path = headers().get("x-pathname") ?? "";
  const bare = BARE.some((p) => path.startsWith(p));
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{ __html: "try{document.documentElement.dataset.theme=localStorage.getItem('mf_theme')||'light'}catch(e){}" }} />
      </head>
      <body>
        {bare ? <div className="bare">{children}</div> : (<><Header /><div className="wrap">{children}</div><Footer /><ChatWidget /><Popups /></>)}
      </body>
    </html>
  );
}
