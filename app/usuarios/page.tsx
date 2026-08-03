import { revalidatePath } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { KeyRound, Plus, Power, Save, ShieldCheck, UserRound, Users } from "lucide-react";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { formatShortDate } from "@/lib/format";
import { hashPassword } from "@/lib/password";

export const dynamic = "force-dynamic";

type UsersPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const updateRoleSchema = z.object({
  userId: z.string().trim().min(1),
  role: z.enum(["ADMIN", "MANAGER", "COLLECTOR"]),
});

const toggleStatusSchema = z.object({
  userId: z.string().trim().min(1),
  confirmAction: z.literal("on"),
});

const resetPasswordSchema = z.object({
  userId: z.string().trim().min(1),
  password: z.string().min(8),
});

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const params = (await searchParams) ?? {};
  const status = typeof params.status === "string" ? params.status : "";
  const error = typeof params.error === "string" ? params.error : "";
  const data = await getUsersData();

  return (
    <main className="min-h-screen bg-[#D5F0D1] text-slate-950">
      <div className="grid min-h-screen grid-cols-[248px_1fr]">
        <aside className="border-r border-slate-200 bg-white">
          <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-5">
            <div className="flex size-9 items-center justify-center rounded-md bg-slate-950 text-sm font-bold text-white">
              P
            </div>
            <div>
              <p className="text-sm font-semibold">Presta</p>
              <p className="text-xs text-slate-500">MVP web</p>
            </div>
          </div>
          <nav className="space-y-1 px-3 py-4">
            {[
              ["Inicio", "/"],
              ["Clientes", "/clientes"],
              ["Prestamos", "/prestamos"],
              ["Abonos", "/abonos"],
              ["Caja", "/caja"],
              ["Gastos", "/gastos"],
              ["Resumen", "/resumen"],
              ["Balances", "/balances"],
              ["Rutas", "/rutas"],
              ["Usuarios", "/usuarios"],
              ["Auditoria", "/auditoria"],
              ["Empresa", "/empresa"],
            ].map(([label, href]) => (
              <Link
                key={label}
                href={href}
                className={`flex h-10 items-center rounded-md px-3 text-sm font-medium ${
                  label === "Usuarios"
                    ? "bg-slate-950 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </aside>

        <section className="min-w-0">
          <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-8">
            <div>
              <p className="text-xs text-slate-500">Gestion interna</p>
              <h1 className="text-lg font-semibold">Usuarios</h1>
            </div>
            <Link
              href="/usuarios/nuevo"
              className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-medium text-white hover:bg-slate-800"
            >
              <Plus size={17} />
              Nuevo usuario
            </Link>
          </header>

          <div className="space-y-6 px-8 py-7">
            {status.length > 0 || error.length > 0 ? (
              <div
                className={`rounded-md border px-3 py-2 text-sm font-medium ${
                  error.length > 0
                    ? "border-rose-200 bg-rose-50 text-rose-700"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700"
                }`}
              >
                {error.length > 0 ? userErrorLabel(error) : userStatusLabel(status)}
              </div>
            ) : null}

            <section className="grid grid-cols-4 gap-4">
              <MetricCard
                label="Usuarios"
                value={String(data.totalUsers)}
                note={`${data.activeUsers} activos`}
                icon={<Users size={21} />}
              />
              <MetricCard
                label="Admins"
                value={String(data.adminUsers)}
                note="Acceso completo"
                icon={<ShieldCheck size={21} />}
              />
              <MetricCard
                label="Cobradores"
                value={String(data.collectors)}
                note="Operacion de ruta"
                icon={<UserRound size={21} />}
              />
              <MetricCard
                label="Asignaciones"
                value={String(data.totalMemberships)}
                note="Usuario-ruta"
                icon={<ShieldCheck size={21} />}
              />
            </section>

            <section className="rounded-lg border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-5 py-4">
                <h2 className="text-base font-semibold">Equipo operativo</h2>
                <p className="text-sm text-slate-500">
                  Usuarios, roles y rutas asignadas
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Usuario</th>
                      <th className="px-5 py-3 font-semibold">Rol</th>
                      <th className="px-5 py-3 font-semibold">Estado</th>
                      <th className="px-5 py-3 font-semibold">Rutas</th>
                      <th className="px-5 py-3 font-semibold">Creado</th>
                      <th className="px-5 py-3 font-semibold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.users.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50/70">
                        <td className="px-5 py-4">
                          <p className="font-semibold">{user.name}</p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </td>
                        <td className="px-5 py-4 text-slate-600">{roleLabel(user.role)}</td>
                        <td className="px-5 py-4">
                          <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${statusStyle(user.status)}`}>
                            {user.status === "ACTIVE" ? "Activo" : user.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          {user.routes.length === 0
                            ? "Sin rutas"
                            : user.routes.map((route) => route.name).join(", ")}
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          {formatShortDate(user.createdAt)}
                        </td>
                        <td className="min-w-[440px] px-5 py-4">
                          {data.canManageUsers ? (
                            <div className="space-y-2">
                              <form action={updateUserRole} className="flex gap-2">
                                <input type="hidden" name="userId" value={user.id} />
                                <select name="role" defaultValue={user.role} className="h-9 rounded-md border border-slate-200 bg-white px-2 text-xs outline-none focus:border-slate-400">
                                  <option value="COLLECTOR">Cobrador</option>
                                  <option value="MANAGER">Supervisor</option>
                                  <option value="ADMIN">Admin</option>
                                </select>
                                <button className="inline-flex h-9 items-center gap-1 rounded-md border border-slate-200 px-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                                  <Save size={14} />
                                  Rol
                                </button>
                              </form>
                              <div className="flex flex-wrap gap-2">
                                <form action={toggleUserStatus} className="flex gap-2">
                                  <input type="hidden" name="userId" value={user.id} />
                                  <label className="flex h-9 items-center gap-1 rounded-md border border-slate-200 px-2 text-xs font-medium text-slate-600">
                                    <input name="confirmAction" type="checkbox" required className="size-3" />
                                    Confirmo
                                  </label>
                                  <button className="inline-flex h-9 items-center gap-1 rounded-md border border-slate-200 px-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                                    <Power size={14} />
                                    {user.status === "ACTIVE" ? "Desactivar" : "Activar"}
                                  </button>
                                </form>
                                <form action={resetUserPassword} className="flex gap-2">
                                  <input type="hidden" name="userId" value={user.id} />
                                  <input
                                    name="password"
                                    type="password"
                                    required
                                    minLength={8}
                                    placeholder="Nuevo password"
                                    className="h-9 w-36 rounded-md border border-slate-200 px-2 text-xs outline-none focus:border-slate-400"
                                  />
                                  <button className="inline-flex h-9 items-center gap-1 rounded-md border border-slate-200 px-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                                    <KeyRound size={14} />
                                    Reset
                                  </button>
                                </form>
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs font-medium text-slate-500">
                              Solo lectura
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-5 py-4">
                <h2 className="text-base font-semibold">Actividad reciente</h2>
                <p className="text-sm text-slate-500">Ultimas acciones auditadas por usuarios</p>
              </div>
              <div className="divide-y divide-slate-100">
                {data.auditLogs.map((log) => (
                  <div key={log.id} className="grid grid-cols-[1fr_auto] gap-4 px-5 py-4 text-sm">
                    <div>
                      <p className="font-semibold">
                        {log.action} {log.entityType}
                      </p>
                      <p className="text-slate-500">{log.userName}</p>
                    </div>
                    <p className="text-slate-500">{formatShortDate(log.createdAt)}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
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
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold">{value}</p>
        </div>
        <div className="text-slate-500">{icon}</div>
      </div>
      <p className="mt-3 text-xs text-slate-500">{note}</p>
    </article>
  );
}

async function getUsersData() {
  const actor = await requireRole(["ADMIN", "MANAGER"]);
  const [users, auditLogs] = await Promise.all([
    prisma.user.findMany({
      where: { companyId: actor.companyId },
      include: { routeMembers: { include: { route: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.auditLog.findMany({
      where: { companyId: actor.companyId },
      include: { user: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  return {
    users: users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      routes: user.routeMembers.map((member) => ({
        id: member.route.id,
        name: member.route.name,
      })),
    })),
    auditLogs: auditLogs.map((log) => ({
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      createdAt: log.createdAt,
      userName: log.user.name,
    })),
    totalUsers: users.length,
    activeUsers: users.filter((user) => user.status === "ACTIVE").length,
    adminUsers: users.filter((user) => user.role === "ADMIN").length,
    collectors: users.filter((user) => user.role === "COLLECTOR").length,
    totalMemberships: users.reduce((total, user) => total + user.routeMembers.length, 0),
    canManageUsers: actor.role === "ADMIN",
  };
}

function roleLabel(role: string) {
  const labels: Record<string, string> = {
    ADMIN: "Admin",
    COLLECTOR: "Cobrador",
    MANAGER: "Supervisor",
  };

  return labels[role] ?? role;
}

async function updateUserRole(formData: FormData) {
  "use server";

  const actor = await requireRole(["ADMIN"]);
  const parsed = updateRoleSchema.safeParse({
    userId: formData.get("userId"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    redirect("/usuarios?error=invalid");
  }

  const user = await prisma.user.findFirst({
    where: { id: parsed.data.userId, companyId: actor.companyId },
  });

  if (user == null) {
    redirect("/usuarios?error=not-found");
  }

  if (user.role === "ADMIN" && parsed.data.role !== "ADMIN") {
    const activeAdmins = await prisma.user.count({
      where: { companyId: actor.companyId, role: "ADMIN", status: "ACTIVE" },
    });

    if (user.status === "ACTIVE" && activeAdmins <= 1) {
      redirect("/usuarios?error=last-admin");
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: { role: parsed.data.role },
    });
    await tx.auditLog.create({
      data: {
        companyId: actor.companyId,
        userId: actor.id,
        action: "UPDATE",
        entityType: "UserRole",
        entityId: user.id,
        beforeJson: JSON.stringify({ role: user.role }),
        afterJson: JSON.stringify({ role: parsed.data.role }),
      },
    });
  });

  revalidatePath("/usuarios");
  revalidatePath("/auditoria");
  redirect("/usuarios?status=role");
}

async function toggleUserStatus(formData: FormData) {
  "use server";

  const actor = await requireRole(["ADMIN"]);
  const parsed = toggleStatusSchema.safeParse({
    userId: formData.get("userId"),
    confirmAction: formData.get("confirmAction"),
  });

  if (!parsed.success) {
    redirect("/usuarios?error=confirm");
  }

  if (parsed.data.userId === actor.id) {
    redirect("/usuarios?error=self");
  }

  const user = await prisma.user.findFirst({
    where: { id: parsed.data.userId, companyId: actor.companyId },
  });

  if (user == null) {
    redirect("/usuarios?error=not-found");
  }

  const nextStatus = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

  if (user.role === "ADMIN" && nextStatus !== "ACTIVE") {
    const activeAdmins = await prisma.user.count({
      where: { companyId: actor.companyId, role: "ADMIN", status: "ACTIVE" },
    });

    if (activeAdmins <= 1) {
      redirect("/usuarios?error=last-admin");
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: { status: nextStatus },
    });
    await tx.auditLog.create({
      data: {
        companyId: actor.companyId,
        userId: actor.id,
        action: nextStatus === "ACTIVE" ? "ACTIVATE" : "DEACTIVATE",
        entityType: "User",
        entityId: user.id,
        beforeJson: JSON.stringify({ status: user.status }),
        afterJson: JSON.stringify({ status: nextStatus }),
      },
    });
  });

  revalidatePath("/usuarios");
  revalidatePath("/auditoria");
  redirect("/usuarios?status=status");
}

async function resetUserPassword(formData: FormData) {
  "use server";

  const actor = await requireRole(["ADMIN"]);
  const parsed = resetPasswordSchema.safeParse({
    userId: formData.get("userId"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect("/usuarios?error=password");
  }

  const user = await prisma.user.findFirst({
    where: { id: parsed.data.userId, companyId: actor.companyId },
  });

  if (user == null) {
    redirect("/usuarios?error=not-found");
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: { passwordHash: hashPassword(parsed.data.password) },
    });
    await tx.auditLog.create({
      data: {
        companyId: actor.companyId,
        userId: actor.id,
        action: "UPDATE",
        entityType: "UserPassword",
        entityId: user.id,
        afterJson: JSON.stringify({ resetByAdmin: true }),
      },
    });
  });

  revalidatePath("/usuarios");
  revalidatePath("/auditoria");
  redirect("/usuarios?status=password");
}

function statusStyle(status: string) {
  return status === "ACTIVE"
    ? "bg-emerald-50 text-emerald-700"
    : "bg-slate-100 text-slate-600";
}

function userStatusLabel(status: string) {
  const labels: Record<string, string> = {
    role: "Rol actualizado.",
    status: "Estado de usuario actualizado.",
    password: "Password reseteado.",
  };

  return labels[status] ?? "Operacion completada.";
}

function userErrorLabel(error: string) {
  const labels: Record<string, string> = {
    confirm: "Confirma la accion antes de continuar.",
    invalid: "Revisa los datos enviados.",
    "last-admin": "No puedes dejar la empresa sin un admin activo.",
    "not-found": "Usuario no encontrado para esta empresa.",
    password: "El password debe tener minimo 8 caracteres.",
    self: "No puedes desactivar tu propio usuario.",
  };

  return labels[error] ?? "No se pudo completar la accion.";
}
