import { revalidatePath } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { ArrowLeft, BanknoteArrowDown, Save } from "lucide-react";
import { z } from "zod";

import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { applyPayment } from "@/lib/finance";
import { formatMoney } from "@/lib/format";
import { allocateAmountToInstallments, loanBalance } from "@/lib/payments";

export const dynamic = "force-dynamic";

type NewPaymentPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const paymentSchema = z.object({
  loanId: z.string().trim().min(1),
  amount: z.coerce.number().int().positive(),
  paymentType: z.enum(["AUTOMATIC", "MIXED", "MORA", "CHARGES", "DISCOUNT"]),
  paymentMethod: z.enum(["CASH", "TRANSFER", "CARD", "OFFICE"]),
  note: z.string().trim().optional(),
});

export default async function NewPaymentPage({ searchParams }: NewPaymentPageProps) {
  const params = (await searchParams) ?? {};
  const error = typeof params.error === "string" ? params.error : "";
  const selectedLoanId = typeof params.loanId === "string" ? params.loanId : undefined;
  const selectedClientId =
    typeof params.clientId === "string" ? params.clientId : undefined;
  const loans = await getPayableLoans();
  const defaultLoanId = loans.some((loan) => loan.id === selectedLoanId)
    ? selectedLoanId
    : loans.find((loan) => loan.clientId === selectedClientId)?.id ?? loans[0]?.id;

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-slate-950">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">Abonos</p>
            <h1 className="mt-1 text-2xl font-semibold">Nuevo abono</h1>
          </div>
          <Link
            href="/abonos"
            className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft size={17} />
            Volver
          </Link>
        </div>

        {error.length > 0 ? <ErrorBanner message={paymentErrorLabel(error)} /> : null}

        <section className="rounded-lg border border-slate-200 bg-white">
          <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
            <div className="flex size-10 items-center justify-center rounded-md bg-slate-950 text-white">
              <BanknoteArrowDown size={19} />
            </div>
            <div>
              <h2 className="text-base font-semibold">Registrar pago</h2>
              <p className="text-sm text-slate-500">
                Aplica el abono a la deuda, actualiza cuotas y mueve caja.
              </p>
            </div>
          </div>

          {loans.length === 0 ? (
            <div className="px-5 py-10 text-sm text-slate-500">
              No hay prestamos activos con saldo pendiente.
            </div>
          ) : (
            <form action={createPayment} className="space-y-6 p-5">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Prestamo">
                  <select
                    name="loanId"
                    required
                    className="field-input"
                    defaultValue={defaultLoanId}
                  >
                    {loans.map((loan) => (
                      <option key={loan.id} value={loan.id}>
                        {loan.clientName} - {loan.code} - saldo {formatMoney(loan.balance)}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Monto recibido">
                  <input
                    name="amount"
                    type="number"
                    min="1"
                    step="1000"
                    required
                    placeholder="50000"
                    className="field-input"
                  />
                </Field>
                <Field label="Tipo de abono">
                  <select name="paymentType" className="field-input" defaultValue="AUTOMATIC">
                    <option value="AUTOMATIC">Automatico</option>
                    <option value="MIXED">Mixto</option>
                    <option value="MORA">Solo mora</option>
                    <option value="CHARGES">Solo cargos</option>
                    <option value="DISCOUNT">Descuento</option>
                  </select>
                </Field>
                <Field label="Metodo">
                  <select name="paymentMethod" className="field-input" defaultValue="CASH">
                    <option value="CASH">Efectivo</option>
                    <option value="TRANSFER">Transferencia</option>
                    <option value="CARD">Tarjeta</option>
                    <option value="OFFICE">Oficina</option>
                  </select>
                </Field>
                <div className="col-span-2">
                  <Field label="Nota">
                    <input
                      name="note"
                      placeholder="Detalle opcional del pago"
                      className="field-input"
                    />
                  </Field>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                El orden automatico aplica primero mora/cargos si existen, luego interes
                y finalmente capital. Las cuotas se marcan desde la mas antigua.
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-200 pt-5">
                <Link
                  href="/abonos"
                  className="inline-flex h-10 items-center rounded-md border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </Link>
                <button className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-medium text-white hover:bg-slate-800">
                  <Save size={17} />
                  Registrar abono
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

async function getPayableLoans() {
  const actor = await currentUser();
  const loans = await prisma.loan.findMany({
    where: { companyId: actor.companyId, status: "ACTIVE" },
    include: {
      client: true,
      payments: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return loans
    .map((loan) => ({
      id: loan.id,
      code: loan.code,
      clientId: loan.clientId,
      clientName: loan.client.fullName,
      balance: loanBalance(
        loan.totalAmount,
        loan.payments
          .filter((payment) => payment.voidedAt == null)
          .map((payment) => payment.amount),
      ),
    }))
    .filter((loan) => loan.balance > 0);
}

async function createPayment(formData: FormData) {
  "use server";

  const actor = await currentUser();

  const parsedResult = paymentSchema.safeParse({
    loanId: formData.get("loanId"),
    amount: formData.get("amount"),
    paymentType: formData.get("paymentType"),
    paymentMethod: formData.get("paymentMethod"),
    note: formData.get("note") || undefined,
  });
  if (!parsedResult.success) {
    redirect("/abonos/nuevo?error=invalid");
  }
  const parsed = parsedResult.data;

  const loan = await prisma.loan.findFirst({
    where: { id: parsed.loanId, companyId: actor.companyId },
    include: {
      client: true,
      payments: true,
      installments: { orderBy: { number: "asc" } },
    },
  });

  if (loan == null) {
    redirect("/abonos/nuevo?error=loan");
  }

  const currentBalance = loanBalance(
    loan.totalAmount,
    loan.payments
      .filter((payment) => payment.voidedAt == null)
      .map((payment) => payment.amount),
  );

  if (currentBalance <= 0) {
    redirect("/abonos/nuevo?error=no-balance");
  }

  if (parsed.amount > currentBalance) {
    redirect(`/abonos/nuevo?loanId=${loan.id}&error=amount`);
  }

  const activePayments = loan.payments.filter((payment) => payment.voidedAt == null);
  const principalPaid = activePayments.reduce(
    (total, payment) => total + payment.principalPaid,
    0,
  );
  const interestPaid = activePayments.reduce(
    (total, payment) => total + payment.interestPaid,
    0,
  );
  const moraBalance = loan.installments.reduce(
    (total, installment) => total + installment.moraAmount,
    0,
  );
  const chargesBalance = loan.installments.reduce(
    (total, installment) => total + installment.chargeAmount,
    0,
  );

  const allocation = applyPayment({
    amount: parsed.amount,
    principalBalance: Math.max(0, loan.principal - principalPaid),
    interestBalance: Math.max(0, loan.interestAmount - interestPaid),
    moraBalance,
    chargesBalance,
    paymentType: parsed.paymentType,
  });

  const installmentUpdates = allocateAmountToInstallments(
    loan.installments.map((installment) => ({
      id: installment.id,
      number: installment.number,
      totalAmount: installment.totalAmount,
      paidAmount: installment.paidAmount,
    })),
    parsed.paymentType === "DISCOUNT" ? 0 : parsed.amount,
  );

  const nextBalance = currentBalance - parsed.amount;
  await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: {
        companyId: actor.companyId,
        routeId: loan.routeId,
        clientId: loan.clientId,
        loanId: loan.id,
        amount: parsed.amount,
        principalPaid: allocation.principalPaid,
        interestPaid: allocation.interestPaid,
        moraPaid: allocation.moraPaid,
        chargesPaid: allocation.chargesPaid,
        discountAmount: allocation.discountAmount,
        paymentType: parsed.paymentType,
        paymentMethod: parsed.paymentMethod,
        note: parsed.note || null,
        createdById: actor.id,
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

    if (nextBalance <= 0) {
      await tx.loan.update({
        where: { id: loan.id },
        data: { status: "COMPLETED" },
      });
    }

    await tx.cashMovement.create({
      data: {
        companyId: actor.companyId,
        routeId: loan.routeId,
        type: parsed.paymentType === "DISCOUNT" ? "ADJUSTMENT" : "INCOME",
        amount: parsed.amount,
        concept: `Abono ${loan.client.fullName}`,
        sourceType: "PAYMENT",
        sourceId: payment.id,
        createdById: actor.id,
      },
    });

    await tx.auditLog.create({
      data: {
        companyId: actor.companyId,
        userId: actor.id,
        action: "CREATE",
        entityType: "Payment",
        entityId: payment.id,
        afterJson: JSON.stringify({
          loanId: loan.id,
          amount: parsed.amount,
          principalPaid: allocation.principalPaid,
          interestPaid: allocation.interestPaid,
        }),
      },
    });
  });

  revalidatePath("/");
  revalidatePath("/abonos");
  revalidatePath("/prestamos");
  revalidatePath(`/prestamos/${loan.id}`);
  revalidatePath("/clientes");
  revalidatePath(`/clientes/${loan.clientId}`);
  revalidatePath("/caja");
  redirect(`/prestamos/${loan.id}`);
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
      {message}
    </div>
  );
}

function paymentErrorLabel(error: string) {
  const labels: Record<string, string> = {
    amount: "El abono no puede ser mayor al saldo pendiente.",
    invalid: "Revisa prestamo, monto, tipo y metodo de pago.",
    loan: "El prestamo seleccionado no pertenece a esta empresa.",
    "no-balance": "El prestamo ya no tiene saldo pendiente.",
  };

  return labels[error] ?? "No se pudo registrar el abono.";
}
