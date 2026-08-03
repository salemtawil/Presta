import { revalidatePath } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { ArrowLeft, Save, UserPlus } from "lucide-react";
import { z } from "zod";

import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isUniqueConstraintError } from "@/lib/prisma-errors";

export const dynamic = "force-dynamic";

const clientSchema = z.object({
  documentType: z.string().trim().min(1).default("CC"),
  documentNumber: z.string().trim().min(3),
  fullName: z.string().trim().min(2),
  phone: z.string().trim().optional(),
  whatsapp: z.string().trim().optional(),
  homeAddress: z.string().trim().optional(),
  workAddress: z.string().trim().optional(),
  groupName: z.string().trim().optional(),
  routeId: z.string().trim().min(1),
  creditLimit: z.coerce.number().int().nonnegative().optional(),
  notes: z.string().trim().optional(),
});

type NewClientPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function NewClientPage({ searchParams }: NewClientPageProps) {
  const params = (await searchParams) ?? {};
  const error = typeof params.error === "string" ? params.error : "";
  const actor = await currentUser();
  const routes = await prisma.route.findMany({
    where: { companyId: actor.companyId, active: true },
    orderBy: { name: "asc" },
  });

  return (
    <main className="min-h-screen bg-[#D5F0D1] text-slate-950">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">Clientes</p>
            <h1 className="mt-1 text-2xl font-semibold">Nuevo cliente</h1>
          </div>
          <Link
            href="/clientes"
            className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft size={17} />
            Volver
          </Link>
        </div>

        {error.length > 0 ? <ErrorBanner message={clientErrorLabel(error)} /> : null}

        <section className="rounded-lg border border-slate-200 bg-white">
          <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
            <div className="flex size-10 items-center justify-center rounded-md bg-slate-950 text-white">
              <UserPlus size={19} />
            </div>
            <div>
              <h2 className="text-base font-semibold">Datos del cliente</h2>
              <p className="text-sm text-slate-500">
                Registro base para cartera, rutas y prestamos.
              </p>
            </div>
          </div>

          {routes.length === 0 ? (
            <div className="px-5 py-10 text-sm text-slate-500">
              No hay rutas activas para asignar clientes.
            </div>
          ) : (
            <form action={createClient} className="space-y-6 p-5">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Nombre completo">
                  <input
                    name="fullName"
                    required
                    placeholder="Nombre y apellido"
                    className="field-input"
                  />
                </Field>

                <div className="grid grid-cols-[110px_1fr] gap-3">
                  <Field label="Tipo">
                    <select name="documentType" className="field-input" defaultValue="CC">
                      <option value="CC">CC</option>
                      <option value="CE">CE</option>
                      <option value="NIT">NIT</option>
                      <option value="PAS">PAS</option>
                    </select>
                  </Field>
                  <Field label="Documento">
                    <input
                      name="documentNumber"
                      required
                      placeholder="Numero"
                      className="field-input"
                    />
                  </Field>
                </div>

                <Field label="Telefono">
                  <input name="phone" placeholder="Telefono principal" className="field-input" />
                </Field>
                <Field label="WhatsApp">
                  <input name="whatsapp" placeholder="Numero WhatsApp" className="field-input" />
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
                <Field label="Grupo">
                  <input name="groupName" placeholder="Principal" className="field-input" />
                </Field>
                <Field label="Direccion casa">
                  <input
                    name="homeAddress"
                    placeholder="Direccion residencial"
                    className="field-input"
                  />
                </Field>
                <Field label="Direccion trabajo">
                  <input
                    name="workAddress"
                    placeholder="Direccion laboral"
                    className="field-input"
                  />
                </Field>
                <Field label="Cupo">
                  <input
                    name="creditLimit"
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="0"
                    className="field-input"
                  />
                </Field>
                <Field label="Notas">
                  <input name="notes" placeholder="Referencia o comentario" className="field-input" />
                </Field>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-200 pt-5">
                <Link
                  href="/clientes"
                  className="inline-flex h-10 items-center rounded-md border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </Link>
                <button className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-medium text-white hover:bg-slate-800">
                  <Save size={17} />
                  Guardar cliente
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

async function createClient(formData: FormData) {
  "use server";

  const actor = await currentUser();

  const parsedResult = clientSchema.safeParse({
    documentType: formData.get("documentType"),
    documentNumber: formData.get("documentNumber"),
    fullName: formData.get("fullName"),
    phone: formData.get("phone") || undefined,
    whatsapp: formData.get("whatsapp") || undefined,
    homeAddress: formData.get("homeAddress") || undefined,
    workAddress: formData.get("workAddress") || undefined,
    groupName: formData.get("groupName") || undefined,
    routeId: formData.get("routeId"),
    creditLimit: formData.get("creditLimit") || undefined,
    notes: formData.get("notes") || undefined,
  });
  if (!parsedResult.success) {
    redirect("/clientes/nuevo?error=invalid");
  }
  const parsed = parsedResult.data;

  const route = await prisma.route.findFirst({
    where: { id: parsed.routeId, companyId: actor.companyId, active: true },
  });

  if (route == null) {
    throw new Error("Ruta no encontrada para esta empresa.");
  }

  try {
    await prisma.$transaction(async (tx) => {
      const createdClient = await tx.client.create({
        data: {
          companyId: actor.companyId,
          routeId: route.id,
          documentType: parsed.documentType,
          documentNumber: parsed.documentNumber,
          fullName: parsed.fullName,
          phone: parsed.phone || null,
          whatsapp: parsed.whatsapp || null,
          homeAddress: parsed.homeAddress || null,
          workAddress: parsed.workAddress || null,
          groupName: parsed.groupName || "Principal",
          creditLimit: parsed.creditLimit ?? null,
          notes: parsed.notes || null,
        },
      });

      await tx.auditLog.create({
        data: {
          companyId: actor.companyId,
          userId: actor.id,
          action: "CREATE",
          entityType: "Client",
          entityId: createdClient.id,
          afterJson: JSON.stringify({
            documentNumber: createdClient.documentNumber,
            fullName: createdClient.fullName,
            routeId: createdClient.routeId,
          }),
        },
      });
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      redirect("/clientes/nuevo?error=duplicate");
    }

    throw error;
  }

  revalidatePath("/");
  revalidatePath("/clientes");
  redirect("/clientes");
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
      {message}
    </div>
  );
}

function clientErrorLabel(error: string) {
  const labels: Record<string, string> = {
    duplicate: "Ya existe un cliente con ese documento en esta empresa.",
    invalid: "Revisa los campos obligatorios del cliente.",
  };

  return labels[error] ?? "No se pudo guardar el cliente.";
}
