import Link from "next/link";
import { Leaf, Heart, AlertCircle } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-stone-900 text-stone-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-green-600 rounded-lg flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-white font-bold text-lg">養生道</div>
                <div className="text-stone-400 text-xs">YangSheng Dao</div>
              </div>
            </div>
            <p className="text-sm text-stone-400 leading-relaxed mb-4">
              融合傳統中醫智慧與現代生活，用白話、圖像化方式，讓每個人都能輕鬆實踐養生。
            </p>
            <div className="flex items-center gap-1 text-xs text-stone-500">
              <Heart className="w-3 h-3 text-red-400" />
              <span>為您的健康用心服務</span>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">功能服務</h4>
            <ul className="space-y-2 text-sm">
              {[
                { href: "/quiz", label: "🧬 AI 體質測評" },
                { href: "/recipes", label: "🍲 食療食譜庫" },
                { href: "/herb-checker", label: "💊 中西藥安全查詢" },
                { href: "/community", label: "💬 養生社群" },
                { href: "/shop", label: "🛒 溯源認證商城" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-stone-400 hover:text-amber-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Audiences */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">適合族群</h4>
            <ul className="space-y-2 text-sm text-stone-400">
              <li>👨‍👩‍👧‍👦 家庭主婦／夫</li>
              <li>👴 中老年人</li>
              <li>💼 外食族 / 上班族</li>
              <li>💆 保養族</li>
              <li>🏥 慢性病自我管理者</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">服務資訊</h4>
            <ul className="space-y-2 text-sm text-stone-400">
              <li>📧 hello@yangshengdao.tw</li>
              <li>📞 02-2345-6789（週一至週五 9-18時）</li>
              <li>🏠 台北市中正區，養生道健康中心</li>
            </ul>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="border-t border-stone-700 mt-10 pt-8">
          <div className="bg-stone-800 rounded-xl p-4 mb-6 flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-stone-400 leading-relaxed space-y-1">
              <p className="text-amber-300 font-semibold mb-1">⚠️ 重要免責聲明</p>
              <p>本平台所提供之所有內容（包含食療食譜、體質測評、中西藥查詢、社群貼文及商品資訊），<strong className="text-stone-300">僅供一般健康教育與參考用途，不構成任何醫療診斷、治療建議或醫療行為</strong>。</p>
              <p>本平台不具備醫療機構資格，所有內容均不得取代專業醫師、中醫師、藥師或其他醫療人員之診察與建議。若您有任何健康疑慮、正在服用藥物、懷孕或患有慢性疾病，<strong className="text-stone-300">請務必先諮詢合格醫療專業人員</strong>，再決定是否採用本平台之養生建議。</p>
              <p>使用本平台即表示您已閱讀並同意上述免責聲明。</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
            <p>© 2026 養生道 YangSheng Dao. 版權所有。</p>
            <div className="flex gap-4">
              <span className="hover:text-stone-300 cursor-pointer">隱私政策</span>
              <span className="hover:text-stone-300 cursor-pointer">服務條款</span>
              <span className="hover:text-stone-300 cursor-pointer">免責聲明全文</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
