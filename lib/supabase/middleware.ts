import { updateSession } from "@/lib/supabase/middleware";
export async function middleware(request) {
  return await updateSession(request);
}
