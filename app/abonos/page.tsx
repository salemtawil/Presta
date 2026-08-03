import { revalidatePath } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import {
  BanknoteArrowDown,
  CircleDollarSign,
  ClipboardList,
  Plus,
  Search,
  Wallet,
} from "lucide-react";
import { z } from "zod";

import { currentUser, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatMoney, formatShortDate } from "@/lib/format";
import { reverseAmountFromInstallments } from "@/lib/payments";

export const dynamic = "force-dynamic";

const voidPaymentSchema = z.object({
  paymentId: z.string().trim().min(1),
  reason: z.string().trim().min(3),
  confirmAction: z.literal("on"),
});

type PaymentsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PaymentsPage({ searchParams }: PaymentsPageProps) {
  const params = (await searchParams) ?? {};
  const query = typeof params.q === "string" ? params.q.trim() : "";
  const error = typeof params.error === "string" ? params.error : "";
  const data = await getPaymentsData(query);

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
                  label === "Abonos"
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
              <h1 className="text-lg font-semibold">Abonos</h1>
            </div>
            <Link
              href="/abonos/nuevo"
              className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-medium text-white hover:bg-slate-800"
            >
              <Plus size={17} />
              Nuevo abono
            </Link>
          </header>

          <div className="space-y-6 px-8 py-7">
            {error.length > 0 ? <ErrorBanner message={paymentListErrorLabel(error)} /> : null}

            <section className="grid grid-cols-4 gap-4">
              <MetricCard
                label="Cobrado hoy"
                value={formatMoney(data.collectedToday)}
                note={`${data.paymentsToday} abonos hoy`}
                icon={<BanknoteArrowDown size={21} />}
              />
              <MetricCard
                label="Total cobrado"
                value={formatMoney(data.totalCollected)}
                note="Historico registrado"
                icon={<CircleDollarSign size={21} />}
              />
              <MetricCard
                label="Capital"
                value={formatMoney(data.principalCollected)}
                note="Aplicado a saldo"
                icon={<Wallet size={21} />}
              />
              <MetricCard
                label="Ganancia"
                value={formatMoney(data.interestCollected)}
                note="Interes cobrado"
                icon={<ClipboardList size={21} />}
              />
            </section>

            <section className="rounded-lg border border-slate-200 bg-white">
              <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
                <div>
                  <h2 className="text-base font-semibold">Historial de abonos</h2>
                  <p className="text-sm text-slate-500">
                    Busqueda por cliente, codigo de prestamo, nota o metodo
                  </p>
                </div>
                <form className="flex w-[420px] items-center gap-2" action="/abonos">
                  <label className="relative flex-1">
                    <Search
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      size={17}
                    />
                    <input
                      name="q"
                      defaultValue={query}
                      placeholder="Buscar abono..."
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
                      <th className="px-5 py-3 font-semibold">Cliente</th>
                      <th className="px-5 py-3 font-semibold">Prestamo</th>
                      <th className="px-5 py-3 font-semibold">Metodo</th>
                      <th className="px-5 py-3 text-right font-semibold">Capital</th>
                      <th className="px-5 py-3 text-right font-semibold">Interes</th>
                      <th className="px-5 py-3 text-right font-semibold">Total</th>
                      <th className="px-5 py-3 text-right font-semibold">Accion</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.payments.map((payment) => (
                      <tr
                        key={payment.id}
                        className={payment.voidedAt == null ? "hover:bg-slate-50/70" : "bg-slate-50 text-slate-400"}
                      >
                        <td className="px-5 py-4 text-slate-600">
                          {formatShortDate(payment.createdAt)}
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-semibold">{payment.clientName}</p>
                          <p className="text-xs text-slate-500">
                            {payment.voidedAt == null ? payment.note : `Anulado: ${payment.voidReason}`}
                          </p>
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          <Link href={`/prestamos/${payment.loanId}`} className="hover:underline">
                            {payment.loanCode}
                          </Link>
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          {methodLabel(payment.paymentMethod)}
                        </td>
                        <td className="px-5 py-4 text-right">
                          {formatMoney(payment.principalPaid)}
                        </td>
                        <td className="px-5 py-4 text-right">
                          {formatMoney(payment.interestPaid)}
                        </td>
                        <td className="px-5 py-4 text-right font-semibold">
                          {formatMoney(payment.amount)}
                        </td>
                        <td className="px-5 py-4">
                          {payment.voidedAt == null ? (
                            <div className="flex justify-end gap-2">
                              <Link
                                href={`/abonos/${payment.id}/recibo`}
                                className="inline-flex h-9 items-center rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                              >
                                Recibo
                              </Link>
                              <form action={voidPayment} className="flex gap-2">
                                <input type="hidden" name="paymentId" value={payment.id} />
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
                            </div>
                          ) : (
                            <span className="block text-right text-xs font-semibold text-slate-500">
                              Anulado
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {data.payments.length === 0 ? (
                <div className="px-5 py-12 text-center text-sm text-slate-500">
                  No hay abonos con ese filtro.
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

async function getPaymentsData(query: string) {
  const actor = await currentUser();
  const dayStart = startOfDay(new Date());
  const dayEnd = addDays(dayStart, 1);

  const payments = await prisma.payment.findMany({
    where: { companyId: actor.companyId },
    include: {
      client: true,
      loan: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const normalizedQuery = query.toLowerCase();
  const mapped = payments.map((payment) => ({
    id: payment.id,
    createdAt: payment.createdAt,
    amount: payment.amount,
    principalPaid: payment.principalPaid,
    interestPaid: payment.interestPaid,
    paymentMethod: payment.paymentMethod,
    note: payment.note ?? "Sin nota",
    voidedAt: payment.voidedAt,
    voidReason: payment.voidReason,
    clientName: payment.client.fullName,
    loanId: payment.loanId,
    loanCode: payment.loan.code,
  }));
  const activePayments = mapped.filter((payment) => payment.voidedAt == null);

  const filtered =
    normalizedQuery.length === 0
      ? mapped
      : mapped.filter((payment) =>
          [
            payment.clientName,
            payment.loanCode,
            payment.paymentMethod,
            payment.note,
          ].some((value) => value.toLowerCase().includes(normalizedQuery)),
        );

  return {
    payments: filtered,
    paymentsToday: activePayments.filter(
      (payment) => payment.createdAt >= dayStart && payment.createdAt < dayEnd,
    ).length,
    collectedToday: activePayments
      .filter((payment) => payment.createdAt >= dayStart && payment.createdAt < dayEnd)
      .reduce((total, payment) => total + payment.amount, 0),
    totalCollected: activePayments.reduce((total, payment) => total + payment.amount, 0),
    principalCollected: activePayments.reduce(
      (total, payment) => total + payment.principalPaid,
      0,
    ),
    interestCollected: activePayments.reduce(
      (total, payment) => total + payment.interestPaid,
      0,
    ),
  };
}

async function voidPayment(formData: FormData) {
  "use server";

  const actor = await requireRole(["ADMIN", "MANAGER"]);
  const parsedResult = voidPaymentSchema.safeParse({
    paymentId: formData.get("paymentId"),
    reason: formData.get("reason"),
    confirmAction: formData.get("confirmAction"),
  });
  if (!parsedResult.success) {
    redirect("/abonos?error=confirm");
  }
  const parsed = parsedResult.data;

  const payment = await prisma.payment.findFirst({
    where: { id: parsed.paymentId, companyId: actor.companyId },
    include: {
      client: true,
      loan: {
        include: {
          installments: { orderBy: { number: "asc" } },
        },
      },
    },
  });

  if (payment == null || payment.voidedAt != null) {
    redirect("/abonos?error=not-found");
  }

  const installmentUpdates =
    payment.paymentType === "DISCOUNT"
      ? []
      : reverseAmountFromInstallments(
          payment.loan.installments.map((installment) => ({
            id: installment.id,
            number: installment.number,
            totalAmount: installment.totalAmount,
            paidAmount: installment.paidAmount,
          })),
          payment.amount,
        );
  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        voidedAt: new Date(),
        voidReason: parsed.reason,
      },
    });

    for (const update of installmentUpdates) {
      await tx.installment.update({
        where: { id: update.id },
        data: {
          paidAmount: update.paidAmount,
          balance: update.balance,
          status: update.status,
        },
      });
    }

    await tx.loan.update({
      where: { id: payment.loanId },
      data: { status: "ACTIVE" },
    });

    await tx.cashMovement.create({
      data: {
        companyId: actor.companyId,
        routeId: payment.routeId,
        type: payment.paymentType === "DISCOUNT" ? "ADJUSTMENT" : "OUTCOME",
        amount: payment.amount,
        concept: `Anulacion abono ${payment.client.fullName}`,
        sourceType: "PAYMENT_VOID",
        sourceId: payment.id,
        createdById: actor.id,
      },
    });

    await tx.auditLog.create({
      data: {
        companyId: actor.companyId,
        userId: actor.id,
        action: "VOID",
        entityType: "Payment",
        entityId: payment.id,
        beforeJson: JSON.stringify({
          amount: payment.amount,
          loanId: payment.loanId,
          voidedAt: payment.voidedAt,
        }),
        afterJson: JSON.stringify({ voidReason: parsed.reason }),
      },
    });
  });

  revalidatePath("/");
  revalidatePath("/abonos");
  revalidatePath(`/prestamos/${payment.loanId}`);
  revalidatePath(`/clientes/${payment.clientId}`);
  revalidatePath("/prestamos");
  revalidatePath("/clientes");
  revalidatePath("/caja");
  revalidatePath("/balances");
  revalidatePath("/resumen");
  revalidatePath("/auditoria");
  redirect("/abonos");
}

function methodLabel(value: string) {
  const labels: Record<string, string> = {
    CASH: "Efectivo",
    TRANSFER: "Transferencia",
    CARD: "Tarjeta",
    OFFICE: "Oficina",
  };

  return labels[value] ?? value;
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

function paymentListErrorLabel(error: string) {
  const labels: Record<string, string> = {
    confirm: "Debes escribir un motivo y marcar confirmacion para anular.",
    "not-found": "El abono no existe, no pertenece a esta empresa o ya fue anulado.",
  };

  return labels[error] ?? "No se pudo completar la accion.";
}
