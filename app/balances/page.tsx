import Link from "next/link";
import type { ReactNode } from "react";
import {
  BanknoteArrowDown,
  BanknoteArrowUp,
  CalendarDays,
  Download,
  MapPinned,
  UserRound,
  WalletCards,
} from "lucide-react";

import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { formatLongDate, formatMoney } from "@/lib/format";
import { loanBalance } from "@/lib/payments";
import { cashBalance } from "@/lib/summary";

export const dynamic = "force-dynamic";

export default async function BalancesPage() {
  const data = await getBalancesData();

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
                  label === "Balances"
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
              <p className="text-xs text-slate-500">Control financiero</p>
              <h1 className="text-lg font-semibold">Balances</h1>
            </div>
            <a
              href="/balances/export"
              className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-medium text-white hover:bg-slate-800"
            >
              <Download size={17} />
              Exportar CSV
            </a>
          </header>

          <div className="space-y-6 px-8 py-7">
            <section className="grid grid-cols-4 gap-4">
              <MetricCard
                label="Balance del dia"
                value={formatMoney(data.day.balance)}
                note={formatLongDate(data.operationalDate)}
                icon={<CalendarDays size={21} />}
              />
              <MetricCard
                label="Balance del mes"
                value={formatMoney(data.month.balance)}
                note="Entradas menos salidas"
                icon={<WalletCards size={21} />}
              />
              <MetricCard
                label="Cartera pendiente"
                value={formatMoney(data.portfolioBalance)}
                note={`${data.activeLoans} prestamos activos`}
                icon={<BanknoteArrowUp size={21} />}
              />
              <MetricCard
                label="Cobrado total"
                value={formatMoney(data.totalCollected)}
                note="Abonos no anulados"
                icon={<BanknoteArrowDown size={21} />}
              />
            </section>

            <section className="grid grid-cols-[1fr_1fr] gap-5">
              <BalancePanel title="Balance diario" icon={<CalendarDays size={19} />} rows={data.day.rows} />
              <BalancePanel title="Balance mensual" icon={<WalletCards size={19} />} rows={data.month.rows} />
            </section>

            <section className="grid grid-cols-[1fr_1fr] gap-5">
              <TablePanel
                title="Por ruta"
                icon={<MapPinned size={19} />}
                columns={["Ruta", "Cobrado", "Prestado", "Gastos", "Saldo"]}
                rows={data.byRoute.map((route) => [
                  route.name,
                  formatMoney(route.collected),
                  formatMoney(route.loaned),
                  formatMoney(route.expenses),
                  formatMoney(route.balance),
                ])}
              />
              <TablePanel
                title="Por usuario"
                icon={<UserRound size={19} />}
                columns={["Usuario", "Cobrado", "Prestado", "Gastos", "Movs."]}
                rows={data.byUser.map((user) => [
                  user.name,
                  formatMoney(user.collected),
                  formatMoney(user.loaned),
                  formatMoney(user.expenses),
                  String(user.movements),
                ])}
              />
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

function BalancePanel({
  title,
  icon,
  rows,
}: {
  title: string;
  icon: ReactNode;
  rows: Array<{ label: string; amount: number; tone: string }>;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
        <div className="text-slate-500">{icon}</div>
        <h2 className="text-base font-semibold">{title}</h2>
      </div>
      <div className="divide-y divide-slate-100">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between px-5 py-4 text-sm">
            <span className="font-medium text-slate-600">{row.label}</span>
            <span className={`font-semibold ${row.tone}`}>{formatMoney(row.amount)}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

function TablePanel({
  title,
  icon,
  columns,
  rows,
}: {
  title: string;
  icon: ReactNode;
  columns: string[];
  rows: string[][];
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
        <div className="text-slate-500">{icon}</div>
        <h2 className="text-base font-semibold">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              {columns.map((column) => (
                <th key={column} className="px-5 py-3 font-semibold">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.join("-")} className="hover:bg-slate-50/70">
                {row.map((cell, index) => (
                  <td
                    key={`${cell}-${index}`}
                    className={`px-5 py-4 ${index === 0 ? "font-semibold" : "text-slate-600"}`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}

async function getBalancesData() {
  const actor = await currentUser();
  const [loans, payments, expenses, cashMovements, routes, users] = await Promise.all([
    prisma.loan.findMany({ where: { companyId: actor.companyId }, include: { payments: true } }),
    prisma.payment.findMany({ where: { companyId: actor.companyId, voidedAt: null }, include: { createdBy: true } }),
    prisma.expense.findMany({ where: { companyId: actor.companyId, voidedAt: null }, include: { createdBy: true } }),
    prisma.cashMovement.findMany({ where: { companyId: actor.companyId } }),
    prisma.route.findMany({ where: { companyId: actor.companyId } }),
    prisma.user.findMany({ where: { companyId: actor.companyId } }),
  ]);
  const operationalDate = latestDate([
    ...loans.map((loan) => loan.createdAt),
    ...payments.map((payment) => payment.createdAt),
    ...expenses.map((expense) => expense.date),
    ...cashMovements.map((movement) => movement.createdAt),
  ]);
  const dayStart = startOfDay(operationalDate);
  const dayEnd = addDays(dayStart, 1);
  const monthStart = new Date(dayStart.getFullYear(), dayStart.getMonth(), 1);
  const monthEnd = new Date(dayStart.getFullYear(), dayStart.getMonth() + 1, 1);
  const activeLoans = loans.filter((loan) => loan.status !== "VOIDED");
  const portfolioBalance = activeLoans.reduce(
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
  const totalCollected = payments.reduce((total, payment) => total + payment.amount, 0);

  return {
    operationalDate,
    activeLoans: activeLoans.filter((loan) => loan.status === "ACTIVE").length,
    portfolioBalance,
    totalCollected,
    day: buildPeriodBalance({ loans: activeLoans, payments, expenses, cashMovements, from: dayStart, to: dayEnd }),
    month: buildPeriodBalance({ loans: activeLoans, payments, expenses, cashMovements, from: monthStart, to: monthEnd }),
    byRoute: routes.map((route) => {
      const routeLoans = activeLoans.filter((loan) => loan.routeId === route.id);
      const routePayments = payments.filter((payment) => payment.routeId === route.id);
      const routeExpenses = expenses.filter((expense) => expense.routeId === route.id);
      return {
        name: route.name,
        collected: sum(routePayments.map((payment) => payment.amount)),
        loaned: sum(routeLoans.map((loan) => loan.principal)),
        expenses: sum(routeExpenses.map((expense) => expense.amount)),
        balance: sum(routePayments.map((payment) => payment.amount)) - sum(routeLoans.map((loan) => loan.principal)) - sum(routeExpenses.map((expense) => expense.amount)),
      };
    }),
    byUser: users.map((user) => {
      const userPayments = payments.filter((payment) => payment.createdById === user.id);
      const userLoans = activeLoans.filter((loan) => loan.createdById === user.id);
      const userExpenses = expenses.filter((expense) => expense.createdById === user.id);
      return {
        name: user.name,
        collected: sum(userPayments.map((payment) => payment.amount)),
        loaned: sum(userLoans.map((loan) => loan.principal)),
        expenses: sum(userExpenses.map((expense) => expense.amount)),
        movements: userPayments.length + userLoans.length + userExpenses.length,
      };
    }),
  };
}

function buildPeriodBalance({
  loans,
  payments,
  expenses,
  cashMovements,
  from,
  to,
}: {
  loans: Awaited<ReturnType<typeof prisma.loan.findMany>>;
  payments: Awaited<ReturnType<typeof prisma.payment.findMany>>;
  expenses: Awaited<ReturnType<typeof prisma.expense.findMany>>;
  cashMovements: Awaited<ReturnType<typeof prisma.cashMovement.findMany>>;
  from: Date;
  to: Date;
}) {
  const periodLoans = loans.filter((loan) => loan.createdAt >= from && loan.createdAt < to);
  const periodPayments = payments.filter(
    (payment) => payment.createdAt >= from && payment.createdAt < to,
  );
  const periodExpenses = expenses.filter(
    (expense) => expense.date >= from && expense.date < to,
  );
  const periodMovements = cashMovements.filter(
    (movement) => movement.createdAt >= from && movement.createdAt < to,
  );
  const collected = sum(periodPayments.map((payment) => payment.amount));
  const loaned = sum(periodLoans.map((loan) => loan.principal));
  const expensesTotal = sum(periodExpenses.map((expense) => expense.amount));
  const cash = cashBalance(periodMovements);

  return {
    balance: collected - loaned - expensesTotal,
    rows: [
      { label: "Cobrado", amount: collected, tone: "text-emerald-700" },
      { label: "Prestado", amount: loaned, tone: "text-sky-700" },
      { label: "Gastos", amount: expensesTotal, tone: "text-rose-700" },
      { label: "Caja registrada", amount: cash, tone: "text-slate-950" },
      { label: "Balance", amount: collected - loaned - expensesTotal, tone: "text-slate-950" },
    ],
  };
}

function latestDate(dates: Date[]) {
  return dates.sort((a, b) => b.getTime() - a.getTime())[0] ?? new Date();
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}
