import Link from "next/link";
import type { ReactNode } from "react";
import { BadgeDollarSign, MapPinned, Plus, RouteIcon, Users } from "lucide-react";

import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { formatMoney } from "@/lib/format";
import { loanBalance } from "@/lib/payments";

export const dynamic = "force-dynamic";

type RoutesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function RoutesPage({ searchParams }: RoutesPageProps) {
  const params = (await searchParams) ?? {};
  const error = typeof params.error === "string" ? params.error : "";
  const data = await getRoutesData();

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-slate-950">
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
            {navItems().map(([label, href]) => (
              <Link
                key={label}
                href={href}
                className={`flex h-10 items-center rounded-md px-3 text-sm font-medium ${
                  label === "Rutas"
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
              <h1 className="text-lg font-semibold">Rutas</h1>
            </div>
            <Link
              href="/rutas/nuevo"
              className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-medium text-white hover:bg-slate-800"
            >
              <Plus size={17} />
              Nueva ruta
            </Link>
          </header>

          <div className="space-y-6 px-8 py-7">
            {error.length > 0 ? <ErrorBanner message={routesErrorLabel(error)} /> : null}

            <section className="grid grid-cols-4 gap-4">
              <MetricCard
                label="Rutas"
                value={String(data.totalRoutes)}
                note={`${data.activeRoutes} activas`}
                icon={<RouteIcon size={21} />}
              />
              <MetricCard
                label="Clientes"
                value={String(data.totalClients)}
                note="Asignados a rutas"
                icon={<Users size={21} />}
              />
              <MetricCard
                label="Cartera"
                value={formatMoney(data.totalBalance)}
                note="Saldo pendiente"
                icon={<BadgeDollarSign size={21} />}
              />
              <MetricCard
                label="Miembros"
                value={String(data.totalMembers)}
                note="Usuarios asignados"
                icon={<MapPinned size={21} />}
              />
            </section>

            <section className="rounded-lg border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-5 py-4">
                <h2 className="text-base font-semibold">Listado de rutas</h2>
                <p className="text-sm text-slate-500">
                  Clientes, miembros y cartera pendiente por ruta
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Ruta</th>
                      <th className="px-5 py-3 font-semibold">Estado</th>
                      <th className="px-5 py-3 text-right font-semibold">Clientes</th>
                      <th className="px-5 py-3 text-right font-semibold">Miembros</th>
                      <th className="px-5 py-3 text-right font-semibold">Saldo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.routes.map((route) => (
                      <tr key={route.id} className="hover:bg-slate-50/70">
                        <td className="px-5 py-4">
                          <Link
                            href={`/rutas/${route.id}`}
                            className="font-semibold hover:underline"
                          >
                            {route.name}
                          </Link>
                          <p className="text-xs text-slate-500">
                            {route.description ?? "Sin descripcion"}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <StatusPill active={route.active} />
                        </td>
                        <td className="px-5 py-4 text-right">{route.clientsCount}</td>
                        <td className="px-5 py-4 text-right">{route.membersCount}</td>
                        <td className="px-5 py-4 text-right font-semibold">
                          {formatMoney(route.balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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

function StatusPill({ active }: { active: boolean }) {
  return (
    <span
      className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
        active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
      }`}
    >
      {active ? "Activa" : "Inactiva"}
    </span>
  );
}

async function getRoutesData() {
  const actor = await currentUser();
  const routes = await prisma.route.findMany({
    where: { companyId: actor.companyId },
    include: {
      clients: true,
      members: true,
      loans: { where: { status: { not: "VOIDED" } }, include: { payments: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const mapped = routes.map((route) => {
    const balance = route.loans.reduce(
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
      id: route.id,
      name: route.name,
      description: route.description,
      active: route.active,
      clientsCount: route.clients.length,
      membersCount: route.members.length,
      balance,
    };
  });

  return {
    routes: mapped,
    totalRoutes: mapped.length,
    activeRoutes: mapped.filter((route) => route.active).length,
    totalClients: mapped.reduce((total, route) => total + route.clientsCount, 0),
    totalMembers: mapped.reduce((total, route) => total + route.membersCount, 0),
    totalBalance: mapped.reduce((total, route) => total + route.balance, 0),
  };
}

function navItems() {
  return [
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
  ];
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
      {message}
    </div>
  );
}

function routesErrorLabel(error: string) {
  const labels: Record<string, string> = {
    confirm: "Debes confirmar la accion antes de continuar.",
    invalid: "Revisa los datos enviados.",
    "not-found": "Ruta no encontrada para esta empresa.",
  };

  return labels[error] ?? "No se pudo completar la accion.";
}
