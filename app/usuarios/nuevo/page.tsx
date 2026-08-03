import { revalidatePath } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { ArrowLeft, Save, UserPlus } from "lucide-react";
import { z } from "zod";

import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { isUniqueConstraintError } from "@/lib/prisma-errors";

export const dynamic = "force-dynamic";

const userSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  password: z.string().min(8),
  role: z.enum(["ADMIN", "MANAGER", "COLLECTOR"]),
  routeId: z.string().trim().optional(),
});

type NewUserPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function NewUserPage({ searchParams }: NewUserPageProps) {
  const params = (await searchParams) ?? {};
  const error = typeof params.error === "string" ? params.error : "";
  const actor = await requireRole(["ADMIN"]);
  const routes = await prisma.route.findMany({
    where: { companyId: actor.companyId, active: true },
    orderBy: { name: "asc" },
  });

  return (
    <main className="min-h-screen bg-background text-slate-950">
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">Usuarios</p>
            <h1 className="mt-1 text-2xl font-semibold">Nuevo usuario</h1>
          </div>
          <Link
            href="/usuarios"
            className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft size={17} />
            Volver
          </Link>
        </div>

        {error.length > 0 ? <ErrorBanner message={userErrorLabel(error)} /> : null}

        <section className="rounded-lg border border-slate-200 bg-white">
          <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
            <div className="flex size-10 items-center justify-center rounded-md bg-[#50A96B] text-white">
              <UserPlus size={19} />
            </div>
            <div>
              <h2 className="text-base font-semibold">Datos del usuario</h2>
              <p className="text-sm text-slate-500">Alta con acceso activo y auditoria.</p>
            </div>
          </div>

          <form action={createUser} className="space-y-6 p-5">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Nombre">
                <input name="name" required placeholder="Nombre completo" className="field-input" />
              </Field>
              <Field label="Email">
                <input name="email" type="email" required placeholder="usuario@empresa.com" className="field-input" />
              </Field>
              <Field label="Password temporal">
                <input name="password" type="password" required minLength={8} className="field-input" />
              </Field>
              <Field label="Rol">
                <select name="role" className="field-input" defaultValue="COLLECTOR">
                  <option value="COLLECTOR">Cobrador</option>
                  <option value="MANAGER">Supervisor</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </Field>
              <Field label="Ruta inicial">
                <select name="routeId" className="field-input" defaultValue="">
                  <option value="">Sin ruta inicial</option>
                  {routes.map((route) => (
                    <option key={route.id} value={route.id}>
                      {route.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Este usuario queda registrado con acceso activo. El password se puede rotar
              luego desde administracion.
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200 pt-5">
              <Link
                href="/usuarios"
                className="inline-flex h-10 items-center rounded-md border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </Link>
              <button className="inline-flex h-10 items-center gap-2 rounded-md bg-[#50A96B] px-4 text-sm font-medium text-white hover:bg-[#32603d]">
                <Save size={17} />
                Guardar usuario
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
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

async function createUser(formData: FormData) {
  "use server";

  const actor = await requireRole(["ADMIN"]);

  const parsedResult = userSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
    routeId: formData.get("routeId") || undefined,
  });
  if (!parsedResult.success) {
    redirect("/usuarios/nuevo?error=invalid");
  }
  const parsed = parsedResult.data;

  if (parsed.routeId != null) {
    const route = await prisma.route.findFirst({
      where: { id: parsed.routeId, companyId: actor.companyId, active: true },
    });

    if (route == null) {
      redirect("/usuarios/nuevo?error=route");
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          companyId: actor.companyId,
          name: parsed.name,
          email: parsed.email,
          role: parsed.role,
          passwordHash: hashPassword(parsed.password),
        },
      });

      if (parsed.routeId != null) {
        await tx.routeMember.create({
          data: {
            routeId: parsed.routeId,
            userId: user.id,
            permissions: JSON.stringify(["clients:read", "payments:create"]),
          },
        });
      }

      await tx.auditLog.create({
        data: {
          companyId: actor.companyId,
          userId: actor.id,
          action: "CREATE",
          entityType: "User",
          entityId: user.id,
          afterJson: JSON.stringify({
            name: user.name,
            email: user.email,
            role: user.role,
            routeId: parsed.routeId ?? null,
          }),
        },
      });
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      redirect("/usuarios/nuevo?error=duplicate");
    }

    throw error;
  }

  revalidatePath("/usuarios");
  revalidatePath("/rutas");
  revalidatePath("/auditoria");
  redirect("/usuarios");
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
      {message}
    </div>
  );
}

function userErrorLabel(error: string) {
  const labels: Record<string, string> = {
    duplicate: "Ya existe un usuario con ese email.",
    invalid: "Revisa nombre, email, rol y password minimo de 8 caracteres.",
    route: "La ruta seleccionada no esta activa o no pertenece a esta empresa.",
  };

  return labels[error] ?? "No se pudo crear el usuario.";
}
