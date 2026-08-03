import {
  BanknoteArrowDown,
  BanknoteArrowUp,
  Boxes,
  CalendarDays,
  ClipboardList,
  CreditCard,
  FileText,
  Gauge,
  LayoutDashboard,
  MapPinned,
  ReceiptText,
  Route,
  ScrollText,
  Settings,
  ShieldCheck,
  UserRound,
  Users,
  WalletCards,
} from "lucide-react";
import Link from "next/link";

import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  daysUntil,
  formatLongDate,
  formatMoney,
  formatShortDate,
} from "@/lib/format";

export const dynamic = "force-dynamic";

const navItems = [
  { label: "Inicio", icon: LayoutDashboard, href: "/", active: true },
  { label: "Clientes", icon: Users, href: "/clientes" },
  { label: "Prestamos", icon: ReceiptText, href: "/prestamos" },
  { label: "Abonos", icon: BanknoteArrowDown, href: "/abonos" },
  { label: "Caja", icon: WalletCards, href: "/caja" },
  { label: "Gastos", icon: CreditCard, href: "/gastos" },
  { label: "Resumen", icon: ClipboardList, href: "/resumen" },
  { label: "Balances", icon: Gauge, href: "/balances" },
  { label: "Rutas", icon: Route, href: "/rutas" },
  { label: "Usuarios", icon: ShieldCheck, href: "/usuarios" },
  { label: "Auditoria", icon: ScrollText, href: "/auditoria" },
  { label: "Empresa", icon: Settings, href: "/empresa" },
  { label: "Cuenta", icon: UserRound, href: "/cuenta" },
];

export default async function Home() {
  const data = await getDashboardData();
  const metrics = [
    {
      label: "Cobrado hoy",
      value: formatMoney(data.collectedToday),
      note: `${data.paymentsCount} abono registrado`,
      icon: BanknoteArrowDown,
      tone: "text-emerald-700 bg-emerald-50 border-emerald-100",
    },
    {
      label: "Prestado hoy",
      value: formatMoney(data.loanedToday),
      note: `${data.loansCount} prestamo creado`,
      icon: BanknoteArrowUp,
      tone: "text-sky-700 bg-sky-50 border-sky-100",
    },
    {
      label: "Gastos del mes",
      value: formatMoney(data.expensesTotal),
      note: "Datos demo en Supabase",
      icon: CreditCard,
      tone: "text-rose-700 bg-rose-50 border-rose-100",
    },
    {
      label: "Ganancia",
      value: formatMoney(data.estimatedProfit),
      note: "Ajuste observado en PrestaBIT",
      icon: Boxes,
      tone: "text-amber-700 bg-amber-50 border-amber-100",
    },
  ];

  return (
    <main className="min-h-screen bg-[#D5F0D1] text-slate-950">
      <div className="grid min-h-screen grid-cols-[248px_1fr]">
        <aside className="border-r border-slate-200 bg-white">
          <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-5">
            <div className="flex size-9 items-center justify-center rounded-md bg-[#50A96B] text-sm font-bold text-white">
              P
            </div>
            <div>
              <p className="text-sm font-semibold">Presta</p>
              <p className="text-xs text-slate-500">MVP web</p>
            </div>
          </div>

          <nav className="space-y-1 px-3 py-4">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium ${
                  item.active
                    ? "bg-[#50A96B] text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                <item.icon size={17} />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <section className="min-w-0">
          <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-8">
            <div className="flex items-center gap-3">
              <MapPinned size={18} className="text-slate-500" />
              <div>
                <p className="text-xs text-slate-500">Ruta activa</p>
                <p className="text-sm font-semibold">{data.routeName}</p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <CalendarDays size={17} />
                {formatLongDate(data.currentDate)}
              </div>
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">
                {data.plan} - {data.daysRemaining} dias restantes
              </div>
              <a
                href="/logout"
                className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Salir
              </a>
            </div>
          </header>

          <div className="space-y-6 px-8 py-7">
            <section className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">Bienvenido</p>
                <h1 className="mt-1 text-3xl font-semibold tracking-normal">
                  {data.userName}
                </h1>
              </div>
              <div className="flex gap-2">
                <Link
                  href="/resumen"
                  className="inline-flex h-10 items-center rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Ver balance
                </Link>
                <Link
                  href="/prestamos/nuevo"
                  className="inline-flex h-10 items-center rounded-md bg-[#50A96B] px-4 text-sm font-medium text-white hover:bg-[#32603d]"
                >
                  Nuevo prestamo
                </Link>
              </div>
            </section>

            <section className="grid grid-cols-4 gap-4">
              {metrics.map((metric) => (
                <article
                  key={metric.label}
                  className={`rounded-lg border bg-white p-4 ${metric.tone}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium opacity-80">{metric.label}</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-950">
                        {metric.value}
                      </p>
                    </div>
                    <metric.icon size={22} />
                  </div>
                  <p className="mt-3 text-xs text-slate-600">{metric.note}</p>
                </article>
              ))}
            </section>

            <section className="grid grid-cols-[1.2fr_0.8fr] gap-5">
              <article className="rounded-lg border border-slate-200 bg-white">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                  <div>
                    <h2 className="text-base font-semibold">Historial de movimientos</h2>
                    <p className="text-sm text-slate-500">
                      Movimientos sincronizados desde app movil y web admin
                    </p>
                  </div>
                  <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                    2 registros
                  </span>
                </div>
                <div className="divide-y divide-slate-100">
                  {data.movements.map((movement) => (
                    <div
                      key={`${movement.type}-${movement.date}`}
                      className="grid grid-cols-[1fr_auto] items-center gap-4 px-5 py-4"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`h-10 w-1 rounded-full ${movement.color}`} />
                        <div>
                          <p className="text-sm font-semibold">{movement.client}</p>
                          <p className="text-xs text-slate-500">
                            {movement.type} - {movement.detail}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{movement.amount}</p>
                        <p className="text-xs text-slate-500">{movement.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </article>

              <article className="rounded-lg border border-slate-200 bg-white">
                <div className="border-b border-slate-200 px-5 py-4">
                  <h2 className="text-base font-semibold">Prioridad del MVP</h2>
                  <p className="text-sm text-slate-500">
                    Flujo minimo para construir primero
                  </p>
                </div>
                <ol className="space-y-3 p-5 text-sm">
                  {[
                    "Rutas y clientes",
                    "Prestamos con cuotas",
                    "Abonos y ledger financiero",
                    "Caja, gastos y resumen",
                    "PDF simple y permisos",
                  ].map((item, index) => (
                    <li key={item} className="flex items-center gap-3">
                      <span className="flex size-7 items-center justify-center rounded-md bg-slate-100 text-xs font-semibold text-slate-700">
                        {index + 1}
                      </span>
                      <span className="font-medium text-slate-700">{item}</span>
                    </li>
                  ))}
                </ol>
              </article>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <div>
                  <h2 className="text-base font-semibold">Clientes</h2>
                  <p className="text-sm text-slate-500">
                    Tabla base para cartera, busqueda y acciones
                  </p>
                </div>
                <Link
                  href="/clientes/nuevo"
                  className="inline-flex h-9 items-center rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Nuevo cliente
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Cliente</th>
                      <th className="px-5 py-3 font-semibold">Documento</th>
                      <th className="px-5 py-3 font-semibold">Ruta</th>
                      <th className="px-5 py-3 font-semibold">Estado</th>
                      <th className="px-5 py-3 text-right font-semibold">Saldo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.clients.map((client) => (
                      <tr key={client.document}>
                        <td className="px-5 py-4 font-semibold">{client.name}</td>
                        <td className="px-5 py-4 text-slate-600">{client.document}</td>
                        <td className="px-5 py-4 text-slate-600">{client.route}</td>
                        <td className="px-5 py-4">
                          <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                            {client.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right font-semibold">
                          {client.balance}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="grid grid-cols-3 gap-4">
              {[
                ["Contratos", "Fase 2, porque la web actual esta en desarrollo"],
                ["WhatsApp Bot", "Fase 3, requiere QR y automatizaciones"],
                ["Reportados", "Fase 3, maneja datos sensibles"],
              ].map(([title, body]) => (
                <article
                  key={title}
                  className="rounded-lg border border-slate-200 bg-white p-4"
                >
                  <div className="flex items-center gap-2 text-slate-800">
                    <FileText size={18} />
                    <h3 className="text-sm font-semibold">{title}</h3>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{body}</p>
                </article>
              ))}
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

async function getDashboardData() {
  const user = await currentUser();
  const company = await prisma.company.findUnique({
    where: { id: user.companyId },
    include: {
      routes: { take: 1, orderBy: { createdAt: "asc" } },
    },
  });

  if (company == null) {
    return emptyDashboardData();
  }

  const route = company.routes[0];
  const currentDate = new Date();
  const dayStart = startOfDay(currentDate);
  const dayEnd = addDays(dayStart, 1);

  const [clients, loans, payments, expenses] = await Promise.all([
    prisma.client.findMany({
      where: { companyId: company.id },
      include: {
        route: true,
        loans: {
          include: { payments: true },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.loan.findMany({
      where: {
        companyId: company.id,
        status: { not: "VOIDED" },
        createdAt: { gte: dayStart, lt: dayEnd },
      },
      include: { client: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.payment.findMany({
      where: {
        companyId: company.id,
        voidedAt: null,
        createdAt: { gte: dayStart, lt: dayEnd },
      },
      include: { client: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.expense.findMany({
      where: { companyId: company.id },
      orderBy: { date: "desc" },
    }),
  ]);

  const collectedToday = sum(payments.map((payment) => payment.amount));
  const loanedToday = sum(loans.map((loan) => loan.principal));
  const expensesTotal = sum(expenses.map((expense) => expense.amount));
  const estimatedProfit = sum(payments.map((payment) => payment.interestPaid));

  return {
    userName: user.name,
    plan: company.plan,
    daysRemaining: daysUntil(company.licenseExpiresAt, currentDate),
    routeName: route?.name ?? "Sin ruta",
    currentDate,
    collectedToday,
    paymentsCount: payments.length,
    loanedToday,
    loansCount: loans.length,
    expensesTotal,
    estimatedProfit,
    movements: [
      ...payments.map((payment) => ({
        client: payment.client.fullName,
        type: "Abono",
        amount: formatMoney(payment.amount),
        detail: `Interes ${formatMoney(payment.interestPaid)}, capital ${formatMoney(payment.principalPaid)}`,
        date: formatShortDate(payment.createdAt),
        color: "bg-emerald-500",
      })),
      ...loans.map((loan) => ({
        client: loan.client.fullName,
        type: "Prestamo",
        amount: formatMoney(loan.principal),
        detail: `${loan.modality === "DAILY" ? "Diario" : loan.modality}, ${loan.installmentCount} cuota`,
        date: formatShortDate(loan.createdAt),
        color: "bg-sky-500",
      })),
    ],
    clients: clients.map((client) => {
      const balance = client.loans.reduce((total, loan) => {
        if (loan.status === "VOIDED") {
          return total;
        }

        const paid = sum(
          loan.payments
            .filter((payment) => payment.voidedAt == null)
            .map((payment) => payment.amount),
        );
        return total + Math.max(loan.totalAmount - paid, 0);
      }, 0);

      return {
        name: client.fullName,
        document: client.documentNumber,
        route: client.route.name,
        status: balance > 0 ? "Prestamo activo" : "Sin prestamos activos",
        balance: formatMoney(balance),
      };
    }),
  };
}

function emptyDashboardData() {
  return {
    userName: "Sin datos",
    plan: "N/A",
    daysRemaining: 0,
    routeName: "Sin ruta",
    currentDate: new Date(),
    collectedToday: 0,
    paymentsCount: 0,
    loanedToday: 0,
    loansCount: 0,
    expensesTotal: 0,
    estimatedProfit: 0,
    movements: [],
    clients: [],
  };
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}
