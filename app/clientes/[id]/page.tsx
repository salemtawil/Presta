import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  BanknoteArrowDown,
  BadgeDollarSign,
  FilePlus,
  Phone,
  WalletCards,
} from "lucide-react";

import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { formatMoney, formatShortDate } from "@/lib/format";
import { loanBalance } from "@/lib/payments";

export const dynamic = "force-dynamic";

type ClientDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  const { id } = await params;
  const data = await getClientDetail(id);

  if (data == null) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#D5F0D1] text-slate-950">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <Link
              href="/clientes"
              className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950"
            >
              <ArrowLeft size={16} />
              Volver a clientes
            </Link>
            <h1 className="text-2xl font-semibold">{data.fullName}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {data.documentType} {data.documentNumber} - {data.routeName}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/abonos/nuevo?clientId=${data.id}`}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <BanknoteArrowDown size={17} />
              Nuevo abono
            </Link>
            <Link
              href={`/prestamos/nuevo?clientId=${data.id}`}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-[#50A96B] px-4 text-sm font-medium text-white hover:bg-[#32603d]"
            >
              <FilePlus size={17} />
              Nuevo prestamo
            </Link>
          </div>
        </div>

        <section className="mb-6 grid grid-cols-4 gap-4">
          <MetricCard
            label="Saldo total"
            value={formatMoney(data.balance)}
            note="Cartera pendiente"
            icon={<BadgeDollarSign size={21} />}
          />
          <MetricCard
            label="Prestamos activos"
            value={String(data.activeLoans)}
            note={`${data.loans.length} prestamos historicos`}
            icon={<WalletCards size={21} />}
          />
          <MetricCard
            label="Total abonado"
            value={formatMoney(data.totalPaid)}
            note={`${data.payments.length} pagos registrados`}
            icon={<BanknoteArrowDown size={21} />}
          />
          <MetricCard
            label="Contacto"
            value={data.phone ?? "Sin telefono"}
            note={`WhatsApp ${data.whatsapp ?? "sin dato"}`}
            icon={<Phone size={21} />}
          />
        </section>

        <section className="mb-6 grid grid-cols-[0.8fr_1.2fr] gap-5">
          <article className="rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-base font-semibold">Ficha del cliente</h2>
              <p className="text-sm text-slate-500">Datos operativos de contacto y ruta</p>
            </div>
            <div className="grid grid-cols-2 gap-4 p-5 text-sm">
              <Info label="Grupo" value={data.groupName} />
              <Info label="Estado" value={data.statusLabel} />
              <Info label="Direccion casa" value={data.homeAddress ?? "Sin dato"} />
              <Info label="Direccion trabajo" value={data.workAddress ?? "Sin dato"} />
              <Info label="Cupo" value={data.creditLimit == null ? "Sin cupo" : formatMoney(data.creditLimit)} />
              <Info label="Notas" value={data.notes ?? "Sin notas"} />
            </div>
          </article>

          <article className="rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-base font-semibold">Prestamos del cliente</h2>
              <p className="text-sm text-slate-500">Saldo, estado y avance por operacion</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Codigo</th>
                    <th className="px-5 py-3 font-semibold">Estado</th>
                    <th className="px-5 py-3 text-right font-semibold">Total</th>
                    <th className="px-5 py-3 text-right font-semibold">Saldo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.loans.map((loan) => (
                    <tr key={loan.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-4">
                        <Link
                          href={`/prestamos/${loan.id}`}
                          className="font-semibold text-slate-950 hover:underline"
                        >
                          {loan.code}
                        </Link>
                        <p className="text-xs text-slate-500">
                          {loan.installmentCount} cuotas - {formatShortDate(loan.startDate)}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <StatusPill status={loan.status} />
                      </td>
                      <td className="px-5 py-4 text-right">{formatMoney(loan.totalAmount)}</td>
                      <td className="px-5 py-4 text-right font-semibold">
                        {formatMoney(loan.balance)}
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
            <h2 className="text-base font-semibold">Historial de abonos</h2>
            <p className="text-sm text-slate-500">Pagos asociados al cliente</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Fecha</th>
                  <th className="px-5 py-3 font-semibold">Prestamo</th>
                  <th className="px-5 py-3 font-semibold">Metodo</th>
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
                    <td className="px-5 py-4">
                      <Link
                        href={`/prestamos/${payment.loanId}`}
                        className="font-semibold hover:underline"
                      >
                        {payment.loanCode}
                      </Link>
                      <p className="text-xs text-slate-500">{payment.note ?? "Sin nota"}</p>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{payment.paymentMethod}</td>
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
              Este cliente aun no tiene abonos registrados.
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

function StatusPill({ status }: { status: string }) {
  const active = status === "ACTIVE";
  return (
    <span
      className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
        active ? "bg-sky-50 text-sky-700" : "bg-slate-100 text-slate-600"
      }`}
    >
      {active ? "Activo" : "Completado"}
    </span>
  );
}

async function getClientDetail(id: string) {
  const actor = await currentUser();
  const client = await prisma.client.findFirst({
    where: { id, companyId: actor.companyId },
    include: {
      route: true,
      loans: {
        include: {
          payments: true,
          installments: true,
        },
        orderBy: { createdAt: "desc" },
      },
      payments: {
        include: { loan: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (client == null) {
    return null;
  }

  const loans = client.loans.map((loan) => ({
    id: loan.id,
    code: loan.code,
    status: loan.status,
    totalAmount: loan.totalAmount,
    installmentCount: loan.installmentCount,
    startDate: loan.startDate,
    balance:
      loan.status === "VOIDED"
        ? 0
        : loanBalance(
            loan.totalAmount,
            loan.payments
              .filter((payment) => payment.voidedAt == null)
              .map((payment) => payment.amount),
          ),
  }));
  const activePayments = client.payments.filter((payment) => payment.voidedAt == null);
  const balance = loans.reduce((total, loan) => total + loan.balance, 0);

  return {
    id: client.id,
    fullName: client.fullName,
    documentType: client.documentType,
    documentNumber: client.documentNumber,
    phone: client.phone,
    whatsapp: client.whatsapp,
    homeAddress: client.homeAddress,
    workAddress: client.workAddress,
    groupName: client.groupName,
    creditLimit: client.creditLimit,
    notes: client.notes,
    routeName: client.route.name,
    statusLabel: client.status === "ACTIVE" ? "Activo" : client.status,
    balance,
    activeLoans: loans.filter((loan) => loan.status === "ACTIVE").length,
    totalPaid: activePayments.reduce((total, payment) => total + payment.amount, 0),
    loans,
    payments: activePayments.map((payment) => ({
      id: payment.id,
      loanId: payment.loanId,
      loanCode: payment.loan.code,
      createdAt: payment.createdAt,
      paymentMethod: payment.paymentMethod,
      amount: payment.amount,
      principalPaid: payment.principalPaid,
      interestPaid: payment.interestPaid,
      note: payment.note,
    })),
  };
}
