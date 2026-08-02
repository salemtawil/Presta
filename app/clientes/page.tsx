import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowUpDown,
  BadgeDollarSign,
  Filter,
  Plus,
  Search,
  Users,
} from "lucide-react";

import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

type ClientsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ClientsPage({ searchParams }: ClientsPageProps) {
  const params = (await searchParams) ?? {};
  const query = typeof params.q === "string" ? params.q.trim() : "";
  const data = await getClientsData(query);

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
                  label === "Clientes"
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
              <p className="text-xs text-slate-500">Modulo operativo</p>
              <h1 className="text-lg font-semibold">Clientes</h1>
            </div>
            <Link
              href="/clientes/nuevo"
              className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-medium text-white hover:bg-slate-800"
            >
              <Plus size={17} />
              Nuevo cliente
            </Link>
          </header>

          <div className="space-y-6 px-8 py-7">
            <section className="grid grid-cols-4 gap-4">
              <MetricCard
                label="Clientes"
                value={String(data.totalClients)}
                note="Registros activos y demo"
                icon={<Users size={21} />}
              />
              <MetricCard
                label="Saldo cartera"
                value={formatMoney(data.totalBalance)}
                note="Prestamos pendientes"
                icon={<BadgeDollarSign size={21} />}
              />
              <MetricCard
                label="Con saldo"
                value={String(data.clientsWithBalance)}
                note="Clientes con prestamo activo"
                icon={<ArrowUpDown size={21} />}
              />
              <MetricCard
                label="Rutas"
                value={String(data.routeCount)}
                note="Rutas asignables"
                icon={<Filter size={21} />}
              />
            </section>

            <section className="rounded-lg border border-slate-200 bg-white">
              <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
                <div>
                  <h2 className="text-base font-semibold">Cartera de clientes</h2>
                  <p className="text-sm text-slate-500">
                    Busqueda por nombre, documento, telefono o direccion
                  </p>
                </div>
                <form className="flex w-[420px] items-center gap-2" action="/clientes">
                  <label className="relative flex-1">
                    <Search
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      size={17}
                    />
                    <input
                      name="q"
                      defaultValue={query}
                      placeholder="Buscar cliente..."
                      className="h-10 w-full rounded-md border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-slate-400"
                    />
                  </label>
                  <button className="h-10 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50">
                    Buscar
                  </button>
                </form>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Cliente</th>
                      <th className="px-5 py-3 font-semibold">Documento</th>
                      <th className="px-5 py-3 font-semibold">Contacto</th>
                      <th className="px-5 py-3 font-semibold">Ruta / grupo</th>
                      <th className="px-5 py-3 font-semibold">Estado</th>
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
                          <p className="text-xs text-slate-500">{client.homeAddress}</p>
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          {client.documentType} {client.documentNumber}
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          <p>{client.phone ?? "Sin telefono"}</p>
                          <p className="text-xs text-slate-500">
                            WhatsApp {client.whatsapp ?? "sin dato"}
                          </p>
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          <p>{client.routeName}</p>
                          <p className="text-xs text-slate-500">{client.groupName}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                              client.balance > 0
                                ? "bg-sky-50 text-sky-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {client.balance > 0 ? "Prestamo activo" : "Sin prestamos"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right font-semibold">
                          {formatMoney(client.balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {data.clients.length === 0 ? (
                <div className="px-5 py-12 text-center text-sm text-slate-500">
                  No hay clientes con ese filtro.
                </div>
              ) : null}
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

async function getClientsData(query: string) {
  const actor = await currentUser();
  const [clients, routes] = await Promise.all([
    prisma.client.findMany({
      where: { companyId: actor.companyId },
      include: {
        route: true,
        loans: { include: { payments: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.route.findMany({ where: { companyId: actor.companyId, active: true } }),
  ]);

  const normalizedQuery = query.toLowerCase();
  const mapped = clients.map((client) => {
    const balance = client.loans.reduce((total, loan) => {
      if (loan.status === "VOIDED") {
        return total;
      }

      const paid = loan.payments
        .filter((payment) => payment.voidedAt == null)
        .reduce((sum, payment) => sum + payment.amount, 0);
      return total + Math.max(loan.totalAmount - paid, 0);
    }, 0);

    return {
      id: client.id,
      fullName: client.fullName,
      documentType: client.documentType,
      documentNumber: client.documentNumber,
      phone: client.phone,
      whatsapp: client.whatsapp,
      homeAddress: client.homeAddress,
      routeName: client.route.name,
      groupName: client.groupName,
      balance,
    };
  });

  const filtered =
    normalizedQuery.length === 0
      ? mapped
      : mapped.filter((client) =>
          [
            client.fullName,
            client.documentNumber,
            client.phone,
            client.whatsapp,
            client.homeAddress,
            client.routeName,
            client.groupName,
          ]
            .filter(Boolean)
            .some((value) =>
              String(value).toLowerCase().includes(normalizedQuery),
            ),
        );

  return {
    clients: filtered,
    totalClients: mapped.length,
    totalBalance: mapped.reduce((total, client) => total + client.balance, 0),
    clientsWithBalance: mapped.filter((client) => client.balance > 0).length,
    routeCount: routes.length,
  };
}
