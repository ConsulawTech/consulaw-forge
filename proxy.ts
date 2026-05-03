import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Known app path segments — never treat these as proposal slugs
const RESERVED = new Set([
  "dashboard", "clients", "projects", "tasks", "checkpoints", "messages",
  "timeline", "settings", "proposals", "portal", "login", "api", "_next", "favicon.ico",
]);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const segments = pathname.split("/").filter(Boolean);

  // Single root-level segment that isn't a known app path → serve as a public proposal
  if (
    segments.length === 1 &&
    !RESERVED.has(segments[0]) &&
    /^[a-z0-9][a-z0-9-]*$/.test(segments[0])
  ) {
    return NextResponse.rewrite(new URL(`/api/p/${segments[0]}`, request.url));
  }

  // If env vars aren't set, allow the request through so pages can handle auth
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Public routes — allow unauthenticated
  if (pathname.startsWith("/login")) {
    if (user) {
      const role = await getUserRole(supabase, user.id);
      return NextResponse.redirect(
        new URL(role === "client" ? "/portal" : "/dashboard", request.url)
      );
    }
    return supabaseResponse;
  }

  // Protected routes
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const role = await getUserRole(supabase, user.id);

  // Root redirect
  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(role === "client" ? "/portal" : "/dashboard", request.url)
    );
  }

  // Clients can only access /portal
  if (role === "client" && !pathname.startsWith("/portal")) {
    return NextResponse.redirect(new URL("/portal", request.url));
  }

  // Team members cannot access /portal
  if (role === "team" && pathname.startsWith("/portal")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return supabaseResponse;
}

async function getUserRole(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string
): Promise<string> {
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  return data?.role ?? "team";
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
