import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  await supabase.auth.getSession();

  const { pathname } = request.nextUrl;

  // Cookie'den session var mi kontrol et
  const sessionCookie = request.cookies.getAll()
    .find(c => c.name.startsWith("sb-") && c.name.endsWith("-auth-token"));

  const isProtected = ["/dashboard", "/logs", "/library", "/admin"]
    .some(p => pathname.startsWith(p));

  // Giris yapilmamis + korumal rota → login
  if (!sessionCookie && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Ana sayfa → login'e yonlendir
  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = sessionCookie ? "/dashboard" : "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
