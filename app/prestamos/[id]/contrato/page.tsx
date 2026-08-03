import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatLongDate, formatMoney } from "@/lib/format";
import { PrintButton } from "@/app/components/print-button";

export const dynamic = "force-dynamic";

type ContractPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ContractPage({ params }: ContractPageProps) {
  const { id } = await params;
  const actor = await currentUser();
  const loan = await prisma.loan.findFirst({
    where: { id, companyId: actor.companyId },
    include: {
      company: true,
      client: true,
      route: true,
      installments: { orderBy: { number: "asc" } },
      createdBy: true,
    },
  });

  if (loan == null) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background px-6 py-8 text-slate-950">
      <div className="mx-auto mb-4 flex max-w-4xl justify-between print:hidden">
        <Link
          href={`/prestamos/${loan.id}`}
          className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft size={17} />
          Volver
        </Link>
        <PrintButton label="Contrato" />
      </div>

      <article className="mx-auto max-w-4xl rounded-lg border border-slate-200 bg-white p-8 shadow-sm print:border-0 print:shadow-none">
        <header className="border-b border-slate-200 pb-6">
          <p className="text-sm font-semibold uppercase text-slate-500">Contrato de prestamo</p>
          <h1 className="mt-2 text-2xl font-semibold">{loan.company.name}</h1>
          <p className="mt-1 text-sm text-slate-500">
            Codigo {loan.code} - {loan.route.name}
          </p>
        </header>

        <section className="grid grid-cols-2 gap-6 border-b border-slate-200 py-6 text-sm">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Prestamista</p>
            <p className="mt-2 font-semibold">{loan.company.name}</p>
            <p className="text-slate-500">{loan.company.address ?? "Sin direccion"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Cliente</p>
            <p className="mt-2 font-semibold">{loan.client.fullName}</p>
            <p className="text-slate-500">
              {loan.client.documentType} {loan.client.documentNumber}
            </p>
          </div>
        </section>

        <section className="grid grid-cols-4 gap-4 border-b border-slate-200 py-6">
          <Amount label="Capital" value={loan.principal} />
          <Amount label="Interes" value={loan.interestAmount} />
          <Amount label="Total" value={loan.totalAmount} strong />
          <Amount label="Cuota" value={loan.installmentAmount} />
        </section>

        <section className="space-y-4 border-b border-slate-200 py-6 text-sm leading-7 text-slate-700">
          <p>
            El cliente declara haber recibido el monto de {formatMoney(loan.principal)}
            y se compromete a cancelar {loan.installmentCount} cuotas bajo modalidad
            {" "}{modalityLabel(loan.modality)}, iniciando el {formatLongDate(loan.startDate)}
            y finalizando el {formatLongDate(loan.endDate)}.
          </p>
          <p>
            El total pactado es {formatMoney(loan.totalAmount)}, incluyendo una ganancia
            de {formatMoney(loan.interestAmount)}. Los pagos seran registrados por el
            sistema y soportados con recibos individuales.
          </p>
          <p>
            Estado actual del contrato: {loan.status}. Registrado por {loan.createdBy.name}.
          </p>
        </section>

        <section className="py-6">
          <h2 className="text-base font-semibold">Plan de cuotas</h2>
          <table className="mt-4 w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">No.</th>
                <th className="px-4 py-3 font-semibold">Fecha</th>
                <th className="px-4 py-3 text-right font-semibold">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loan.installments.map((installment) => (
                <tr key={installment.id}>
                  <td className="px-4 py-3 font-semibold">{installment.number}</td>
                  <td className="px-4 py-3">{formatLongDate(installment.dueDate)}</td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {formatMoney(installment.totalAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <footer className="grid grid-cols-2 gap-10 pt-10 text-center text-sm">
          <div className="border-t border-slate-300 pt-3">Firma cliente</div>
          <div className="border-t border-slate-300 pt-3">Firma empresa</div>
        </footer>
      </article>
    </main>
  );
}

function Amount({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className={`mt-2 ${strong ? "text-2xl" : "text-xl"} font-semibold`}>
        {formatMoney(value)}
      </p>
    </div>
  );
}

function modalityLabel(value: string) {
  const labels: Record<string, string> = {
    DAILY: "diaria",
    WEEKLY: "semanal",
    BIWEEKLY: "quincenal",
    MONTHLY: "mensual",
  };

  return labels[value] ?? value;
}
