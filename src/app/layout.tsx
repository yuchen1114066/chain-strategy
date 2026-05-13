import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";

export const metadata: Metadata = {
  title: "WarmCare 養生道 — 網頁建置中",
  description: "WarmCare 養生道網站正在建置中，敬請期待。",
};

const MAINTENANCE = true; // 設為 false 即可恢復正常顯示

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  if (MAINTENANCE) {
    return (
      <html lang="zh-TW" className="h-full">
        <body style={{ margin: 0, background: "#1a2e1c", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Noto Serif TC', serif" }}>
          <div style={{ textAlign: "center", color: "#d8ecd6", padding: "2rem" }}>
            <div style={{ fontSize: 48, marginBottom: "1.5rem" }}>🌿</div>
            <h1 style={{ fontSize: "clamp(1.4rem,4vw,2rem)", fontWeight: 400, letterSpacing: ".12em", color: "#e8f5e6", marginBottom: ".75rem" }}>
              WarmCare 養生道
            </h1>
            <p style={{ fontSize: "clamp(.85rem,2vw,1rem)", color: "#7aaa7a", letterSpacing: ".2em", marginBottom: "2.5rem" }}>
              網頁工程中
            </p>
            <div style={{ width: 48, height: 2, background: "#4a7c4c", margin: "0 auto 2rem" }} />
            <p style={{ fontSize: 13, color: "#5a9a5a", letterSpacing: ".08em", lineHeight: 2 }}>
              We&rsquo;re working hard to bring you something wonderful.<br />
              敬請期待，即將與您見面。
            </p>
          </div>
        </body>
      </html>
    );
  }

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

