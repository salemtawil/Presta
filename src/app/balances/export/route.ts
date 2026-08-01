import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const actor = await currentUser();
  const [loans, payments, expenses, movements, routes] = await Promise.all([
    prisma.loan.findMany({ where: { companyId: actor.companyId, status: { not: "VOIDED" } }, include: { client: true, route: true } }),
    prisma.payment.findMany({ where: { companyId: actor.companyId }, include: { client: true, loan: true, createdBy: true } }),
    prisma.expense.findMany({ where: { companyId: actor.companyId }, include: { route: true, createdBy: true } }),
    prisma.cashMovement.findMany({ where: { companyId: actor.companyId }, include: { route: true, createdBy: true } }),
    prisma.route.findMany({ where: { companyId: actor.companyId } }),
  ]);
  const routeNames = new Map(routes.map((route) => [route.id, route.name]));

  const rows = [
    ["tipo", "fecha", "ruta", "usuario", "cliente", "codigo", "concepto", "monto", "estado"],
    ...loans.map((loan) => [
      "PRESTAMO",
      loan.createdAt.toISOString(),
      loan.route.name,
      "",
      loan.client.fullName,
      loan.code,
      "Capital desembolsado",
      String(loan.principal),
      loan.status,
    ]),
    ...payments.map((payment) => [
      "ABONO",
      payment.createdAt.toISOString(),
      routeNames.get(payment.routeId) ?? payment.routeId,
      payment.createdBy.name,
      payment.client.fullName,
      payment.loan.code,
      payment.note ?? "",
      String(payment.amount),
      payment.voidedAt == null ? "ACTIVE" : "VOIDED",
    ]),
    ...expenses.map((expense) => [
      "GASTO",
      expense.date.toISOString(),
      expense.route.name,
      expense.createdBy.name,
      "",
      "",
      expense.concept,
      String(expense.amount),
      expense.voidedAt == null ? "ACTIVE" : "VOIDED",
    ]),
    ...movements.map((movement) => [
      "CAJA",
      movement.createdAt.toISOString(),
      movement.route.name,
      movement.createdBy.name,
      "",
      movement.sourceId ?? "",
      movement.concept,
      String(movement.amount),
      movement.type,
    ]),
  ];

  const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\n");

  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="prestabit-balances.csv"',
    },
  });
}

function escapeCsv(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }

  return value;
}
