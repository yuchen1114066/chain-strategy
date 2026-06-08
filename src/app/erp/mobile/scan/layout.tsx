import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "倉庫零件查詢 · CHI HUA WAREHOUSE",
  description: "掃 QR 或搜尋料號，查看零件卡（庫存 · 品名 · 倉位 · 規格）",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "倉庫查詢",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0c1908",
};

export default function MobileScanLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: "fixed", inset: 0, overflow: "auto", background: "#fbfcfa" }}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600;700&family=Noto+Sans+TC:wght@400;500;700;900&display=swap"
        rel="stylesheet"
      />
      <link rel="apple-touch-icon" href="/icons/warehouse-192.svg" />
      <script
        dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.register('/sw.js').catch(function() {});
            }
          `,
        }}
      />
      {children}
    </div>
  );
}
