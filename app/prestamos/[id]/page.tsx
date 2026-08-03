import { revalidatePath } from "next/cache";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  BanknoteArrowDown,
  BadgeDollarSign,
  CalendarClock,
  ListChecks,
  UserRound,
} from "lucide-react";
import { z } from "zod";

import { currentUser, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatMoney, formatShortDate } from "@/lib/format";
import { loanBalance } from "@/lib/payments";

export const dynamic = "force-dynamic";

const loanActionSchema = z.object({
  loanId: z.string().trim().min(1),
  reason: z.string().trim().optional(),
  confirmAction: z.literal("on"),
});

type LoanDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoanDetailPage({ params, searchParams }: LoanDetailPageProps) {
  const { id } = await params;
  const query = (await searchParams) ?? {};
  const error = typeof query.error === "string" ? query.error : "";
  const data = await getLoanDetail(id);

  if (data == null) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#D5F0D1] text-slate-950">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <Link
              href="/prestamos"
              className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950"
            >
              <ArrowLeft size={16} />
              Volver a prestamos
            </Link>
            <h1 className="text-2xl font-semibold">{data.code}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {data.clientName} - {data.routeName} - {data.modalityLabel}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/clientes/${data.clientId}`}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <UserRound size={17} />
              Ver cliente
            </Link>
            <Link
              href={`/abonos/nuevo?loanId=${data.id}`}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-[#50A96B] px-4 text-sm font-medium text-white hover:bg-[#32603d]"
            >
              <BanknoteArrowDown size={17} />
              Nuevo abono
            </Link>
          </div>
        </div>

        <section className="mb-6 grid grid-cols-4 gap-4">
          <MetricCard
            label="Saldo"
            value={formatMoney(data.balance)}
            note={data.status === "ACTIVE" ? "Prestamo activo" : "Prestamo completado"}
            icon={<BadgeDollarSign size={21} />}
          />
          <MetricCard
            label="Total"
            value={formatMoney(data.totalAmount)}
            note={`${formatMoney(data.principal)} capital`}
            icon={<ListChecks size={21} />}
          />
          <MetricCard
            label="Abonado"
            value={formatMoney(data.totalPaid)}
            note={`${data.payments.length} pagos registrados`}
            icon={<BanknoteArrowDown size={21} />}
          />
          <MetricCard
            label="Proxima cuota"
            value={data.nextDueDate == null ? "Sin cuotas" : formatShortDate(data.nextDueDate)}
            note={`${data.paidInstallments}/${data.installments.length} pagadas`}
            icon={<CalendarClock size={21} />}
          />
        </section>

        <section className="mb-6 rounded-lg border border-slate-200 bg-white">
          {error.length > 0 ? (
            <div className="border-b border-rose-200 bg-rose-50 px-5 py-3 text-sm font-medium text-rose-700">
              {loanDetailErrorLabel(error)}
            </div>
          ) : null}
          <div className="flex flex-wrap items-end justify-between gap-4 px-5 py-4">
            <div>
              <h2 className="text-base font-semibold">Control financiero</h2>
              <p className="text-sm text-slate-500">
                Cierre y anulacion con trazabilidad. La anulacion solo se permite sin abonos activos.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/prestamos/${data.id}/contrato`}
                className="inline-flex h-10 items-center rounded-md border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Contrato
              </Link>
              <form action={closeLoan}>
                <input type="hidden" name="loanId" value={data.id} />
                <div className="flex gap-2">
                  <label className="flex h-10 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-600">
                    <input name="confirmAction" type="checkbox" required className="size-4" />
                    Confirmo
                  </label>
                  <button className="h-10 rounded-md border border-emerald-200 px-4 text-sm font-medium text-emerald-700 hover:bg-emerald-50">
                    Cerrar
                  </button>
                </div>
              </form>
              <form action={voidLoan} className="flex gap-2">
                <input type="hidden" name="loanId" value={data.id} />
                <input
                  name="reason"
                  required
                  placeholder="Motivo"
                  className="h-10 w-36 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
                />
                <label className="flex h-10 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-600">
                  <input name="confirmAction" type="checkbox" required className="size-4" />
                  Confirmo
                </label>
                <button className="h-10 rounded-md border border-rose-200 px-4 text-sm font-medium text-rose-700 hover:bg-rose-50">
                  Anular
                </button>
              </form>
            </div>
          </div>
        </section>

        <section className="mb-6 grid grid-cols-[0.8fr_1.2fr] gap-5">
          <article className="rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-base font-semibold">Condiciones</h2>
              <p className="text-sm text-slate-500">Parametros originales del prestamo</p>
            </div>
            <div className="grid grid-cols-2 gap-4 p-5 text-sm">
              <Info label="Estado" value={data.statusLabel} />
              <Info label="Modalidad" value={data.modalityLabel} />
              <Info label="Interes" value={`${data.interestRate}%`} />
              <Info label="Ganancia" value={formatMoney(data.interestAmount)} />
              <Info label="Inicio" value={formatShortDate(data.startDate)} />
              <Info label="Fin" value={formatShortDate(data.endDate)} />
              <Info label="No sabados" value={data.noChargeSaturday ? "Si" : "No"} />
              <Info label="No domingos" value={data.noChargeSunday ? "Si" : "No"} />
            </div>
          </article>

          <article className="rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-base font-semibold">Cuotas</h2>
              <p className="text-sm text-slate-500">Estado de cobro cuota por cuota</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">No.</th>
                    <th className="px-5 py-3 font-semibold">Vence</th>
                    <th className="px-5 py-3 font-semibold">Estado</th>
                    <th className="px-5 py-3 text-right font-semibold">Pagado</th>
                    <th className="px-5 py-3 text-right font-semibold">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.installments.map((installment) => (
                    <tr key={installment.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-4 font-semibold">{installment.number}</td>
                      <td className="px-5 py-4 text-slate-600">
                        {formatShortDate(installment.dueDate)}
                      </td>
                      <td className="px-5 py-4">
                        <InstallmentPill status={installment.status} />
                      </td>
                      <td className="px-5 py-4 text-right">
                        {formatMoney(installment.paidAmount)}
                      </td>
                      <td className="px-5 py-4 text-right font-semibold">
                        {formatMoney(installment.totalAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-base font-semibold">Abonos del prestamo</h2>
            <p className="text-sm text-slate-500">Pagos aplicados y distribucion financiera</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Fecha</th>
                  <th className="px-5 py-3 font-semibold">Metodo</th>
                  <th className="px-5 py-3 font-semibold">Nota</th>
                  <th className="px-5 py-3 text-right font-semibold">Capital</th>
                  <th className="px-5 py-3 text-right font-semibold">Interes</th>
                  <th className="px-5 py-3 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-4 text-slate-600">
                      {formatShortDate(payment.createdAt)}
                    </td>
                    <td className="px-5 py-4 text-slate-600">{payment.paymentMethod}</td>
                    <td className="px-5 py-4 text-slate-600">{payment.note ?? "Sin nota"}</td>
                    <td className="px-5 py-4 text-right">
                      {formatMoney(payment.principalPaid)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {formatMoney(payment.interestPaid)}
                    </td>
                    <td className="px-5 py-4 text-right font-semibold">
                      {formatMoney(payment.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.payments.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-slate-500">
              Este prestamo aun no tiene abonos.
            </div>
          ) : null}
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
          <p className="mt-2 text-xl font-semibold">{value}</p>
        </div>
        <div className="text-slate-500">{icon}</div>
      </div>
      <p className="mt-3 text-xs text-slate-500">{note}</p>
    </article>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-slate-800">{value}</p>
    </div>
  );
}

function InstallmentPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PAID: "bg-emerald-50 text-emerald-700",
    PARTIAL: "bg-amber-50 text-amber-700",
    OVERDUE: "bg-rose-50 text-rose-700",
    PENDING: "bg-slate-100 text-slate-600",
  };

  const labels: Record<string, string> = {
    PAID: "Pagada",
    PARTIAL: "Parcial",
    OVERDUE: "Mora",
    PENDING: "Pendiente",
  };

  return (
    <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${styles[status] ?? styles.PENDING}`}>
      {labels[status] ?? status}
    </span>
  );
}

async function getLoanDetail(id: string) {
  const actor = await currentUser();
  const loan = await prisma.loan.findFirst({
    where: { id, companyId: actor.companyId },
    include: {
      route: true,
      client: true,
      payments: { orderBy: { createdAt: "desc" } },
      installments: { orderBy: { number: "asc" } },
    },
  });

  if (loan == null) {
    return null;
  }

  const activePayments = loan.payments.filter((payment) => payment.voidedAt == null);
  const totalPaid = activePayments.reduce((total, payment) => total + payment.amount, 0);
  const balance = loanBalance(
    loan.totalAmount,
    activePayments.map((payment) => payment.amount),
  );
  const nextDueDate =
    loan.installments.find((installment) => installment.status !== "PAID")?.dueDate ?? null;

  return {
    id: loan.id,
    code: loan.code,
    clientId: loan.clientId,
    clientName: loan.client.fullName,
    routeName: loan.route.name,
    status: loan.status,
    statusLabel:
      loan.status === "ACTIVE"
        ? "Activo"
        : loan.status === "VOIDED"
          ? "Anulado"
          : "Completado",
    principal: loan.principal,
    interestRate: loan.interestRate,
    interestAmount: loan.interestAmount,
    totalAmount: loan.totalAmount,
    modalityLabel: modalityLabel(loan.modality),
    startDate: loan.startDate,
    endDate: loan.endDate,
    noChargeSaturday: loan.noChargeSaturday,
    noChargeSunday: loan.noChargeSunday,
    balance,
    totalPaid,
    paidInstallments: loan.installments.filter((installment) => installment.status === "PAID")
      .length,
    nextDueDate,
    payments: activePayments,
    installments: loan.installments,
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

async function closeLoan(formData: FormData) {
  "use server";

  const actor = await requireRole(["ADMIN", "MANAGER"]);
  const parsedResult = loanActionSchema.safeParse({
    loanId: formData.get("loanId"),
    confirmAction: formData.get("confirmAction"),
  });
  if (!parsedResult.success) {
    redirect("/prestamos?error=confirm");
  }
  const parsed = parsedResult.data;
  const loan = await prisma.loan.findFirst({
    where: { id: parsed.loanId, companyId: actor.companyId },
    include: { payments: true },
  });

  if (loan == null) {
    redirect("/prestamos?error=not-found");
  }

  const activePayments = loan.payments.filter((payment) => payment.voidedAt == null);
  const balance = loanBalance(
    loan.totalAmount,
    activePayments.map((payment) => payment.amount),
  );

  if (balance > 0) {
    redirect(`/prestamos/${loan.id}?error=balance`);
  }

  await prisma.$transaction(async (tx) => {
    await tx.loan.update({
      where: { id: loan.id },
      data: { status: "COMPLETED" },
    });
    await tx.auditLog.create({
      data: {
        companyId: actor.companyId,
        userId: actor.id,
        action: "CLOSE",
        entityType: "Loan",
        entityId: loan.id,
        beforeJson: JSON.stringify({ status: loan.status }),
        afterJson: JSON.stringify({ status: "COMPLETED" }),
      },
    });
  });

  revalidatePath("/prestamos");
  revalidatePath(`/prestamos/${loan.id}`);
  revalidatePath(`/clientes/${loan.clientId}`);
  revalidatePath("/auditoria");
  redirect(`/prestamos/${loan.id}`);
}

async function voidLoan(formData: FormData) {
  "use server";

  const actor = await requireRole(["ADMIN", "MANAGER"]);
  const parsedResult = loanActionSchema.safeParse({
    loanId: formData.get("loanId"),
    reason: formData.get("reason"),
    confirmAction: formData.get("confirmAction"),
  });
  if (!parsedResult.success) {
    redirect("/prestamos?error=confirm");
  }
  const parsed = parsedResult.data;
  const loan = await prisma.loan.findFirst({
    where: { id: parsed.loanId, companyId: actor.companyId },
    include: { payments: true },
  });

  if (loan == null) {
    redirect("/prestamos?error=not-found");
  }

  const activePayments = loan.payments.filter((payment) => payment.voidedAt == null);

  if (activePayments.length > 0) {
    redirect(`/prestamos/${loan.id}?error=payments`);
  }

  if (loan.status === "VOIDED") {
    redirect(`/prestamos/${loan.id}?error=voided`);
  }

  await prisma.$transaction(async (tx) => {
    await tx.loan.update({
      where: { id: loan.id },
      data: { status: "VOIDED" },
    });
    await tx.cashMovement.create({
      data: {
        companyId: actor.companyId,
        routeId: loan.routeId,
        type: "INCOME",
        amount: loan.principal,
        concept: `Anulacion prestamo ${loan.code}`,
        sourceType: "LOAN_VOID",
        sourceId: loan.id,
        createdById: actor.id,
      },
    });
    await tx.auditLog.create({
      data: {
        companyId: actor.companyId,
        userId: actor.id,
        action: "VOID",
        entityType: "Loan",
        entityId: loan.id,
        beforeJson: JSON.stringify({ status: loan.status, principal: loan.principal }),
        afterJson: JSON.stringify({ status: "VOIDED", voidReason: parsed.reason }),
      },
    });
  });

  revalidatePath("/");
  revalidatePath("/prestamos");
  revalidatePath(`/prestamos/${loan.id}`);
  revalidatePath(`/clientes/${loan.clientId}`);
  revalidatePath("/caja");
  revalidatePath("/balances");
  revalidatePath("/resumen");
  revalidatePath("/auditoria");
  redirect(`/prestamos/${loan.id}`);
}

function loanDetailErrorLabel(error: string) {
  const labels: Record<string, string> = {
    balance: "Solo se puede cerrar un prestamo sin saldo pendiente.",
    payments: "No se puede anular un prestamo con abonos activos.",
    voided: "El prestamo ya fue anulado.",
  };

  return labels[error] ?? "No se pudo completar la accion.";
}
