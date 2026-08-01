import Link from "next/link";
import type { ReactNode } from "react";
import {
  BadgeDollarSign,
  CalendarClock,
  CircleDollarSign,
  Plus,
  Search,
  WalletCards,
} from "lucide-react";

import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { formatMoney, formatShortDate } from "@/lib/format";

export const dynamic = "force-dynamic";

type LoansPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoansPage({ searchParams }: LoansPageProps) {
  const params = (await searchParams) ?? {};
  const query = typeof params.q === "string" ? params.q.trim() : "";
  const error = typeof params.error === "string" ? params.error : "";
  const data = await getLoansData(query);

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
                  label === "Prestamos"
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
              <h1 className="text-lg font-semibold">Prestamos</h1>
            </div>
            <Link
              href="/prestamos/nuevo"
              className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-medium text-white hover:bg-slate-800"
            >
              <Plus size={17} />
              Nuevo prestamo
            </Link>
          </header>

          <div className="space-y-6 px-8 py-7">
            {error.length > 0 ? <ErrorBanner message={loansErrorLabel(error)} /> : null}

            <section className="grid grid-cols-4 gap-4">
              <MetricCard
                label="Prestamos"
                value={String(data.totalLoans)}
                note="Activos, completos y demo"
                icon={<WalletCards size={21} />}
              />
              <MetricCard
                label="Capital"
                value={formatMoney(data.totalPrincipal)}
                note="Monto desembolsado"
                icon={<BadgeDollarSign size={21} />}
              />
              <MetricCard
                label="Saldo pendiente"
                value={formatMoney(data.totalBalance)}
                note="Total por cobrar"
                icon={<CircleDollarSign size={21} />}
              />
              <MetricCard
                label="Proxima cuota"
                value={data.nextDueDateLabel}
                note="Entre prestamos activos"
                icon={<CalendarClock size={21} />}
              />
            </section>

            <section className="rounded-lg border border-slate-200 bg-white">
              <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
                <div>
                  <h2 className="text-base font-semibold">Cartera de prestamos</h2>
                  <p className="text-sm text-slate-500">
                    Busqueda por codigo, cliente, documento o ruta
                  </p>
                </div>
                <form className="flex w-[420px] items-center gap-2" action="/prestamos">
                  <label className="relative flex-1">
                    <Search
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      size={17}
                    />
                    <input
                      name="q"
                      defaultValue={query}
                      placeholder="Buscar prestamo..."
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
                      <th className="px-5 py-3 font-semibold">Prestamo</th>
                      <th className="px-5 py-3 font-semibold">Cliente</th>
                      <th className="px-5 py-3 font-semibold">Ruta</th>
                      <th className="px-5 py-3 font-semibold">Plan</th>
                      <th className="px-5 py-3 font-semibold">Estado</th>
                      <th className="px-5 py-3 text-right font-semibold">Saldo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.loans.map((loan) => (
                      <tr key={loan.id} className="hover:bg-slate-50/70">
                        <td className="px-5 py-4">
                          <Link
                            href={`/prestamos/${loan.id}`}
                            className="font-semibold hover:underline"
                          >
                            {loan.code}
                          </Link>
                          <p className="text-xs text-slate-500">
                            {formatMoney(loan.principal)} + {formatMoney(loan.interestAmount)}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <Link
                            href={`/clientes/${loan.clientId}`}
                            className="font-semibold hover:underline"
                          >
                            {loan.clientName}
                          </Link>
                          <p className="text-xs text-slate-500">{loan.documentNumber}</p>
                        </td>
                        <td className="px-5 py-4 text-slate-600">{loan.routeName}</td>
                        <td className="px-5 py-4 text-slate-600">
                          <p>{loan.modalityLabel}</p>
                          <p className="text-xs text-slate-500">
                            {loan.paidInstallments}/{loan.installmentCount} cuotas
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                              loan.status === "ACTIVE"
                                ? "bg-sky-50 text-sky-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {loan.status === "ACTIVE"
                              ? "Activo"
                              : loan.status === "VOIDED"
                                ? "Anulado"
                                : "Completado"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right font-semibold">
                          {formatMoney(loan.balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {data.loans.length === 0 ? (
                <div className="px-5 py-12 text-center text-sm text-slate-500">
                  No hay prestamos con ese filtro.
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

async function getLoansData(query: string) {
  const actor = await currentUser();
  const loans = await prisma.loan.findMany({
    where: { companyId: actor.companyId },
    include: {
      route: true,
      client: true,
      payments: true,
      installments: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const normalizedQuery = query.toLowerCase();
  const mapped = loans.map((loan) => {
    const activePayments = loan.payments.filter((payment) => payment.voidedAt == null);
    const paid = activePayments.reduce((sum, payment) => sum + payment.amount, 0);
    const balance = loan.status === "VOIDED" ? 0 : Math.max(loan.totalAmount - paid, 0);

    return {
      id: loan.id,
      code: loan.code,
      principal: loan.principal,
      interestAmount: loan.interestAmount,
      totalAmount: loan.totalAmount,
      installmentCount: loan.installmentCount,
      paidInstallments: loan.installments.filter((installment) => installment.status === "PAID")
        .length,
      modalityLabel: modalityLabel(loan.modality),
      status: loan.status,
      balance,
      clientName: loan.client.fullName,
      clientId: loan.clientId,
      documentNumber: loan.client.documentNumber,
      routeName: loan.route.name,
      nextDueDate:
        loan.installments
          .filter((installment) => installment.status !== "PAID")
          .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())[0]?.dueDate ?? null,
    };
  });

  const filtered =
    normalizedQuery.length === 0
      ? mapped
      : mapped.filter((loan) =>
          [loan.code, loan.clientName, loan.documentNumber, loan.routeName]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(normalizedQuery)),
        );

  const nextDueDate = mapped
    .map((loan) => loan.nextDueDate)
    .filter((date): date is Date => date != null)
    .sort((a, b) => a.getTime() - b.getTime())[0];

  return {
    loans: filtered,
    totalLoans: mapped.length,
    totalPrincipal: mapped
      .filter((loan) => loan.status !== "VOIDED")
      .reduce((total, loan) => total + loan.principal, 0),
    totalBalance: mapped.reduce((total, loan) => total + loan.balance, 0),
    nextDueDateLabel: nextDueDate == null ? "Sin cuotas" : formatShortDate(nextDueDate),
  };
}

function modalityLabel(value: string) {
  const labels: Record<string, string> = {
    DAILY: "Diario",
    WEEKLY: "Semanal",
    BIWEEKLY: "Quincenal",
    MONTHLY: "Mensual",
  };

  return labels[value] ?? value;
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
      {message}
    </div>
  );
}

function loansErrorLabel(error: string) {
  const labels: Record<string, string> = {
    confirm: "Debes confirmar la accion antes de continuar.",
    "not-found": "Prestamo no encontrado para esta empresa.",
  };

  return labels[error] ?? "No se pudo completar la accion.";
}
