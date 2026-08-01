import { revalidatePath } from "next/cache";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  BadgeDollarSign,
  Plus,
  Power,
  RouteIcon,
  UserPlus,
  Users,
} from "lucide-react";
import { z } from "zod";

import { currentUser, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatMoney, formatShortDate } from "@/lib/format";
import { loanBalance } from "@/lib/payments";

export const dynamic = "force-dynamic";

type RouteDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const assignClientSchema = z.object({
  routeId: z.string().trim().min(1),
  clientId: z.string().trim().min(1),
});

const addMemberSchema = z.object({
  routeId: z.string().trim().min(1),
  userId: z.string().trim().min(1),
});

const toggleRouteSchema = z.object({
  routeId: z.string().trim().min(1),
  confirmAction: z.literal("on"),
});

export default async function RouteDetailPage({ params, searchParams }: RouteDetailPageProps) {
  const { id } = await params;
  const query = (await searchParams) ?? {};
  const error = typeof query.error === "string" ? query.error : "";
  const data = await getRouteDetail(id);

  if (data == null) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-slate-950">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {error.length > 0 ? (
          <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
            {routeErrorLabel(error)}
          </div>
        ) : null}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <Link
              href="/rutas"
              className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950"
            >
              <ArrowLeft size={16} />
              Volver a rutas
            </Link>
            <h1 className="text-2xl font-semibold">{data.name}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {data.description ?? "Sin descripcion"} - {data.active ? "activa" : "inactiva"}
            </p>
          </div>
          <form action={toggleRouteStatus}>
            <input type="hidden" name="routeId" value={data.id} />
            <div className="flex gap-2">
              <label className="flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600">
                <input name="confirmAction" type="checkbox" required className="size-4" />
                Confirmo
              </label>
              <button className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50">
                <Power size={17} />
                {data.active ? "Desactivar" : "Activar"}
              </button>
            </div>
          </form>
        </div>

        <section className="mb-6 grid grid-cols-4 gap-4">
          <MetricCard
            label="Clientes"
            value={String(data.clients.length)}
            note="Asignados a esta ruta"
            icon={<Users size={21} />}
          />
          <MetricCard
            label="Miembros"
            value={String(data.members.length)}
            note="Cobradores/admins asignados"
            icon={<UserPlus size={21} />}
          />
          <MetricCard
            label="Cartera"
            value={formatMoney(data.balance)}
            note={`${data.activeLoans} prestamos activos`}
            icon={<BadgeDollarSign size={21} />}
          />
          <MetricCard
            label="Cobrado"
            value={formatMoney(data.collected)}
            note="Abonos asociados"
            icon={<RouteIcon size={21} />}
          />
        </section>

        <section className="mb-6 grid grid-cols-[1fr_1fr] gap-5">
          <article className="rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-base font-semibold">Asignar cliente</h2>
              <p className="text-sm text-slate-500">
                Mueve clientes activos a esta ruta.
              </p>
            </div>
            <form action={assignClientToRoute} className="flex gap-2 p-5">
              <input type="hidden" name="routeId" value={data.id} />
              <select name="clientId" className="field-input" required>
                {data.assignableClients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.fullName} - {client.currentRouteName}
                  </option>
                ))}
              </select>
              <button className="inline-flex h-10 shrink-0 items-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-medium text-white hover:bg-slate-800">
                <Plus size={17} />
                Asignar
              </button>
            </form>
            {data.assignableClients.length === 0 ? (
              <div className="px-5 pb-5 text-sm text-slate-500">
                No hay clientes disponibles para mover.
              </div>
            ) : null}
          </article>

          <article className="rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-base font-semibold">Agregar miembro</h2>
              <p className="text-sm text-slate-500">
                Asigna usuarios para operar esta ruta.
              </p>
            </div>
            <form action={addMemberToRoute} className="flex gap-2 p-5">
              <input type="hidden" name="routeId" value={data.id} />
              <select name="userId" className="field-input" required>
                {data.assignableUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} - {user.role}
                  </option>
                ))}
              </select>
              <button className="inline-flex h-10 shrink-0 items-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-medium text-white hover:bg-slate-800">
                <UserPlus size={17} />
                Agregar
              </button>
            </form>
            {data.assignableUsers.length === 0 ? (
              <div className="px-5 pb-5 text-sm text-slate-500">
                Todos los usuarios activos ya pertenecen a esta ruta.
              </div>
            ) : null}
          </article>
        </section>

        <section className="mb-6 grid grid-cols-[1.1fr_0.9fr] gap-5">
          <article className="rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-base font-semibold">Clientes de la ruta</h2>
              <p className="text-sm text-slate-500">Clientes, saldo y estado operativo</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Cliente</th>
                    <th className="px-5 py-3 font-semibold">Documento</th>
                    <th className="px-5 py-3 text-right font-semibold">Saldo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.clients.map((client) => (
                    <tr key={client.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-4">
                        <Link
                          href={`/clientes/${client.id}`}
                          className="font-semibold hover:underline"
                        >
                          {client.fullName}
                        </Link>
                        <p className="text-xs text-slate-500">
                          {client.phone ?? "Sin telefono"}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-slate-600">{client.documentNumber}</td>
                      <td className="px-5 py-4 text-right font-semibold">
                        {formatMoney(client.balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <article className="rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-base font-semibold">Miembros</h2>
              <p className="text-sm text-slate-500">Usuarios con acceso a esta ruta</p>
            </div>
            <div className="divide-y divide-slate-100">
              {data.members.map((member) => (
                <div key={member.id} className="px-5 py-4">
                  <p className="font-semibold">{member.name}</p>
                  <p className="text-sm text-slate-500">
                    {member.email} - {roleLabel(member.role)}
                  </p>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-base font-semibold">Prestamos recientes</h2>
            <p className="text-sm text-slate-500">Operaciones asociadas a la ruta</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Codigo</th>
                  <th className="px-5 py-3 font-semibold">Cliente</th>
                  <th className="px-5 py-3 font-semibold">Fecha</th>
                  <th className="px-5 py-3 text-right font-semibold">Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.loans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-4">
                      <Link href={`/prestamos/${loan.id}`} className="font-semibold hover:underline">
                        {loan.code}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{loan.clientName}</td>
                    <td className="px-5 py-4 text-slate-600">
                      {formatShortDate(loan.createdAt)}
                    </td>
                    <td className="px-5 py-4 text-right font-semibold">
                      {formatMoney(loan.balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

async function getRouteDetail(id: string) {
  const actor = await currentUser();
  const [route, allClients, users, payments] = await Promise.all([
    prisma.route.findFirst({
      where: { id, companyId: actor.companyId },
      include: {
        clients: {
          include: {
            loans: {
              where: { status: { not: "VOIDED" } },
              include: { payments: true },
            },
          },
          orderBy: { fullName: "asc" },
        },
        members: { include: { user: true } },
        loans: {
          where: { status: { not: "VOIDED" } },
          include: { payments: true, client: true },
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    prisma.client.findMany({
      where: { companyId: actor.companyId, status: "ACTIVE" },
      include: { route: true },
      orderBy: { fullName: "asc" },
    }),
    prisma.user.findMany({
      where: { companyId: actor.companyId, status: "ACTIVE" },
      orderBy: { name: "asc" },
    }),
    prisma.payment.findMany({ where: { companyId: actor.companyId, routeId: id, voidedAt: null } }),
  ]);

  if (route == null) {
    return null;
  }

  const clients = route.clients.map((client) => {
    const balance = client.loans.reduce(
      (total, loan) =>
        total +
        loanBalance(
          loan.totalAmount,
          loan.payments
            .filter((payment) => payment.voidedAt == null)
            .map((payment) => payment.amount),
        ),
      0,
    );

    return {
      id: client.id,
      fullName: client.fullName,
      documentNumber: client.documentNumber,
      phone: client.phone,
      balance,
    };
  });
  const memberUserIds = new Set(route.members.map((member) => member.userId));
  const loans = route.loans.map((loan) => ({
    id: loan.id,
    code: loan.code,
    clientName: loan.client.fullName,
    createdAt: loan.createdAt,
    status: loan.status,
    balance: loanBalance(
      loan.totalAmount,
      loan.payments
        .filter((payment) => payment.voidedAt == null)
        .map((payment) => payment.amount),
    ),
  }));

  return {
    id: route.id,
    name: route.name,
    description: route.description,
    active: route.active,
    clients,
    loans,
    members: route.members.map((member) => ({
      id: member.id,
      name: member.user.name,
      email: member.user.email,
      role: member.user.role,
    })),
    assignableClients: allClients
      .filter((client) => client.routeId !== route.id)
      .map((client) => ({
        id: client.id,
        fullName: client.fullName,
        currentRouteName: client.route.name,
      })),
    assignableUsers: users.filter((user) => !memberUserIds.has(user.id)),
    activeLoans: loans.filter((loan) => loan.status === "ACTIVE").length,
    balance: loans.reduce((total, loan) => total + loan.balance, 0),
    collected: payments.reduce((total, payment) => total + payment.amount, 0),
  };
}

async function assignClientToRoute(formData: FormData) {
  "use server";

  const actor = await requireRole(["ADMIN", "MANAGER"]);
  const parsedResult = assignClientSchema.safeParse({
    routeId: formData.get("routeId"),
    clientId: formData.get("clientId"),
  });
  if (!parsedResult.success) {
    redirect("/rutas?error=invalid");
  }
  const parsed = parsedResult.data;

  const before = await prisma.client.findFirst({
    where: { id: parsed.clientId, companyId: actor.companyId },
    select: { companyId: true, routeId: true, fullName: true },
  });
  const route = await prisma.route.findFirst({
    where: { id: parsed.routeId, companyId: actor.companyId },
  });

  if (before == null || before.companyId !== actor.companyId || route == null) {
    redirect(`/rutas/${parsed.routeId}?error=not-found`);
  }

  await prisma.$transaction(async (tx) => {
    await tx.client.update({
      where: { id: parsed.clientId },
      data: { routeId: parsed.routeId },
    });
    await tx.auditLog.create({
      data: {
        companyId: actor.companyId,
        userId: actor.id,
        action: "ASSIGN",
        entityType: "Client",
        entityId: parsed.clientId,
        beforeJson: JSON.stringify({ routeId: before.routeId }),
        afterJson: JSON.stringify({ routeId: parsed.routeId }),
      },
    });
  });

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${parsed.clientId}`);
  revalidatePath("/rutas");
  revalidatePath(`/rutas/${parsed.routeId}`);
  revalidatePath("/auditoria");
  redirect(`/rutas/${parsed.routeId}`);
}

async function addMemberToRoute(formData: FormData) {
  "use server";

  const actor = await requireRole(["ADMIN", "MANAGER"]);
  const parsedResult = addMemberSchema.safeParse({
    routeId: formData.get("routeId"),
    userId: formData.get("userId"),
  });
  if (!parsedResult.success) {
    redirect("/rutas?error=invalid");
  }
  const parsed = parsedResult.data;
  const [route, user] = await Promise.all([
    prisma.route.findFirst({ where: { id: parsed.routeId, companyId: actor.companyId } }),
    prisma.user.findFirst({ where: { id: parsed.userId, companyId: actor.companyId, status: "ACTIVE" } }),
  ]);

  if (route == null || user == null) {
    redirect(`/rutas/${parsed.routeId}?error=not-found`);
  }

  await prisma.$transaction(async (tx) => {
    await tx.routeMember.upsert({
      where: {
        routeId_userId: {
          routeId: parsed.routeId,
          userId: parsed.userId,
        },
      },
      update: {},
      create: {
        routeId: parsed.routeId,
        userId: parsed.userId,
        permissions: JSON.stringify(["clients:read", "payments:create"]),
      },
    });
    await tx.auditLog.create({
      data: {
        companyId: actor.companyId,
        userId: actor.id,
        action: "ASSIGN",
        entityType: "RouteMember",
        entityId: `${parsed.routeId}:${parsed.userId}`,
        afterJson: JSON.stringify(parsed),
      },
    });
  });

  revalidatePath("/rutas");
  revalidatePath(`/rutas/${parsed.routeId}`);
  revalidatePath("/usuarios");
  revalidatePath("/auditoria");
  redirect(`/rutas/${parsed.routeId}`);
}

async function toggleRouteStatus(formData: FormData) {
  "use server";

  const actor = await requireRole(["ADMIN", "MANAGER"]);
  const parsedResult = toggleRouteSchema.safeParse({
    routeId: formData.get("routeId"),
    confirmAction: formData.get("confirmAction"),
  });
  if (!parsedResult.success) {
    redirect("/rutas?error=confirm");
  }
  const parsed = parsedResult.data;
  const route = await prisma.route.findFirst({
    where: { id: parsed.routeId, companyId: actor.companyId },
  });

  if (route == null) {
    redirect("/rutas?error=not-found");
  }

  await prisma.$transaction(async (tx) => {
    await tx.route.update({
      where: { id: route.id },
      data: { active: !route.active },
    });
    await tx.auditLog.create({
      data: {
        companyId: actor.companyId,
        userId: actor.id,
        action: route.active ? "DEACTIVATE" : "ACTIVATE",
        entityType: "Route",
        entityId: route.id,
        beforeJson: JSON.stringify({ active: route.active }),
        afterJson: JSON.stringify({ active: !route.active }),
      },
    });
  });

  revalidatePath("/rutas");
  revalidatePath(`/rutas/${route.id}`);
  revalidatePath("/auditoria");
  redirect(`/rutas/${route.id}`);
}

function roleLabel(role: string) {
  const labels: Record<string, string> = {
    ADMIN: "Admin",
    COLLECTOR: "Cobrador",
    MANAGER: "Supervisor",
  };

  return labels[role] ?? role;
}

function routeErrorLabel(error: string) {
  const labels: Record<string, string> = {
    invalid: "Revisa los datos enviados.",
    "not-found": "Cliente, usuario o ruta no encontrados para esta empresa.",
  };

  return labels[error] ?? "No se pudo completar la accion.";
}
