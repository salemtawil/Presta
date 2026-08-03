import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  ClipboardList,
  Search,
  WalletCards,
} from "lucide-react";

import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { formatMoney, formatShortDate } from "@/lib/format";

export const dynamic = "force-dynamic";

type CashPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CashPage({ searchParams }: CashPageProps) {
  const params = (await searchParams) ?? {};
  const query = typeof params.q === "string" ? params.q.trim() : "";
  const data = await getCashData(query);

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
                  label === "Caja"
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
              <h1 className="text-lg font-semibold">Caja</h1>
            </div>
            <Link
              href="/abonos/nuevo"
              className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-medium text-white hover:bg-slate-800"
            >
              <Banknote size={17} />
              Registrar abono
            </Link>
          </header>

          <div className="space-y-6 px-8 py-7">
            <section className="grid grid-cols-4 gap-4">
              <MetricCard
                label="Saldo caja"
                value={formatMoney(data.cashBalance)}
                note="Ingresos menos salidas"
                icon={<WalletCards size={21} />}
              />
              <MetricCard
                label="Entradas"
                value={formatMoney(data.totalIncome)}
                note="Abonos y ajustes positivos"
                icon={<ArrowDownLeft size={21} />}
              />
              <MetricCard
                label="Salidas"
                value={formatMoney(data.totalOutcome)}
                note="Prestamos y gastos"
                icon={<ArrowUpRight size={21} />}
              />
              <MetricCard
                label="Movimientos"
                value={String(data.totalMovements)}
                note="Ledger operativo"
                icon={<ClipboardList size={21} />}
              />
            </section>

            <section className="rounded-lg border border-slate-200 bg-white">
              <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
                <div>
                  <h2 className="text-base font-semibold">Movimientos de caja</h2>
                  <p className="text-sm text-slate-500">
                    Entradas, salidas y ajustes conectados a prestamos y abonos
                  </p>
                </div>
                <form className="flex w-[420px] items-center gap-2" action="/caja">
                  <label className="relative flex-1">
                    <Search
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      size={17}
                    />
                    <input
                      name="q"
                      defaultValue={query}
                      placeholder="Buscar movimiento..."
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
                      <th className="px-5 py-3 font-semibold">Fecha</th>
                      <th className="px-5 py-3 font-semibold">Concepto</th>
                      <th className="px-5 py-3 font-semibold">Ruta</th>
                      <th className="px-5 py-3 font-semibold">Origen</th>
                      <th className="px-5 py-3 font-semibold">Tipo</th>
                      <th className="px-5 py-3 text-right font-semibold">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.movements.map((movement) => (
                      <tr key={movement.id} className="hover:bg-slate-50/70">
                        <td className="px-5 py-4 text-slate-600">
                          {formatShortDate(movement.createdAt)}
                        </td>
                        <td className="px-5 py-4 font-semibold">{movement.concept}</td>
                        <td className="px-5 py-4 text-slate-600">{movement.routeName}</td>
                        <td className="px-5 py-4 text-slate-600">
                          {movement.sourceType ?? "Manual"}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                              movement.type === "INCOME"
                                ? "bg-emerald-50 text-emerald-700"
                                : movement.type === "OUTCOME"
                                  ? "bg-rose-50 text-rose-700"
                                  : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {typeLabel(movement.type)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right font-semibold">
                          {movement.type === "OUTCOME" ? "-" : ""}
                          {formatMoney(movement.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {data.movements.length === 0 ? (
                <div className="px-5 py-12 text-center text-sm text-slate-500">
                  No hay movimientos con ese filtro.
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

async function getCashData(query: string) {
  const actor = await currentUser();
  const [movements, expenses] = await Promise.all([
    prisma.cashMovement.findMany({
      where: { companyId: actor.companyId },
      include: { route: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.expense.findMany({
      where: { companyId: actor.companyId, voidedAt: null },
      include: { route: true },
      orderBy: { date: "desc" },
    }),
  ]);

  const expenseMovementIds = new Set(
    movements
      .filter((movement) => movement.sourceType === "EXPENSE" && movement.sourceId != null)
      .map((movement) => movement.sourceId),
  );

  const normalizedQuery = query.toLowerCase();
  const mapped = [
    ...movements.map((movement) => ({
      id: movement.id,
      createdAt: movement.createdAt,
      type: movement.type,
      amount: movement.amount,
      concept: movement.concept,
      sourceType: movement.sourceType,
      routeName: movement.route.name,
    })),
    ...expenses
      .filter((expense) => !expenseMovementIds.has(expense.id))
      .map((expense) => ({
        id: `expense-${expense.id}`,
        createdAt: expense.date,
        type: "OUTCOME",
        amount: expense.amount,
        concept: `Gasto ${expense.concept}`,
        sourceType: "EXPENSE",
        routeName: expense.route.name,
      })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const filtered =
    normalizedQuery.length === 0
      ? mapped
      : mapped.filter((movement) =>
          [
            movement.type,
            movement.concept,
            movement.sourceType ?? "",
            movement.routeName,
          ].some((value) => value.toLowerCase().includes(normalizedQuery)),
        );

  const totalIncome = mapped
    .filter((movement) => movement.type === "INCOME")
    .reduce((total, movement) => total + movement.amount, 0);
  const totalOutcome = mapped
    .filter((movement) => movement.type === "OUTCOME")
    .reduce((total, movement) => total + movement.amount, 0);

  return {
    movements: filtered,
    totalMovements: mapped.length,
    totalIncome,
    totalOutcome,
    cashBalance: totalIncome - totalOutcome,
  };
}

function typeLabel(value: string) {
  const labels: Record<string, string> = {
    INCOME: "Entrada",
    OUTCOME: "Salida",
    ADJUSTMENT: "Ajuste",
  };

  return labels[value] ?? value;
}
