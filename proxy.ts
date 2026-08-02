import { NextResponse, type NextRequest } from "next/server";

import { decodeSession, sessionCookieName } from "@/lib/session";

const publicPrefixes = ["/login", "/_next", "/favicon.ico"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (publicPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  const session = await decodeSession(request.cookies.get(sessionCookieName)?.value);

  if (session == null) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.*\\..*).*)"],
};
