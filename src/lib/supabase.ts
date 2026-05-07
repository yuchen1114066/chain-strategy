import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Generate or retrieve anonymous session ID
export function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let sessionId = localStorage.getItem("ys_session_id");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem("ys_session_id", sessionId);
  }
  return sessionId;
}

export type ConstitutionAssessment = {
  session_id: string;
  primary_constitution: string;
  scores: Record<string, number>;
  answers: number[];
};

export type DailyCheckin = {
  session_id: string;
  constitution: string;
  plan_day: number;
  swelling_level: number;
  skin_tone: number;
  energy_level: number;
  notes: string;
  checkin_date: string;
};

export async function saveAssessment(data: ConstitutionAssessment) {
  const { error } = await supabase
    .from("constitution_assessments")
    .insert(data);
  return { error };
}

export async function getMyAssessments() {
  const sessionId = getSessionId();
  const { data, error } = await supabase
    .from("constitution_assessments")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false });
  return { data, error };
}

export async function saveCheckin(data: DailyCheckin) {
  const { error } = await supabase.from("daily_checkins").insert(data);
  return { error };
}

export async function getMyCheckins() {
  const sessionId = getSessionId();
  const { data, error } = await supabase
    .from("daily_checkins")
    .select("*")
    .eq("session_id", sessionId)
    .order("checkin_date", { ascending: true });
  return { data, error };
}
