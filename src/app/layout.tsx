import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";

export const metadata: Metadata = {
  title: "養生道 YangSheng Dao | 傳統中醫養生平台",
  description: "結合傳統中醫智慧與現代生活方式，提供體質測評、食療食譜、藥膳湯品、中西藥交互查詢等全方位養生服務。",
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
        <main className="flex-1 pb-16 md:pb-0">{children}</main>
        <div className="hidden md:block"><Footer /></div>
        <MobileBottomNav />
      </body>
    </html>
  );
}
