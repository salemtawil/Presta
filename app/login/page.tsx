import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LockKeyhole, LogIn } from "lucide-react";

import { prisma } from "@/lib/db";
import { demoPassword } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { encodeSession, sessionCookieName } from "@/lib/session";

export const dynamic = "force-dynamic";

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = (await searchParams) ?? {};
  const error = typeof params.error === "string" ? params.error : "";
  const next = safeNextPath(typeof params.next === "string" ? params.next : "/");

  return (
    <main className="grid min-h-screen grid-cols-[1fr_440px] bg-[#D5F0D1] text-slate-950 max-[900px]:grid-cols-1">
      <section className="flex items-center px-12 max-[900px]:hidden">
        <div className="max-w-2xl">
          <div className="flex size-12 items-center justify-center rounded-md bg-[#50A96B] text-lg font-bold text-white">
            P
          </div>
          <h1 className="mt-8 text-4xl font-semibold tracking-normal">
            Presta operativo, listo para cartera real.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
            Clientes, prestamos, abonos, caja, rutas, auditoria y balances en un
            flujo protegido por sesion.
          </p>
        </div>
      </section>

      <section className="flex items-center border-l border-slate-200 bg-white px-8 max-[900px]:border-l-0">
        <div className="w-full">
          <div className="mb-8">
            <div className="mb-4 flex size-11 items-center justify-center rounded-md bg-[#50A96B] text-white">
              <LockKeyhole size={20} />
            </div>
            <h2 className="text-2xl font-semibold">Iniciar sesion</h2>
            <p className="mt-2 text-sm text-slate-500">
              Usa un usuario activo de la empresa demo.
            </p>
          </div>

          {error.length > 0 ? (
            <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
              Credenciales invalidas.
            </div>
          ) : null}

          <form action={login} className="space-y-4">
            <input type="hidden" name="next" value={next} />
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Email</span>
              <input
                name="email"
                type="email"
                required
                defaultValue="admin@presta.local"
                className="field-input"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Password</span>
              <input
                name="password"
                type="password"
                required
                defaultValue={demoPassword()}
                className="field-input"
              />
            </label>
            <button className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#50A96B] px-4 text-sm font-medium text-white hover:bg-[#32603d]">
              <LogIn size={17} />
              Entrar
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

async function login(formData: FormData) {
  "use server";

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeNextPath(String(formData.get("next") ?? "/"));
  const user = await prisma.user.findUnique({ where: { email } });
  const valid =
    user != null &&
    user.status === "ACTIVE" &&
    (verifyPassword(password, user.passwordHash) ||
      (allowLegacyPlaintextPassword() && password === user.passwordHash));

  if (!valid) {
    redirect(`/login?error=1&next=${encodeURIComponent(next)}`);
  }

  const store = await cookies();
  store.set(
    sessionCookieName,
    await encodeSession({
      userId: user.id,
      companyId: user.companyId,
      email: user.email,
      role: user.role,
    }),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 12,
    },
  );

  redirect(next);
}

function safeNextPath(value: string) {
  return value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

function allowLegacyPlaintextPassword() {
  return process.env.NODE_ENV !== "production" || process.env.PRESTA_ALLOW_PLAINTEXT_PASSWORDS === "true";
}
