"use client";

import Link from "next/link";
import { Leaf, AlertCircle, MessageSquare, Mail, Phone, ExternalLink } from "lucide-react";

const footerLinks = [
  { href: "/quiz",         label: "體質測評",     emoji: "🌿" },
  { href: "/recipes",      label: "食療食譜庫",   emoji: "🍵" },
  { href: "/tracking",     label: "七天打卡追蹤", emoji: "🗓️" },
  { href: "/herb-checker", label: "本草查詢",     emoji: "📖" },
  { href: "/community",    label: "養生社群",     emoji: "💬" },
  { href: "/shop",         label: "溯源認證商城", emoji: "🛒" },
];

const audiences = ["家庭主婦／夫", "中老年人", "外食族 / 上班族", "保養族", "慢性病自我管理者"];

const contacts = [
  { icon: MessageSquare, label: "LINE 官方帳號", value: "@178jiwdm",           href: "https://line.me/R/ti/p/@178jiwdm", external: true },
  { icon: Mail,          label: "電子郵件",       value: "chain.stratgy@gmail.com", href: "mailto:chain.stratgy@gmail.com",  external: false },
  { icon: Phone,         label: "服務電話",        value: "0975-520919",          href: "tel:0975520919",                   external: false },
];

export default function Footer() {
  return (
    <footer style={{ background: "#1a2e1c", color: "#d8ecd6" }}>

      {/* Main footer grid */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "3.5rem 2rem 2.5rem", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1.2fr", gap: "2.5rem" }}
        className="footer-grid">

        {/* Brand */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.9rem" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#2d5c30", border: "1px solid #4a7c4c", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Leaf style={{ width: 16, height: 16, color: "#a8d4a8" }} />
            </div>
            <div>
              <div style={{ fontFamily: "'Noto Serif TC', serif", fontSize: 16, fontWeight: 500, color: "#e8f5e6", letterSpacing: ".08em", lineHeight: 1.2 }}>WarmCare 養生道</div>
              <div style={{ fontSize: 11, color: "#7aaa7a", letterSpacing: ".06em", marginTop: 2 }}>溫心家・梣數策院</div>
            </div>
          </div>

          <p style={{ fontSize: 13, color: "#9ac49a", lineHeight: 2, marginBottom: "1.2rem" }}>
            融合傳統中醫智慧與現代生活，用溫暖的方式，讓每個家庭都能輕鬆實踐養生。
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#6aaa6a" }}>
            <Leaf style={{ width: 12, height: 12, color: "#8ab88a" }} />
            <span>為您的健康用心服務</span>
          </div>
        </div>

        {/* Function links */}
        <div>
          <div style={{ fontSize: 11, letterSpacing: ".2em", color: "#c9a850", textTransform: "uppercase", fontWeight: 500, paddingBottom: ".5rem", borderBottom: "1px solid #2d5c30", marginBottom: "1rem" }}>
            功能服務
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {footerLinks.map(({ href, label, emoji }) => (
              <li key={href} style={{ marginBottom: "0.4rem" }}>
                <Link href={href} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: 13, color: "#9ac49a", lineHeight: 1.5, textDecoration: "none", padding: "0.25rem 0", transition: "color .15s" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#9ac49a")}
                >
                  <span style={{ width: 16, textAlign: "center", fontSize: 12, flexShrink: 0 }}>{emoji}</span>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Suitable audiences */}
        <div>
          <div style={{ fontSize: 11, letterSpacing: ".2em", color: "#c9a850", textTransform: "uppercase", fontWeight: 500, paddingBottom: ".5rem", borderBottom: "1px solid #2d5c30", marginBottom: "1rem" }}>
            適合族群
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {audiences.map((a) => (
              <li key={a} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: 13, color: "#9ac49a", marginBottom: "0.45rem", lineHeight: 1.5 }}>
                <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#6aaa6a", flexShrink: 0 }} />
                {a}
              </li>
            ))}
          </ul>
        </div>

        {/* Contact info */}
        <div>
          <div style={{ fontSize: 11, letterSpacing: ".2em", color: "#c9a850", textTransform: "uppercase", fontWeight: 500, paddingBottom: ".5rem", borderBottom: "1px solid #2d5c30", marginBottom: "1rem" }}>
            聯絡我們
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {contacts.map(({ icon: Icon, label, value, href, external }) => (
              <li key={label}>
                <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem", textDecoration: "none" }}
                  onMouseEnter={e => { const v = e.currentTarget.querySelector(".cv") as HTMLElement; if(v) v.style.color="#fff"; }}
                  onMouseLeave={e => { const v = e.currentTarget.querySelector(".cv") as HTMLElement; if(v) v.style.color="#adc5a0"; }}
                >
                  <div style={{ width: 28, height: 28, border: "1px solid #3d6040", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                    <Icon style={{ width: 12, height: 12, color: "#8ab88a" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "#5a9a5a", letterSpacing: ".05em", marginBottom: 1 }}>{label}</div>
                    <div className="cv" style={{ fontSize: 13, color: "#adc5a0", transition: "color .15s", wordBreak: "break-all", display: "flex", alignItems: "center", gap: 3 }}>
                      {value}
                      {external && <ExternalLink style={{ width: 10, height: 10, opacity: .6 }} />}
                    </div>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Disclaimer */}
      <div style={{ background: "#141e14", borderTop: "1px solid #2d5c30" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "2.5rem 2rem" }}>
          <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start", marginBottom: "1.5rem", background: "#1e3020", border: "1px solid #c9a850", borderLeft: "3px solid #c9a850", borderRadius: 4, padding: "1rem 1.2rem" }}>
            <AlertCircle style={{ width: 16, height: 16, color: "#c9a850", flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ fontSize: 11, letterSpacing: ".12em", color: "#c9a850", textTransform: "uppercase", marginBottom: "0.5rem", fontWeight: 500 }}>重要免責聲明</p>
              <p style={{ fontSize: 12, color: "#8ab88a", lineHeight: 2 }}>
                本平台所提供之所有內容，<strong style={{ color: "#d8ecd6" }}>僅供一般健康教育與參考用途，不構成任何醫療診斷、治療建議或醫療行為</strong>。若您有任何健康疑慮、正在服用藥物、懷孕或患有慢性疾病，<strong style={{ color: "#d8ecd6" }}>請務必先諮詢合格醫療專業人員</strong>，再決定是否採用本平台之養生建議。
              </p>
            </div>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}>
            <p style={{ fontSize: 11, color: "#5a9a5a" }}>© 2026 梣數策院 · WarmCare 養生道. 版權所有。</p>
            <div style={{ display: "flex", gap: "1.2rem" }}>
              {["隱私政策", "服務條款", "免責聲明全文"].map((t) => (
                <span key={t} style={{ fontSize: 11, color: "#5a9a5a", cursor: "pointer", transition: "color .15s" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#9ac49a")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#5a9a5a")}
                >{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* RWD styles */}
      <style>{`
        .footer-grid {
          grid-template-columns: 2fr 1fr 1fr 1.2fr;
        }
        @media (max-width: 900px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 2rem !important;
          }
        }
        @media (max-width: 600px) {
          .footer-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </footer>
  );
}
