import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { sessionCookieName } from "@/lib/session";

export async function GET(request: Request) {
  const store = await cookies();
  store.delete(sessionCookieName);
  return NextResponse.redirect(new URL("/login", request.url));
}
