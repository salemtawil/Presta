import { revalidatePath } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { CalendarDays, CreditCard, Plus, ReceiptText, Search } from "lucide-react";
import { z } from "zod";

import { currentUser, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatMoney, formatShortDate } from "@/lib/format";

export const dynamic = "force-dynamic";

const voidExpenseSchema = z.object({
  expenseId: z.string().trim().min(1),
  reason: z.string().trim().min(3),
  confirmAction: z.literal("on"),
});

type ExpensesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ExpensesPage({ searchParams }: ExpensesPageProps) {
  const params = (await searchParams) ?? {};
  const query = typeof params.q === "string" ? params.q.trim() : "";
  const error = typeof params.error === "string" ? params.error : "";
  const data = await getExpensesData(query);

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
                  label === "Gastos"
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
              <h1 className="text-lg font-semibold">Gastos</h1>
            </div>
            <Link
              href="/gastos/nuevo"
              className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-medium text-white hover:bg-slate-800"
            >
              <Plus size={17} />
              Nuevo gasto
            </Link>
          </header>

          <div className="space-y-6 px-8 py-7">
            {error.length > 0 ? <ErrorBanner message={expenseListErrorLabel(error)} /> : null}

            <section className="grid grid-cols-4 gap-4">
              <MetricCard
                label="Gastos"
                value={String(data.totalExpenses)}
                note="Registros activos"
                icon={<ReceiptText size={21} />}
              />
              <MetricCard
                label="Total"
                value={formatMoney(data.totalAmount)}
                note="Historico registrado"
                icon={<CreditCard size={21} />}
              />
              <MetricCard
                label="Hoy"
                value={formatMoney(data.todayAmount)}
                note={`${data.todayCount} gastos hoy`}
                icon={<CalendarDays size={21} />}
              />
              <MetricCard
                label="Mayor categoria"
                value={data.topCategory}
                note="Segun monto total"
                icon={<ReceiptText size={21} />}
              />
            </section>

            <section className="rounded-lg border border-slate-200 bg-white">
              <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
                <div>
                  <h2 className="text-base font-semibold">Historial de gastos</h2>
                  <p className="text-sm text-slate-500">
                    Busqueda por concepto, categoria o ruta
                  </p>
                </div>
                <form className="flex w-[420px] items-center gap-2" action="/gastos">
                  <label className="relative flex-1">
                    <Search
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      size={17}
                    />
                    <input
                      name="q"
                      defaultValue={query}
                      placeholder="Buscar gasto..."
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
                      <th className="px-5 py-3 font-semibold">Categoria</th>
                      <th className="px-5 py-3 font-semibold">Ruta</th>
                      <th className="px-5 py-3 font-semibold">Estado</th>
                      <th className="px-5 py-3 text-right font-semibold">Monto</th>
                      <th className="px-5 py-3 text-right font-semibold">Accion</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.expenses.map((expense) => (
                      <tr key={expense.id} className="hover:bg-slate-50/70">
                        <td className="px-5 py-4 text-slate-600">
                          {formatShortDate(expense.date)}
                        </td>
                        <td className="px-5 py-4 font-semibold">{expense.concept}</td>
                        <td className="px-5 py-4 text-slate-600">{expense.category}</td>
                        <td className="px-5 py-4 text-slate-600">{expense.routeName}</td>
                        <td className="px-5 py-4">
                          <span className="rounded-md bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
                            Activo
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right font-semibold">
                          {formatMoney(expense.amount)}
                        </td>
                        <td className="px-5 py-4">
                          <form action={voidExpense} className="flex justify-end gap-2">
                            <input type="hidden" name="expenseId" value={expense.id} />
                            <input
                              name="reason"
                              required
                              placeholder="Motivo"
                              className="h-9 w-28 rounded-md border border-slate-200 px-2 text-xs outline-none focus:border-slate-400"
                            />
                            <label className="flex h-9 items-center gap-1 rounded-md border border-slate-200 px-2 text-xs font-medium text-slate-600">
                              <input name="confirmAction" type="checkbox" required className="size-3" />
                              Confirmo
                            </label>
                            <button className="h-9 rounded-md border border-rose-200 px-3 text-xs font-semibold text-rose-700 hover:bg-rose-50">
                              Anular
                            </button>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {data.expenses.length === 0 ? (
                <div className="px-5 py-12 text-center text-sm text-slate-500">
                  No hay gastos con ese filtro.
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

async function getExpensesData(query: string) {
  const actor = await currentUser();
  const dayStart = startOfDay(new Date());
  const dayEnd = addDays(dayStart, 1);

  const expenses = await prisma.expense.findMany({
    where: { companyId: actor.companyId, voidedAt: null },
    include: { route: true },
    orderBy: { date: "desc" },
  });

  const mapped = expenses.map((expense) => ({
    id: expense.id,
    date: expense.date,
    concept: expense.concept,
    category: expense.category,
    amount: expense.amount,
    routeName: expense.route.name,
  }));
  const normalizedQuery = query.toLowerCase();
  const filtered =
    normalizedQuery.length === 0
      ? mapped
      : mapped.filter((expense) =>
          [expense.concept, expense.category, expense.routeName].some((value) =>
            value.toLowerCase().includes(normalizedQuery),
          ),
        );

  const totalsByCategory = mapped.reduce<Record<string, number>>((totals, expense) => {
    totals[expense.category] = (totals[expense.category] ?? 0) + expense.amount;
    return totals;
  }, {});
  const topCategory =
    Object.entries(totalsByCategory).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Sin datos";

  return {
    expenses: filtered,
    totalExpenses: mapped.length,
    totalAmount: mapped.reduce((total, expense) => total + expense.amount, 0),
    todayCount: mapped.filter((expense) => expense.date >= dayStart && expense.date < dayEnd)
      .length,
    todayAmount: mapped
      .filter((expense) => expense.date >= dayStart && expense.date < dayEnd)
      .reduce((total, expense) => total + expense.amount, 0),
    topCategory,
  };
}

async function voidExpense(formData: FormData) {
  "use server";

  const actor = await requireRole(["ADMIN", "MANAGER"]);
  const parsedResult = voidExpenseSchema.safeParse({
    expenseId: formData.get("expenseId"),
    reason: formData.get("reason"),
    confirmAction: formData.get("confirmAction"),
  });
  if (!parsedResult.success) {
    redirect("/gastos?error=confirm");
  }
  const parsed = parsedResult.data;

  const expense = await prisma.expense.findFirst({
    where: { id: parsed.expenseId, companyId: actor.companyId },
  });

  if (expense == null || expense.voidedAt != null) {
    redirect("/gastos?error=not-found");
  }

  await prisma.$transaction(async (tx) => {
    await tx.expense.update({
      where: { id: expense.id },
      data: { voidedAt: new Date() },
    });
    await tx.cashMovement.create({
      data: {
        companyId: actor.companyId,
        routeId: expense.routeId,
        type: "INCOME",
        amount: expense.amount,
        concept: `Anulacion gasto ${expense.concept}`,
        sourceType: "EXPENSE_VOID",
        sourceId: expense.id,
        createdById: actor.id,
      },
    });
    await tx.auditLog.create({
      data: {
        companyId: actor.companyId,
        userId: actor.id,
        action: "VOID",
        entityType: "Expense",
        entityId: expense.id,
        beforeJson: JSON.stringify({
          concept: expense.concept,
          amount: expense.amount,
          voidedAt: expense.voidedAt,
        }),
        afterJson: JSON.stringify({ voidReason: parsed.reason }),
      },
    });
  });

  revalidatePath("/");
  revalidatePath("/gastos");
  revalidatePath("/caja");
  revalidatePath("/balances");
  revalidatePath("/resumen");
  revalidatePath("/auditoria");
  redirect("/gastos");
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
      {message}
    </div>
  );
}

function expenseListErrorLabel(error: string) {
  const labels: Record<string, string> = {
    confirm: "Debes escribir un motivo y marcar confirmacion para anular.",
    "not-found": "El gasto no existe, no pertenece a esta empresa o ya fue anulado.",
  };

  return labels[error] ?? "No se pudo completar la accion.";
}
