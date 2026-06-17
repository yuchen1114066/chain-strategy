// /api/auth/logout — 清掉 session cookie
//
// 兩個 method 都接受（POST 給 form 用、GET 給 link 用）

import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth-edge";

export const runtime = "edge";

function clear(): NextResponse {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}

export async function POST() {
  return clear();
}

export async function GET() {
  return clear();
}
