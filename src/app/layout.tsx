import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/erp/ScrollToTop";

export const metadata: Metadata = {
  title: "祺驊 CHI HUA — AI Supply Chain Flow",
  description: "Enterprise Supply Chain Control Tower → AI Decision Platform → Predictive Network → Autonomous OS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" className="h-full">
      <body className="min-h-full flex flex-col bg-[#fdfaf5] text-[#2c1810]">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <ScrollToTop />
      </body>
    </html>
  );
}
