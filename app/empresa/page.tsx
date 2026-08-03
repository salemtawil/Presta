import { revalidatePath } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Building2, CalendarDays, Save, Settings, ShieldCheck } from "lucide-react";
import { z } from "zod";

import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatLongDate } from "@/lib/format";

export const dynamic = "force-dynamic";

const companySchema = z.object({
  name: z.string().trim().min(2),
  phone: z.string().trim().optional(),
  address: z.string().trim().optional(),
  currencySymbol: z.string().trim().min(1).max(4),
  receiptFooter: z.string().trim().optional(),
  plan: z.string().trim().min(1),
  licenseExpiresAt: z.string().trim().optional(),
});

export default async function CompanyPage() {
  const user = await requireRole(["ADMIN"]);
  const company = user.company;

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
                  label === "Empresa"
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
              <p className="text-xs text-slate-500">Producto listo para uso</p>
              <h1 className="text-lg font-semibold">Empresa</h1>
            </div>
            <a
              href="/logout"
              className="inline-flex h-10 items-center rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cerrar sesion
            </a>
          </header>

          <div className="space-y-6 px-8 py-7">
            <section className="grid grid-cols-3 gap-4">
              <MetricCard
                label="Empresa"
                value={company.name}
                note={company.phone ?? "Sin telefono"}
                icon={<Building2 size={21} />}
              />
              <MetricCard
                label="Plan"
                value={company.plan}
                note="Licencia configurada"
                icon={<ShieldCheck size={21} />}
              />
              <MetricCard
                label="Vence"
                value={
                  company.licenseExpiresAt == null
                    ? "Sin fecha"
                    : formatLongDate(company.licenseExpiresAt)
                }
                note="Control operativo"
                icon={<CalendarDays size={21} />}
              />
            </section>

            <section className="rounded-lg border border-slate-200 bg-white">
              <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
                <div className="flex size-10 items-center justify-center rounded-md bg-slate-950 text-white">
                  <Settings size={19} />
                </div>
                <div>
                  <h2 className="text-base font-semibold">Configuracion general</h2>
                  <p className="text-sm text-slate-500">
                    Estos datos alimentan recibos, contratos y cabecera operativa.
                  </p>
                </div>
              </div>

              <form action={updateCompany} className="space-y-6 p-5">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Nombre">
                    <input name="name" required defaultValue={company.name} className="field-input" />
                  </Field>
                  <Field label="Telefono">
                    <input name="phone" defaultValue={company.phone ?? ""} className="field-input" />
                  </Field>
                  <Field label="Direccion">
                    <input
                      name="address"
                      defaultValue={company.address ?? ""}
                      className="field-input"
                    />
                  </Field>
                  <Field label="Moneda">
                    <input
                      name="currencySymbol"
                      required
                      defaultValue={company.currencySymbol}
                      className="field-input"
                    />
                  </Field>
                  <Field label="Plan">
                    <select name="plan" defaultValue={company.plan} className="field-input">
                      <option value="BASICO">BASICO</option>
                      <option value="ORO">ORO</option>
                      <option value="PLATINO">PLATINO</option>
                    </select>
                  </Field>
                  <Field label="Vence licencia">
                    <input
                      name="licenseExpiresAt"
                      type="date"
                      defaultValue={company.licenseExpiresAt?.toISOString().slice(0, 10) ?? ""}
                      className="field-input"
                    />
                  </Field>
                  <div className="col-span-2">
                    <Field label="Pie de recibo">
                      <input
                        name="receiptFooter"
                        defaultValue={company.receiptFooter ?? ""}
                        className="field-input"
                      />
                    </Field>
                  </div>
                </div>

                <div className="flex justify-end gap-2 border-t border-slate-200 pt-5">
                  <button className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-medium text-white hover:bg-slate-800">
                    <Save size={17} />
                    Guardar cambios
                  </button>
                </div>
              </form>
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
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 truncate text-xl font-semibold">{value}</p>
        </div>
        <div className="text-slate-500">{icon}</div>
      </div>
      <p className="mt-3 text-xs text-slate-500">{note}</p>
    </article>
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

async function updateCompany(formData: FormData) {
  "use server";

  const user = await requireRole(["ADMIN"]);
  const parsed = companySchema.parse({
    name: formData.get("name"),
    phone: formData.get("phone") || undefined,
    address: formData.get("address") || undefined,
    currencySymbol: formData.get("currencySymbol"),
    receiptFooter: formData.get("receiptFooter") || undefined,
    plan: formData.get("plan"),
    licenseExpiresAt: formData.get("licenseExpiresAt") || undefined,
  });
  const before = user.company;
  const updated = await prisma.company.update({
    where: { id: user.companyId },
    data: {
      name: parsed.name,
      phone: parsed.phone || null,
      address: parsed.address || null,
      currencySymbol: parsed.currencySymbol,
      receiptFooter: parsed.receiptFooter || null,
      plan: parsed.plan,
      licenseExpiresAt:
        parsed.licenseExpiresAt == null
          ? null
          : new Date(`${parsed.licenseExpiresAt}T12:00:00.000Z`),
    },
  });

  await prisma.auditLog.create({
    data: {
      companyId: user.companyId,
      userId: user.id,
      action: "UPDATE",
      entityType: "Company",
      entityId: user.companyId,
      beforeJson: JSON.stringify({
        name: before.name,
        phone: before.phone,
        address: before.address,
        plan: before.plan,
      }),
      afterJson: JSON.stringify({
        name: updated.name,
        phone: updated.phone,
        address: updated.address,
        plan: updated.plan,
      }),
    },
  });

  revalidatePath("/");
  revalidatePath("/empresa");
  revalidatePath("/auditoria");
  redirect("/empresa");
}
