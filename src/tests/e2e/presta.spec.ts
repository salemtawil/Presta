import { expect, test } from "@playwright/test";

test("login is public and protected pages redirect", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Iniciar sesion" })).toBeVisible();

  await page.goto("/");
  await expect(page).toHaveURL(/\/login\?next=%2F/);
});

test("full operating flow", async ({ page }) => {
  test.skip(process.env.E2E_RUN_FULL !== "true", "Requires a reachable Postgres DB and seeded admin.");

  const email = process.env.E2E_EMAIL ?? process.env.PRESTA_SEED_EMAIL ?? "admin@presta.local";
  const password = process.env.E2E_PASSWORD ?? process.env.PRESTA_SEED_PASSWORD ?? "demo-only";
  const suffix = Date.now().toString(36).toUpperCase();

  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("heading", { name: /Hola,/ })).toBeVisible();

  await page.goto("/rutas/nuevo");
  await page.getByLabel("Nombre").fill(`QA RUTA ${suffix}`);
  await page.getByLabel("Descripcion").fill("Ruta creada por QA automatizado");
  await page.getByRole("button", { name: "Guardar ruta" }).click();
  await expect(page.getByRole("heading", { name: `QA RUTA ${suffix}` })).toBeVisible();

  await page.goto("/clientes/nuevo");
  await page.getByLabel("Nombre completo").fill(`QA CLIENTE ${suffix}`);
  await page.getByLabel("Documento").fill(`QA${suffix}`);
  await page.getByLabel("Telefono").fill("3000000000");
  await page.getByRole("button", { name: "Guardar cliente" }).click();
  await expect(page.getByText(`QA CLIENTE ${suffix}`)).toBeVisible();

  await page.getByRole("link", { name: /QA CLIENTE/ }).first().click();
  await page.getByRole("link", { name: "Nuevo prestamo" }).click();
  await page.getByLabel("Monto prestado").fill("100000");
  await page.getByLabel("Interes (%)").fill("10");
  await page.getByLabel("Numero de cuotas").fill("2");
  await page.getByRole("button", { name: "Crear prestamo" }).click();
  await expect(page.getByRole("heading", { name: /WEB-/ })).toBeVisible();

  await page.getByRole("link", { name: "Nuevo abono" }).click();
  await page.getByLabel("Monto recibido").fill("55000");
  await page.getByRole("button", { name: "Registrar abono" }).click();
  await expect(page.getByText("Abonos del prestamo")).toBeVisible();

  await page.goto("/gastos/nuevo");
  await page.getByLabel("Concepto").fill(`QA gasto ${suffix}`);
  await page.getByLabel("Monto").fill("15000");
  await page.getByRole("button", { name: "Guardar gasto" }).click();
  await expect(page.getByText(`QA gasto ${suffix}`)).toBeVisible();

  await page.goto("/balances");
  await expect(page.getByRole("heading", { name: "Balances" })).toBeVisible();
  await page.goto("/auditoria");
  await expect(page.getByRole("heading", { name: "Auditoria" })).toBeVisible();
});
