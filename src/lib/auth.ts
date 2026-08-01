import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { decodeSession, sessionCookieName } from "@/lib/session";

export type UserRole = "ADMIN" | "MANAGER" | "COLLECTOR";

export async function currentSession() {
  const store = await cookies();
  return decodeSession(store.get(sessionCookieName)?.value);
}

export async function requireSession() {
  const session = await currentSession();

  if (session == null) {
    redirect("/login");
  }

  return session;
}

export async function currentUser() {
  const session = await requireSession();
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { company: true },
  });

  if (user == null || user.status !== "ACTIVE") {
    redirect("/login");
  }

  return user;
}

export async function requireRole(allowedRoles: UserRole[]) {
  const user = await currentUser();

  if (!allowedRoles.includes(user.role as UserRole)) {
    throw new Error("No tienes permisos para ejecutar esta accion.");
  }

  return user;
}

export function demoPassword() {
  return process.env.PRESTA_DEMO_PASSWORD ?? process.env.PRESTA_SEED_PASSWORD ?? "demo-only";
}
