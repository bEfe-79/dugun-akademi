export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: "admin" | "staff";
  role_label?: string;
  monthly_target: number;
  current_sales: number;
  phone?: string;
  team_name?: string;
  team_logo_url?: string;
  avatar_url?: string;
  last_login?: string;
}

export interface DailyLog {
  id: string;
  user_id: string;
  log_content: string;
  activity_type: ActivityType;
  log_date: string;
  log_time: string;
  created_at: string;
  profiles?: { full_name: string };
}

export type ActivityType =
  | "visit"
  | "call"
  | "email"
  | "meeting"
  | "demo"
  | "other";

export interface DictionaryTerm {
  id: string;
  term_name: string;
  description: string;
  category: string;
}

export interface LibraryArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  created_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  type: "announcement" | "quote_of_day" | "alert";
}

export const ACTIVITY_META: Record<ActivityType, { label: string; icon: string; color: string }> = {
  call:    { label: "Satış Görüşmesi", icon: "📞", color: "bg-emerald-500/15 text-emerald-700 border-emerald-200" },
  visit:   { label: "Randevu Araması", icon: "📅", color: "bg-blue-500/15 text-blue-700 border-blue-200" },
  meeting: { label: "Ekip Toplantısı", icon: "🤝", color: "bg-violet-500/15 text-violet-700 border-violet-200" },
  demo:    { label: "Demo",            icon: "🎯", color: "bg-rose-500/15 text-rose-700 border-rose-200" },
  email:   { label: "E-posta",         icon: "✉️", color: "bg-amber-500/15 text-amber-700 border-amber-200" },
  other:   { label: "Diğer",           icon: "📌", color: "bg-slate-100 text-slate-600 border-slate-200" },
};

export const ROLE_LABELS: Record<string, string> = {
  staff: "Satış Profesyoneli",
  admin: "Sayfa Yöneticisi",
};
