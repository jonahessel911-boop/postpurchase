import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAdminEmail } from "@/lib/demo-accounts";
import { getSupabaseEnv } from "@/lib/supabase/env";

function loginPathForRoute(pathname: string): string {
  if (pathname.startsWith("/admin")) return "/login/admin";
  return "/login/advertiser";
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const { url, key } = getSupabaseEnv();

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAdmin = isAdminEmail(user?.email);

  const isAuthPage =
    pathname.startsWith("/login") || pathname.startsWith("/signup");

  const isPublicPage =
    isAuthPage ||
    pathname.startsWith("/setup") ||
    pathname.startsWith("/api/demo") ||
    pathname.startsWith("/api/widget") ||
    pathname.startsWith("/api/click") ||
    pathname.startsWith("/embed") ||
    pathname.startsWith("/widget") ||
    pathname.startsWith("/p/");

  if (pathname === "/") {
    const redirectUrl = request.nextUrl.clone();
    if (!user) {
      redirectUrl.pathname = "/login/advertiser";
      return NextResponse.redirect(redirectUrl);
    }
    redirectUrl.pathname = isAdmin ? "/admin" : "/dashboard";
    return NextResponse.redirect(redirectUrl);
  }

  if (pathname.startsWith("/admin")) {
    if (!user) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/login/admin";
      return NextResponse.redirect(redirectUrl);
    }
    if (!isAdmin) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/dashboard";
      return NextResponse.redirect(redirectUrl);
    }
  }

  if (pathname.startsWith("/publisher") && user) {
    return supabaseResponse;
  }

  if (!user && !isPublicPage) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = loginPathForRoute(pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && isAuthPage) {
    const redirectUrl = request.nextUrl.clone();
    if (pathname.startsWith("/login/publisher")) {
      redirectUrl.pathname = "/publisher/manager";
    } else {
      redirectUrl.pathname = isAdmin ? "/admin" : "/dashboard";
    }
    return NextResponse.redirect(redirectUrl);
  }

  if (user && !isAdmin && pathname.startsWith("/login/admin")) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/dashboard";
    return NextResponse.redirect(redirectUrl);
  }

  if (user && isAdmin && pathname.startsWith("/login/advertiser")) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/admin";
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}
