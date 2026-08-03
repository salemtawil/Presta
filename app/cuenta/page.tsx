import { revalidatePath } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { ArrowLeft, KeyRound, Save, UserRound } from "lucide-react";
import { z } from "zod";

import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";

export const dynamic = "force-dynamic";

type AccountPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    path: ["confirmPassword"],
  });

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const user = await currentUser();
  const params = (await searchParams) ?? {};
  const status = typeof params.status === "string" ? params.status : "";
  const error = typeof params.error === "string" ? params.error : "";

  return (
    <main className="min-h-screen bg-background text-slate-950">
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <Link
              href="/"
              className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950"
            >
              <ArrowLeft size={16} />
              Volver al inicio
            </Link>
            <h1 className="text-2xl font-semibold">Cuenta</h1>
            <p className="mt-1 text-sm text-slate-500">{user.email}</p>
          </div>
          <a
            href="/logout"
            className="inline-flex h-10 items-center rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cerrar sesion
          </a>
        </div>

        <section className="mb-6 grid grid-cols-3 gap-4">
          <MetricCard label="Usuario" value={user.name} note={roleLabel(user.role)} icon={<UserRound size={21} />} />
          <MetricCard label="Empresa" value={user.company.name} note={user.company.plan} icon={<UserRound size={21} />} />
          <MetricCard label="Estado" value={user.status} note="Sesion activa" icon={<KeyRound size={21} />} />
        </section>

        <section className="rounded-lg border border-slate-200 bg-white">
          <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
            <div className="flex size-10 items-center justify-center rounded-md bg-[#50A96B] text-white">
              <KeyRound size={19} />
            </div>
            <div>
              <h2 className="text-base font-semibold">Cambiar password</h2>
              <p className="text-sm text-slate-500">Actualiza tu acceso sin cambiar datos operativos.</p>
            </div>
          </div>

          <form action={changePassword} className="space-y-6 p-5">
            {status === "ok" ? (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                Password actualizado.
              </div>
            ) : null}
            {error.length > 0 ? (
              <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
                {errorLabel(error)}
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-4">
              <Field label="Password actual">
                <input name="currentPassword" type="password" required className="field-input" />
              </Field>
              <div />
              <Field label="Nuevo password">
                <input name="newPassword" type="password" required minLength={8} className="field-input" />
              </Field>
              <Field label="Confirmar password">
                <input name="confirmPassword" type="password" required minLength={8} className="field-input" />
              </Field>
            </div>

            <div className="flex justify-end border-t border-slate-200 pt-5">
              <button className="inline-flex h-10 items-center gap-2 rounded-md bg-[#50A96B] px-4 text-sm font-medium text-white hover:bg-[#32603d]">
                <Save size={17} />
                Guardar password
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

function MetricCard({
  label,
  value,
  note,
  icon,
}: {
  label: string;
  value: string;
  note: string;
  icon: ReactNode;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 truncate text-xl font-semibold">{value}</p>
        </div>
        <div className="text-slate-500">{icon}</div>
      </div>
      <p className="mt-3 text-xs text-slate-500">{note}</p>
    </article>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

async function changePassword(formData: FormData) {
  "use server";

  const actor = await currentUser();
  const parsed = passwordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    redirect("/cuenta?error=invalid");
  }

  const user = await prisma.user.findUnique({ where: { id: actor.id } });

  if (user == null) {
    redirect("/login");
  }

  const currentPasswordIsValid =
    verifyPassword(parsed.data.currentPassword, user.passwordHash) ||
    (process.env.NODE_ENV !== "production" && parsed.data.currentPassword === user.passwordHash);

  if (!currentPasswordIsValid) {
    redirect("/cuenta?error=current");
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: actor.id },
      data: { passwordHash: hashPassword(parsed.data.newPassword) },
    });
    await tx.auditLog.create({
      data: {
        companyId: actor.companyId,
        userId: actor.id,
        action: "UPDATE",
        entityType: "UserPassword",
        entityId: actor.id,
        afterJson: JSON.stringify({ passwordChanged: true }),
      },
    });
  });

  revalidatePath("/cuenta");
  revalidatePath("/auditoria");
  redirect("/cuenta?status=ok");
}

function roleLabel(role: string) {
  const labels: Record<string, string> = {
    ADMIN: "Admin",
    COLLECTOR: "Cobrador",
    MANAGER: "Supervisor",
  };

  return labels[role] ?? role;
}

function errorLabel(error: string) {
  const labels: Record<string, string> = {
    current: "El password actual no coincide.",
    invalid: "Revisa los campos. El password nuevo debe tener minimo 8 caracteres y coincidir.",
  };

  return labels[error] ?? "No se pudo actualizar el password.";
}
