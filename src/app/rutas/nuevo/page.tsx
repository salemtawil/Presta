import { revalidatePath } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { ArrowLeft, MapPinned, Save } from "lucide-react";
import { z } from "zod";

import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const routeSchema = z.object({
  name: z.string().trim().min(2),
  description: z.string().trim().optional(),
});

export default function NewRoutePage() {
  return (
    <main className="min-h-screen bg-[#f7f8fb] text-slate-950">
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">Rutas</p>
            <h1 className="mt-1 text-2xl font-semibold">Nueva ruta</h1>
          </div>
          <Link
            href="/rutas"
            className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft size={17} />
            Volver
          </Link>
        </div>

        <section className="rounded-lg border border-slate-200 bg-white">
          <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
            <div className="flex size-10 items-center justify-center rounded-md bg-slate-950 text-white">
              <MapPinned size={19} />
            </div>
            <div>
              <h2 className="text-base font-semibold">Datos de ruta</h2>
              <p className="text-sm text-slate-500">Crea una zona de cobro y la asigna al admin base.</p>
            </div>
          </div>

          <form action={createRoute} className="space-y-6 p-5">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Nombre">
                <input name="name" required placeholder="RUTA NORTE" className="field-input" />
              </Field>
              <Field label="Descripcion">
                <input
                  name="description"
                  placeholder="Zona, barrio o grupo de cobro"
                  className="field-input"
                />
              </Field>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200 pt-5">
              <Link
                href="/rutas"
                className="inline-flex h-10 items-center rounded-md border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </Link>
              <button className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-medium text-white hover:bg-slate-800">
                <Save size={17} />
                Guardar ruta
              </button>
            </div>
          </form>
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

async function createRoute(formData: FormData) {
  "use server";

  const actor = await requireRole(["ADMIN", "MANAGER"]);

  const parsed = routeSchema.parse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  });
  let routeId = "";

  await prisma.$transaction(async (tx) => {
    const route = await tx.route.create({
      data: {
        companyId: actor.companyId,
        name: parsed.name,
        description: parsed.description || null,
      },
    });
    routeId = route.id;

    await tx.routeMember.create({
      data: {
        routeId: route.id,
        userId: actor.id,
        permissions: JSON.stringify(["route:admin", "clients:assign"]),
      },
    });

    await tx.auditLog.create({
      data: {
        companyId: actor.companyId,
        userId: actor.id,
        action: "CREATE",
        entityType: "Route",
        entityId: route.id,
        afterJson: JSON.stringify({ name: route.name, description: route.description }),
      },
    });
  });

  revalidatePath("/rutas");
  revalidatePath("/auditoria");
  redirect(`/rutas/${routeId}`);
}
