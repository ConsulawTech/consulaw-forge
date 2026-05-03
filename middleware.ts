import { NextRequest, NextResponse } from "next/server";

// All path segments that belong to the app itself — never treat these as proposal slugs
const RESERVED = new Set([
  "dashboard",
  "clients",
  "projects",
  "tasks",
  "checkpoints",
  "messages",
  "timeline",
  "settings",
  "proposals",
  "portal",
  "login",
  "api",
  "_next",
  "favicon.ico",
]);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const segments = pathname.split("/").filter(Boolean);

  // Single root-level segment that isn't a known app path → serve as a proposal
  if (
    segments.length === 1 &&
    !RESERVED.has(segments[0]) &&
    /^[a-z0-9][a-z0-9-]*$/.test(segments[0])
  ) {
    return NextResponse.rewrite(
      new URL(`/api/p/${segments[0]}`, request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  // Run on all routes except Next.js internals and static files
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
