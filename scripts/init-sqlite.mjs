import { existsSync, mkdirSync, unlinkSync } from "node:fs";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";

const dbPath = join(process.cwd(), "prisma", "dev.db");

mkdirSync(dirname(dbPath), { recursive: true });

if (existsSync(dbPath)) {
  unlinkSync(dbPath);
}

const db = new DatabaseSync(dbPath);

db.exec(`
PRAGMA foreign_keys = ON;

CREATE TABLE "Company" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "phone" TEXT,
  "address" TEXT,
  "currencySymbol" TEXT NOT NULL DEFAULT '$',
  "receiptFooter" TEXT,
  "plan" TEXT NOT NULL DEFAULT 'ORO',
  "licenseExpiresAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "User" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "companyId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'ADMIN',
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

CREATE TABLE "Route" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "companyId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Route_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "RouteMember" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "routeId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "permissions" TEXT NOT NULL DEFAULT '[]',
  CONSTRAINT "RouteMember_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "RouteMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "RouteMember_routeId_userId_key" ON "RouteMember"("routeId", "userId");

CREATE TABLE "Client" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "companyId" TEXT NOT NULL,
  "routeId" TEXT NOT NULL,
  "documentType" TEXT NOT NULL DEFAULT 'CC',
  "documentNumber" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "phone" TEXT,
  "whatsapp" TEXT,
  "homeAddress" TEXT,
  "workAddress" TEXT,
  "groupName" TEXT NOT NULL DEFAULT 'Principal',
  "creditLimit" INTEGER,
  "rating" TEXT,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "notes" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Client_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Client_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Client_companyId_documentNumber_key" ON "Client"("companyId", "documentNumber");
CREATE INDEX "Client_routeId_idx" ON "Client"("routeId");

CREATE TABLE "Loan" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "companyId" TEXT NOT NULL,
  "routeId" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "alias" TEXT,
  "principal" INTEGER NOT NULL,
  "interestRate" INTEGER NOT NULL DEFAULT 0,
  "interestAmount" INTEGER NOT NULL DEFAULT 0,
  "totalAmount" INTEGER NOT NULL,
  "installmentAmount" INTEGER NOT NULL,
  "installmentCount" INTEGER NOT NULL,
  "modality" TEXT NOT NULL DEFAULT 'DAILY',
  "paymentScheme" TEXT NOT NULL DEFAULT 'INSTALLMENTS',
  "startDate" DATETIME NOT NULL,
  "endDate" DATETIME NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "noChargeSaturday" BOOLEAN NOT NULL DEFAULT false,
  "noChargeSunday" BOOLEAN NOT NULL DEFAULT false,
  "createdById" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Loan_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Loan_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Loan_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Loan_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Loan_code_key" ON "Loan"("code");
CREATE INDEX "Loan_clientId_idx" ON "Loan"("clientId");
CREATE INDEX "Loan_routeId_idx" ON "Loan"("routeId");
CREATE INDEX "Loan_status_idx" ON "Loan"("status");

CREATE TABLE "Installment" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "loanId" TEXT NOT NULL,
  "number" INTEGER NOT NULL,
  "dueDate" DATETIME NOT NULL,
  "principalAmount" INTEGER NOT NULL,
  "interestAmount" INTEGER NOT NULL DEFAULT 0,
  "moraAmount" INTEGER NOT NULL DEFAULT 0,
  "chargeAmount" INTEGER NOT NULL DEFAULT 0,
  "totalAmount" INTEGER NOT NULL,
  "paidAmount" INTEGER NOT NULL DEFAULT 0,
  "balance" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Installment_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Installment_loanId_number_key" ON "Installment"("loanId", "number");
CREATE INDEX "Installment_dueDate_idx" ON "Installment"("dueDate");

CREATE TABLE "Payment" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "companyId" TEXT NOT NULL,
  "routeId" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "loanId" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "principalPaid" INTEGER NOT NULL DEFAULT 0,
  "interestPaid" INTEGER NOT NULL DEFAULT 0,
  "moraPaid" INTEGER NOT NULL DEFAULT 0,
  "chargesPaid" INTEGER NOT NULL DEFAULT 0,
  "discountAmount" INTEGER NOT NULL DEFAULT 0,
  "paymentType" TEXT NOT NULL DEFAULT 'AUTOMATIC',
  "paymentMethod" TEXT NOT NULL DEFAULT 'CASH',
  "note" TEXT,
  "createdById" TEXT NOT NULL,
  "voidedAt" DATETIME,
  "voidReason" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Payment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Payment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Payment_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Payment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "Payment_loanId_idx" ON "Payment"("loanId");
CREATE INDEX "Payment_routeId_idx" ON "Payment"("routeId");
CREATE INDEX "Payment_createdAt_idx" ON "Payment"("createdAt");

CREATE TABLE "Expense" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "companyId" TEXT NOT NULL,
  "routeId" TEXT NOT NULL,
  "concept" TEXT NOT NULL,
  "category" TEXT NOT NULL DEFAULT 'Otros',
  "amount" INTEGER NOT NULL,
  "date" DATETIME NOT NULL,
  "createdById" TEXT NOT NULL,
  "voidedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Expense_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Expense_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Expense_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "Expense_routeId_idx" ON "Expense"("routeId");
CREATE INDEX "Expense_date_idx" ON "Expense"("date");

CREATE TABLE "CashMovement" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "companyId" TEXT NOT NULL,
  "routeId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "concept" TEXT NOT NULL,
  "sourceType" TEXT,
  "sourceId" TEXT,
  "createdById" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CashMovement_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "CashMovement_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "CashMovement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "CashMovement_routeId_idx" ON "CashMovement"("routeId");
CREATE INDEX "CashMovement_createdAt_idx" ON "CashMovement"("createdAt");

CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "companyId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "beforeJson" TEXT,
  "afterJson" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");
`);

db.close();

console.log(`SQLite database initialized at ${dbPath}`);
