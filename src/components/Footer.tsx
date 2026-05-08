import Link from "next/link";
import Image from "next/image";
import { Leaf, AlertCircle } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-16" style={{ background: "#2a3d28", color: "#d8ecd6" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="mb-5">
              <div className="rounded-2xl overflow-hidden p-1.5 inline-block" style={{ background: "#fdf3e3" }}>
                <Image src="/chengshu-logo-beige.svg" alt="梣數策院" width={100} height={50} className="object-contain" />
              </div>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#3d5c3a" }}>
                <Leaf className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="font-bold text-lg" style={{ color: "#e8f5e6" }}>WarmCare 養生道</div>
                <div className="text-xs" style={{ color: "#8ab88a" }}>溫心家・梣數策院</div>
              </div>
            </div>

            <p className="text-sm leading-relaxed mb-4" style={{ color: "#9ac49a" }}>
              融合傳統中醫智慧與現代生活，用溫暖的方式，讓每個家庭都能輕鬆實踐養生。
            </p>
            <div className="flex items-center gap-1 text-xs" style={{ color: "#7aaa7a" }}>
              <Leaf className="w-3 h-3" style={{ color: "#adc5a0" }} />
              <span>為您的健康用心服務</span>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-4 text-sm" style={{ color: "#e8f5e6" }}>功能服務</h4>
            <ul className="space-y-2 text-sm">
              {[
                { href: "/quiz", label: "🌿 體質測評" },
                { href: "/recipes", label: "🍵 食療食譜庫" },
                { href: "/tracking", label: "🗓️ 七天打卡追蹤" },
                { href: "/herb-checker", label: "💊 中西藥安全查詢" },
                { href: "/community", label: "💬 養生社群" },
                { href: "/shop", label: "🛒 溯源認證商城" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition-colors" style={{ color: "#9ac49a" }}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Audiences */}
          <div>
            <h4 className="font-semibold mb-4 text-sm" style={{ color: "#e8f5e6" }}>適合族群</h4>
            <ul className="space-y-2 text-sm" style={{ color: "#9ac49a" }}>
              <li>👨‍👩‍👧‍👦 家庭主婦／夫</li>
              <li>👴 中老年人</li>
              <li>💼 外食族 / 上班族</li>
              <li>💆 保養族</li>
              <li>🏥 慢性病自我管理者</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4 text-sm" style={{ color: "#e8f5e6" }}>聯絡我們</h4>
            <ul className="space-y-3 text-sm" style={{ color: "#9ac49a" }}>
              <li className="flex items-center gap-2 flex-wrap">
                <span>💬 LINE</span>
                <a href="https://line.me/R/ti/p/@178jiwdm" target="_blank" rel="noopener noreferrer"
                  className="font-mono font-semibold" style={{ color: "#adc5a0" }}>
                  @178jiwdm
                </a>
              </li>
              <li>
                <a href="mailto:chain.stratgy@gmail.com" className="break-all" style={{ color: "#9ac49a" }}>
                  📧 chain.stratgy@gmail.com
                </a>
              </li>
              <li>
                <a href="tel:0975520919" style={{ color: "#9ac49a" }}>
                  📞 0975-520919
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="border-t mt-10 pt-8" style={{ borderColor: "#3d5c3a" }}>
          <div className="rounded-2xl p-4 mb-6 flex gap-3" style={{ background: "#1e3020" }}>
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "#adc5a0" }} />
            <div className="text-xs leading-relaxed space-y-1" style={{ color: "#8ab88a" }}>
              <p className="font-semibold mb-1" style={{ color: "#c8e8c8" }}>⚠️ 重要免責聲明</p>
              <p>本平台所提供之所有內容（包含食療食譜、體質測評、中西藥查詢、社群貼文及商品資訊），<strong style={{ color: "#d8ecd6" }}>僅供一般健康教育與參考用途，不構成任何醫療診斷、治療建議或醫療行為</strong>。</p>
              <p>若您有任何健康疑慮、正在服用藥物、懷孕或患有慢性疾病，<strong style={{ color: "#d8ecd6" }}>請務必先諮詢合格醫療專業人員</strong>，再決定是否採用本平台之養生建議。</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs" style={{ color: "#6a9a6a" }}>
            <p>© 2026 梣數策院 · WarmCare 養生道. 版權所有。</p>
            <div className="flex gap-4">
              <span className="cursor-pointer" style={{ color: "#6a9a6a" }}>隱私政策</span>
              <span className="cursor-pointer" style={{ color: "#6a9a6a" }}>服務條款</span>
              <span className="cursor-pointer" style={{ color: "#6a9a6a" }}>免責聲明全文</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
