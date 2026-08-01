import { revalidatePath } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { ArrowLeft, Calculator, Save } from "lucide-react";
import { z } from "zod";

import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { calculateLoanSchedule, type LoanModality } from "@/lib/finance";

export const dynamic = "force-dynamic";

type NewLoanPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const loanSchema = z.object({
  clientId: z.string().trim().min(1),
  principal: z.coerce.number().int().positive(),
  interestRate: z.coerce.number().int().min(0).max(1000),
  installmentCount: z.coerce.number().int().positive().max(365),
  modality: z.enum(["DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY"]),
  startDate: z.string().trim().min(10),
  noChargeSaturday: z.boolean(),
  noChargeSunday: z.boolean(),
});

export default async function NewLoanPage({ searchParams }: NewLoanPageProps) {
  const params = (await searchParams) ?? {};
  const error = typeof params.error === "string" ? params.error : "";
  const selectedClientId =
    typeof params.clientId === "string" ? params.clientId : undefined;
  const actor = await currentUser();
  const clients = await prisma.client.findMany({
    where: { companyId: actor.companyId, status: "ACTIVE" },
    include: {
      route: true,
    },
    orderBy: { fullName: "asc" },
  });
  const defaultClientId = clients.some((client) => client.id === selectedClientId)
    ? selectedClientId
    : clients[0]?.id;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-slate-950">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">Prestamos</p>
            <h1 className="mt-1 text-2xl font-semibold">Nuevo prestamo</h1>
          </div>
          <Link
            href="/prestamos"
            className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft size={17} />
            Volver
          </Link>
        </div>

        {error.length > 0 ? <ErrorBanner message={loanErrorLabel(error)} /> : null}

        <section className="rounded-lg border border-slate-200 bg-white">
          <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
            <div className="flex size-10 items-center justify-center rounded-md bg-slate-950 text-white">
              <Calculator size={19} />
            </div>
            <div>
              <h2 className="text-base font-semibold">Condiciones del prestamo</h2>
              <p className="text-sm text-slate-500">
                Calcula cuotas, fechas y ganancia minima compatible con lo observado.
              </p>
            </div>
          </div>

          {clients.length === 0 ? (
            <div className="px-5 py-10 text-sm text-slate-500">
              Primero registra un cliente activo.
            </div>
          ) : (
            <form action={createLoan} className="space-y-6 p-5">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Cliente">
                  <select
                    name="clientId"
                    required
                    className="field-input"
                    defaultValue={defaultClientId}
                  >
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.fullName} - {client.route.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Modalidad">
                  <select name="modality" className="field-input" defaultValue="DAILY">
                    <option value="DAILY">Diario</option>
                    <option value="WEEKLY">Semanal</option>
                    <option value="BIWEEKLY">Quincenal</option>
                    <option value="MONTHLY">Mensual</option>
                  </select>
                </Field>
                <Field label="Monto prestado">
                  <input
                    name="principal"
                    type="number"
                    min="1"
                    step="1000"
                    required
                    placeholder="100000"
                    className="field-input"
                  />
                </Field>
                <Field label="Interes (%)">
                  <input
                    name="interestRate"
                    type="number"
                    min="0"
                    max="1000"
                    step="1"
                    defaultValue="0"
                    className="field-input"
                  />
                </Field>
                <Field label="Numero de cuotas">
                  <input
                    name="installmentCount"
                    type="number"
                    min="1"
                    max="365"
                    defaultValue="1"
                    required
                    className="field-input"
                  />
                </Field>
                <Field label="Fecha inicial">
                  <input
                    name="startDate"
                    type="date"
                    defaultValue={today}
                    required
                    className="field-input"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
                  <input
                    name="noChargeSaturday"
                    type="checkbox"
                    className="size-4 rounded border-slate-300"
                  />
                  No cobrar sabados
                </label>
                <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
                  <input
                    name="noChargeSunday"
                    type="checkbox"
                    defaultChecked
                    className="size-4 rounded border-slate-300"
                  />
                  No cobrar domingos
                </label>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-200 pt-5">
                <Link
                  href="/prestamos"
                  className="inline-flex h-10 items-center rounded-md border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </Link>
                <button className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-medium text-white hover:bg-slate-800">
                  <Save size={17} />
                  Crear prestamo
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

async function createLoan(formData: FormData) {
  "use server";

  const actor = await currentUser();

  const parsedResult = loanSchema.safeParse({
    clientId: formData.get("clientId"),
    principal: formData.get("principal"),
    interestRate: formData.get("interestRate"),
    installmentCount: formData.get("installmentCount"),
    modality: formData.get("modality"),
    startDate: formData.get("startDate"),
    noChargeSaturday: formData.get("noChargeSaturday") === "on",
    noChargeSunday: formData.get("noChargeSunday") === "on",
  });
  if (!parsedResult.success) {
    redirect("/prestamos/nuevo?error=invalid");
  }
  const parsed = parsedResult.data;

  const client = await prisma.client.findFirst({
    where: { id: parsed.clientId, companyId: actor.companyId, status: "ACTIVE" },
  });

  if (client == null) {
    redirect("/prestamos/nuevo?error=client");
  }

  const schedule = calculateLoanSchedule({
    principal: parsed.principal,
    interestRate: parsed.interestRate,
    installmentCount: parsed.installmentCount,
    startDate: new Date(`${parsed.startDate}T12:00:00.000Z`),
    modality: parsed.modality as LoanModality,
    noChargeSaturday: parsed.noChargeSaturday,
    noChargeSunday: parsed.noChargeSunday,
  });

  const code = `WEB-${Date.now().toString(36).toUpperCase()}`;

  let createdLoanId = "";

  await prisma.$transaction(async (tx) => {
    const loan = await tx.loan.create({
      data: {
        companyId: actor.companyId,
        routeId: client.routeId,
        clientId: client.id,
        createdById: actor.id,
        code,
        principal: schedule.principal,
        interestRate: parsed.interestRate,
        interestAmount: schedule.interestAmount,
        totalAmount: schedule.totalAmount,
        installmentAmount: schedule.installmentAmount,
        installmentCount: schedule.installments.length,
        modality: parsed.modality,
        paymentScheme: "INSTALLMENTS",
        startDate: schedule.startDate,
        endDate: schedule.endDate,
        status: "ACTIVE",
        noChargeSaturday: parsed.noChargeSaturday,
        noChargeSunday: parsed.noChargeSunday,
        installments: {
          create: schedule.installments.map((installment) => ({
            number: installment.number,
            dueDate: installment.dueDate,
            principalAmount: installment.principalAmount,
            interestAmount: installment.interestAmount,
            totalAmount: installment.totalAmount,
            paidAmount: 0,
            balance: installment.totalAmount,
            status: "PENDING",
          })),
        },
      },
    });
    createdLoanId = loan.id;

    await tx.cashMovement.create({
      data: {
        companyId: actor.companyId,
        routeId: client.routeId,
        type: "OUTCOME",
        amount: schedule.principal,
        concept: `Prestamo ${client.fullName}`,
        sourceType: "LOAN",
        sourceId: loan.id,
        createdById: actor.id,
      },
    });

    await tx.auditLog.create({
      data: {
        companyId: actor.companyId,
        userId: actor.id,
        action: "CREATE",
        entityType: "Loan",
        entityId: loan.id,
        afterJson: JSON.stringify({
          code: loan.code,
          clientId: loan.clientId,
          principal: loan.principal,
          totalAmount: loan.totalAmount,
          installmentCount: loan.installmentCount,
        }),
      },
    });
  });

  revalidatePath("/");
  revalidatePath("/prestamos");
  revalidatePath(`/prestamos/${createdLoanId}`);
  revalidatePath("/clientes");
  revalidatePath(`/clientes/${client.id}`);
  redirect(`/prestamos/${createdLoanId}`);
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
      {message}
    </div>
  );
}

function loanErrorLabel(error: string) {
  const labels: Record<string, string> = {
    client: "El cliente seleccionado no esta activo o no pertenece a esta empresa.",
    invalid: "Revisa monto, cuotas, interes y fecha inicial.",
  };

  return labels[error] ?? "No se pudo crear el prestamo.";
}
