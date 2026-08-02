import { revalidatePath } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { ArrowLeft, CreditCard, Save } from "lucide-react";
import { z } from "zod";

import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const expenseSchema = z.object({
  routeId: z.string().trim().min(1),
  concept: z.string().trim().min(2),
  category: z.string().trim().min(2),
  amount: z.coerce.number().int().positive(),
  date: z.string().trim().min(10),
});

type NewExpensePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function NewExpensePage({ searchParams }: NewExpensePageProps) {
  const params = (await searchParams) ?? {};
  const error = typeof params.error === "string" ? params.error : "";
  const actor = await currentUser();
  const routes = await prisma.route.findMany({
    where: { companyId: actor.companyId, active: true },
    orderBy: { name: "asc" },
  });
  const today = new Date().toISOString().slice(0, 10);

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-slate-950">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">Gastos</p>
            <h1 className="mt-1 text-2xl font-semibold">Nuevo gasto</h1>
          </div>
          <Link
            href="/gastos"
            className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft size={17} />
            Volver
          </Link>
        </div>

        {error.length > 0 ? <ErrorBanner message={expenseErrorLabel(error)} /> : null}

        <section className="rounded-lg border border-slate-200 bg-white">
          <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
            <div className="flex size-10 items-center justify-center rounded-md bg-slate-950 text-white">
              <CreditCard size={19} />
            </div>
            <div>
              <h2 className="text-base font-semibold">Datos del gasto</h2>
              <p className="text-sm text-slate-500">
                Registra salida, movimiento de caja y auditoria.
              </p>
            </div>
          </div>

          {routes.length === 0 ? (
            <div className="px-5 py-10 text-sm text-slate-500">
              No hay rutas activas para asociar gastos.
            </div>
          ) : (
            <form action={createExpense} className="space-y-6 p-5">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Concepto">
                  <input
                    name="concept"
                    required
                    placeholder="Transporte, papeleria, comision..."
                    className="field-input"
                  />
                </Field>
                <Field label="Categoria">
                  <select name="category" className="field-input" defaultValue="Otros">
                    <option value="Otros">Otros</option>
                    <option value="Transporte">Transporte</option>
                    <option value="Nomina">Nomina</option>
                    <option value="Oficina">Oficina</option>
                    <option value="Comisiones">Comisiones</option>
                    <option value="Tecnologia">Tecnologia</option>
                  </select>
                </Field>
                <Field label="Ruta">
                  <select name="routeId" required className="field-input">
                    {routes.map((route) => (
                      <option key={route.id} value={route.id}>
                        {route.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Fecha">
                  <input
                    name="date"
                    type="date"
                    defaultValue={today}
                    required
                    className="field-input"
                  />
                </Field>
                <Field label="Monto">
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
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-200 pt-5">
                <Link
                  href="/gastos"
                  className="inline-flex h-10 items-center rounded-md border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </Link>
                <button className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-medium text-white hover:bg-slate-800">
                  <Save size={17} />
                  Guardar gasto
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

async function createExpense(formData: FormData) {
  "use server";

  const actor = await currentUser();

  const parsedResult = expenseSchema.safeParse({
    routeId: formData.get("routeId"),
    concept: formData.get("concept"),
    category: formData.get("category"),
    amount: formData.get("amount"),
    date: formData.get("date"),
  });
  if (!parsedResult.success) {
    redirect("/gastos/nuevo?error=invalid");
  }
  const parsed = parsedResult.data;

  const route = await prisma.route.findFirst({
    where: { id: parsed.routeId, companyId: actor.companyId, active: true },
  });

  if (route == null) {
    redirect("/gastos/nuevo?error=route");
  }

  await prisma.$transaction(async (tx) => {
    const expense = await tx.expense.create({
      data: {
        companyId: actor.companyId,
        routeId: route.id,
        concept: parsed.concept,
        category: parsed.category,
        amount: parsed.amount,
        date: new Date(`${parsed.date}T12:00:00.000Z`),
        createdById: actor.id,
      },
    });

    await tx.cashMovement.create({
      data: {
        companyId: actor.companyId,
        routeId: route.id,
        type: "OUTCOME",
        amount: parsed.amount,
        concept: `Gasto ${parsed.concept}`,
        sourceType: "EXPENSE",
        sourceId: expense.id,
        createdById: actor.id,
        createdAt: expense.date,
      },
    });

    await tx.auditLog.create({
      data: {
        companyId: actor.companyId,
        userId: actor.id,
        action: "CREATE",
        entityType: "Expense",
        entityId: expense.id,
        afterJson: JSON.stringify({
          concept: expense.concept,
          category: expense.category,
          amount: expense.amount,
          routeId: expense.routeId,
        }),
      },
    });
  });

  revalidatePath("/");
  revalidatePath("/gastos");
  revalidatePath("/caja");
  revalidatePath("/resumen");
  redirect("/gastos");
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
      {message}
    </div>
  );
}

function expenseErrorLabel(error: string) {
  const labels: Record<string, string> = {
    invalid: "Revisa ruta, concepto, categoria, monto y fecha.",
    route: "La ruta seleccionada no esta activa o no pertenece a esta empresa.",
  };

  return labels[error] ?? "No se pudo guardar el gasto.";
}
