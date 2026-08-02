import { PrismaClient } from "@prisma/client";

import { calculateLoanSchedule } from "../lib/finance";
import { hashPassword, verifyPassword } from "../lib/password";

const prisma = new PrismaClient();
const seedEmail = process.env.PRESTA_SEED_EMAIL ?? "admin@presta.local";
const seedPassword = process.env.PRESTA_SEED_PASSWORD ?? process.env.PRESTA_DEMO_PASSWORD ?? "demo-only";
const seedCompanyName = process.env.PRESTA_SEED_COMPANY ?? "Presta Demo";
const shouldSeedDemoData = process.env.PRESTA_SEED_DEMO_DATA !== "false";

async function main() {
  const company = await prisma.company.upsert({
    where: { id: "demo-company" },
    update: {},
    create: {
      id: "demo-company",
      name: seedCompanyName,
      phone: "300-000-0000",
      address: "Colombia",
      currencySymbol: "$",
      receiptFooter: "Gracias por su pago",
      plan: "ORO",
      licenseExpiresAt: new Date("2026-08-07T20:00:00.000Z"),
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: seedEmail },
    update: {
      passwordHash: hashPassword(seedPassword),
      status: "ACTIVE",
    },
    create: {
      companyId: company.id,
      name: "PRUEBA CODEX",
      email: seedEmail,
      passwordHash: hashPassword(seedPassword),
      role: "ADMIN",
    },
  });

  if (!verifyPassword(seedPassword, admin.passwordHash)) {
    throw new Error("No se pudo preparar el password inicial.");
  }

  if (!shouldSeedDemoData) {
    return;
  }

  const route = await prisma.route.upsert({
    where: { id: "demo-route" },
    update: {},
    create: {
      id: "demo-route",
      companyId: company.id,
      name: "RUTA DEMO",
      description: "Ruta de prueba para web",
    },
  });

  const client = await prisma.client.upsert({
    where: {
      companyId_documentNumber: {
        companyId: company.id,
        documentNumber: "100000001",
      },
    },
    update: {},
    create: {
      companyId: company.id,
      routeId: route.id,
      documentNumber: "100000001",
      fullName: "CLIENTE DEMO",
      phone: "301-000-0000",
      whatsapp: "301-000-0000",
      homeAddress: "Direccion Demo",
      groupName: "Principal",
    },
  });

  const existingLoan = await prisma.loan.findUnique({ where: { code: "DEMO-0001" } });

  if (existingLoan == null) {
    const schedule = calculateLoanSchedule({
      principal: 100000,
      interestRate: 0,
      installmentCount: 1,
      startDate: new Date("2026-07-31T12:00:00.000Z"),
      modality: "DAILY",
    });

    const loan = await prisma.loan.create({
      data: {
        companyId: company.id,
        routeId: route.id,
        clientId: client.id,
        createdById: admin.id,
        code: "DEMO-0001",
        principal: schedule.principal,
        interestRate: 0,
        interestAmount: schedule.interestAmount,
        totalAmount: schedule.totalAmount,
        installmentAmount: schedule.installmentAmount,
        installmentCount: schedule.installments.length,
        modality: "DAILY",
        paymentScheme: "INSTALLMENTS",
        startDate: schedule.startDate,
        endDate: schedule.endDate,
        status: "COMPLETED",
        installments: {
          create: schedule.installments.map((installment) => ({
            number: installment.number,
            dueDate: installment.dueDate,
            principalAmount: installment.principalAmount,
            interestAmount: installment.interestAmount,
            totalAmount: installment.totalAmount,
            paidAmount: installment.totalAmount,
            balance: 0,
            status: "PAID",
          })),
        },
      },
    });

    await prisma.payment.create({
      data: {
        companyId: company.id,
        routeId: route.id,
        clientId: client.id,
        loanId: loan.id,
        amount: schedule.totalAmount,
        principalPaid: schedule.principal,
        interestPaid: schedule.interestAmount,
        paymentType: "AUTOMATIC",
        paymentMethod: "CASH",
        note: "Abono demo sincronizado desde inspeccion movil/web",
        createdById: admin.id,
        createdAt: new Date("2026-07-31T21:58:00.000Z"),
      },
    });

    await prisma.cashMovement.create({
      data: {
        companyId: company.id,
        routeId: route.id,
        type: "INCOME",
        amount: schedule.totalAmount,
        concept: "Abono CLIENTE DEMO",
        sourceType: "PAYMENT",
        sourceId: loan.id,
        createdById: admin.id,
        createdAt: new Date("2026-07-31T21:58:00.000Z"),
      },
    });
  }

  const existingExpense = await prisma.expense.findFirst({
    where: { companyId: company.id, concept: "Gastos historicos web admin" },
  });

  if (existingExpense == null) {
    await prisma.expense.create({
      data: {
        companyId: company.id,
        routeId: route.id,
        concept: "Gastos historicos web admin",
        category: "Otros",
        amount: 764845,
        date: new Date("2026-07-31T12:00:00.000Z"),
        createdById: admin.id,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
