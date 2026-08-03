import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatLongDate, formatMoney, formatShortDate } from "@/lib/format";
import { PrintButton } from "@/app/components/print-button";

export const dynamic = "force-dynamic";

type ReceiptPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ReceiptPage({ params }: ReceiptPageProps) {
  const { id } = await params;
  const actor = await currentUser();
  const payment = await prisma.payment.findFirst({
    where: { id, companyId: actor.companyId },
    include: {
      company: true,
      client: true,
      loan: { include: { route: true } },
      createdBy: true,
    },
  });

  if (payment == null) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background px-6 py-8 text-slate-950">
      <div className="mx-auto mb-4 flex max-w-3xl justify-between print:hidden">
        <Link
          href="/abonos"
          className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft size={17} />
          Volver
        </Link>
        <PrintButton label="Recibo" />
      </div>

      <article className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white p-8 shadow-sm print:border-0 print:shadow-none">
        <header className="flex items-start justify-between border-b border-slate-200 pb-6">
          <div>
            <p className="text-sm font-semibold uppercase text-slate-500">Recibo de abono</p>
            <h1 className="mt-2 text-2xl font-semibold">{payment.company.name}</h1>
            <p className="mt-1 text-sm text-slate-500">{payment.company.address ?? "Sin direccion"}</p>
          </div>
          <div className="text-right text-sm">
            <p className="font-semibold">{formatShortDate(payment.createdAt)}</p>
            <p className="mt-1 text-slate-500">No. {payment.id.slice(-8).toUpperCase()}</p>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-6 border-b border-slate-200 py-6 text-sm">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Cliente</p>
            <p className="mt-2 text-lg font-semibold">{payment.client.fullName}</p>
            <p className="text-slate-500">
              {payment.client.documentType} {payment.client.documentNumber}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Prestamo</p>
            <p className="mt-2 text-lg font-semibold">{payment.loan.code}</p>
            <p className="text-slate-500">{payment.loan.route.name}</p>
          </div>
        </section>

        <section className="grid grid-cols-3 gap-4 border-b border-slate-200 py-6">
          <Amount label="Capital" value={payment.principalPaid} />
          <Amount label="Interes" value={payment.interestPaid} />
          <Amount label="Total recibido" value={payment.amount} strong />
        </section>

        <section className="space-y-3 py-6 text-sm">
          <Info label="Metodo" value={methodLabel(payment.paymentMethod)} />
          <Info label="Tipo" value={payment.paymentType} />
          <Info label="Estado" value={payment.voidedAt == null ? "Activo" : "Anulado"} />
          <Info label="Registrado por" value={payment.createdBy.name} />
          <Info label="Nota" value={payment.note ?? "Sin nota"} />
          {payment.voidedAt == null ? null : (
            <Info
              label="Anulacion"
              value={`${formatLongDate(payment.voidedAt)} - ${payment.voidReason ?? "Sin motivo"}`}
            />
          )}
        </section>

        <footer className="border-t border-slate-200 pt-6 text-center text-sm text-slate-500">
          {payment.company.receiptFooter ?? "Gracias por su pago"}
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

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="font-medium text-slate-500">{label}</span>
      <span className="text-right font-semibold text-slate-800">{value}</span>
    </div>
  );
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
