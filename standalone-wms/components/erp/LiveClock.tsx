"use client";

import { useEffect, useState } from "react";

export default function LiveClock() {
  const [now, setNow] = useState<string>("");
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      const wd = ["日", "一", "二", "三", "四", "五", "六"][d.getDay()];
      setNow(
        `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}` +
        `　${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} (${wd})`
      );
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);
  return <span className="tabular-nums">{now}</span>;
}
