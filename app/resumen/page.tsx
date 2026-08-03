import Link from "next/link";
import type { ReactNode } from "react";
import {
  BanknoteArrowDown,
  Gauge,
  PiggyBank,
  WalletCards,
} from "lucide-react";

import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { formatMoney } from "@/lib/format";
import { loanBalance } from "@/lib/payments";
import { cashBalance, percent } from "@/lib/summary";

export const dynamic = "force-dynamic";

export default async function SummaryPage() {
  const data = await getSummaryData();

  return (
    <main className="min-h-screen bg-background text-slate-950">
      <div className="grid min-h-screen grid-cols-[248px_1fr]">
        <aside className="border-r border-slate-200 bg-white">
          <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-5">
            <div className="flex size-9 items-center justify-center rounded-md bg-[#50A96B] text-sm font-bold text-white">
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
                  label === "Resumen"
                    ? "bg-[#50A96B] text-white"
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
              <p className="text-xs text-slate-500">Modulo gerencial</p>
              <h1 className="text-lg font-semibold">Resumen</h1>
            </div>
            <div className="flex gap-2">
              <Link
                href="/gastos/nuevo"
                className="inline-flex h-10 items-center rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Nuevo gasto
              </Link>
              <Link
                href="/abonos/nuevo"
                className="inline-flex h-10 items-center rounded-md bg-[#50A96B] px-4 text-sm font-medium text-white hover:bg-[#32603d]"
              >
                Nuevo abono
              </Link>
            </div>
          </header>

          <div className="space-y-6 px-8 py-7">
            <section className="grid grid-cols-4 gap-4">
              <MetricCard
                label="Cartera pendiente"
                value={formatMoney(data.portfolioBalance)}
                note={`${data.activeLoans} prestamos activos`}
                icon={<Gauge size={21} />}
              />
              <MetricCard
                label="Caja"
                value={formatMoney(data.cash)}
                note="Entradas menos salidas"
                icon={<WalletCards size={21} />}
              />
              <MetricCard
                label="Utilidad neta"
                value={formatMoney(data.netProfit)}
                note="Interes cobrado menos gastos"
                icon={<PiggyBank size={21} />}
              />
              <MetricCard
                label="Recuperacion"
                value={`${data.recoveryPercent}%`}
                note="Cobrado sobre cartera total"
                icon={<BanknoteArrowDown size={21} />}
              />
            </section>

            <section className="grid grid-cols-[1fr_1fr] gap-5">
              <article className="rounded-lg border border-slate-200 bg-white">
                <div className="border-b border-slate-200 px-5 py-4">
                  <h2 className="text-base font-semibold">Flujo financiero</h2>
                  <p className="text-sm text-slate-500">Lectura rapida de ingresos y salidas</p>
                </div>
                <div className="space-y-4 p-5">
                  {[
                    ["Prestado", data.loanedTotal, "bg-sky-500"],
                    ["Cobrado", data.collectedTotal, "bg-emerald-500"],
                    ["Gastos", data.expensesTotal, "bg-rose-500"],
                    ["Interes cobrado", data.interestCollected, "bg-amber-500"],
                  ].map(([label, value, color]) => (
                    <ProgressRow
                      key={label}
                      label={String(label)}
                      value={Number(value)}
                      percentValue={percent(Number(value), data.flowMax)}
                      color={String(color)}
                    />
                  ))}
                </div>
              </article>

              <article className="rounded-lg border border-slate-200 bg-white">
                <div className="border-b border-slate-200 px-5 py-4">
                  <h2 className="text-base font-semibold">Estado de cartera</h2>
                  <p className="text-sm text-slate-500">Capital, saldo y utilidad del MVP</p>
                </div>
                <div className="grid grid-cols-2 gap-4 p-5">
                  <MiniStat label="Clientes" value={String(data.clientsCount)} />
                  <MiniStat label="Prestamos" value={String(data.loansCount)} />
                  <MiniStat label="Capital total" value={formatMoney(data.loanedTotal)} />
                  <MiniStat label="Saldo pendiente" value={formatMoney(data.portfolioBalance)} />
                  <MiniStat label="Gastos" value={formatMoney(data.expensesTotal)} />
                  <MiniStat label="Interes" value={formatMoney(data.interestCollected)} />
                </div>
              </article>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-5 py-4">
                <h2 className="text-base font-semibold">Acciones siguientes</h2>
                <p className="text-sm text-slate-500">
                  Lo que falta para acercarnos al producto final de PrestaBIT
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4 p-5">
                {[
                  ["Rutas", "CRUD y asignacion de cobradores."],
                  ["Detalles", "Pantalla individual de cliente y prestamo."],
                  ["Recibos", "PDF simple para abonos y contratos."],
                ].map(([title, body]) => (
                  <article key={title} className="rounded-lg border border-slate-200 p-4">
                    <h3 className="text-sm font-semibold">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{body}</p>
                  </article>
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

function ProgressRow({
  label,
  value,
  percentValue,
  color,
}: {
  label: string;
  value: number;
  percentValue: number;
  color: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="font-semibold">{formatMoney(value)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${percentValue}%` }} />
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  );
}

async function getSummaryData() {
  const actor = await currentUser();
  const [clients, loans, payments, expenses, cashMovements] = await Promise.all([
    prisma.client.findMany({ where: { companyId: actor.companyId, status: "ACTIVE" } }),
    prisma.loan.findMany({
      where: { companyId: actor.companyId, status: { not: "VOIDED" } },
      include: {
        payments: true,
      },
    }),
    prisma.payment.findMany({ where: { companyId: actor.companyId, voidedAt: null } }),
    prisma.expense.findMany({ where: { companyId: actor.companyId, voidedAt: null } }),
    prisma.cashMovement.findMany({ where: { companyId: actor.companyId } }),
  ]);

  const loanedTotal = loans.reduce((total, loan) => total + loan.principal, 0);
  const collectedTotal = payments.reduce((total, payment) => total + payment.amount, 0);
  const interestCollected = payments.reduce(
    (total, payment) => total + payment.interestPaid,
    0,
  );
  const expensesTotal = expenses.reduce((total, expense) => total + expense.amount, 0);
  const portfolioBalance = loans.reduce(
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
  const activeLoans = loans.filter((loan) => loan.status === "ACTIVE").length;
  const missingExpenseMovements = expenses.filter(
    (expense) =>
      !cashMovements.some(
        (movement) =>
          movement.sourceType === "EXPENSE" && movement.sourceId === expense.id,
      ),
  );
  const cash = cashBalance([
    ...cashMovements,
    ...missingExpenseMovements.map((expense) => ({
      type: "OUTCOME",
      amount: expense.amount,
    })),
  ]);
  const flowMax = Math.max(loanedTotal, collectedTotal, expensesTotal, interestCollected, 1);

  return {
    clientsCount: clients.length,
    loansCount: loans.length,
    activeLoans,
    loanedTotal,
    collectedTotal,
    interestCollected,
    expensesTotal,
    portfolioBalance,
    cash,
    netProfit: interestCollected - expensesTotal,
    recoveryPercent: percent(collectedTotal, loanedTotal + portfolioBalance),
    flowMax,
  };
}
