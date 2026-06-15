import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // X-Powered-By header 露出 Next.js / 版本 → 不必要的攻擊面
  poweredByHeader: false,

  // 站台全域安全 header
  //（middleware 也會在動態回應上補一份，這裡確保靜態頁也有）
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive, nosnippet" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(), payment=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
