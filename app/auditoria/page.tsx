import Link from "next/link";
import type { ReactNode } from "react";
import { ClipboardList, Database, Search, ShieldCheck, UserRound } from "lucide-react";

import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { formatShortDate } from "@/lib/format";

export const dynamic = "force-dynamic";

type AuditPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AuditPage({ searchParams }: AuditPageProps) {
  const params = (await searchParams) ?? {};
  const query = typeof params.q === "string" ? params.q.trim() : "";
  const data = await getAuditData(query);

  return (
    <main className="min-h-screen bg-background text-slate-950">
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
                  label === "Auditoria"
                    ? "bg-[#50A96B] text-white"
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
              <p className="text-xs text-slate-500">Gestion interna</p>
              <h1 className="text-lg font-semibold">Auditoria</h1>
            </div>
            <form className="flex w-[420px] items-center gap-2" action="/auditoria">
              <label className="relative flex-1">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={17}
                />
                <input
                  name="q"
                  defaultValue={query}
                  placeholder="Buscar evento..."
                  className="h-10 w-full rounded-md border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-slate-400"
                />
              </label>
              <button className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Buscar
              </button>
            </form>
          </header>

          <div className="space-y-6 px-8 py-7">
            <section className="grid grid-cols-4 gap-4">
              <MetricCard
                label="Eventos"
                value={String(data.totalLogs)}
                note="Acciones registradas"
                icon={<ClipboardList size={21} />}
              />
              <MetricCard
                label="Usuarios"
                value={String(data.actorCount)}
                note="Con actividad"
                icon={<UserRound size={21} />}
              />
              <MetricCard
                label="Entidades"
                value={String(data.entityCount)}
                note="Tipos auditados"
                icon={<Database size={21} />}
              />
              <MetricCard
                label="Ultima accion"
                value={data.lastAction}
                note="Evento mas reciente"
                icon={<ShieldCheck size={21} />}
              />
            </section>

            <section className="rounded-lg border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-5 py-4">
                <h2 className="text-base font-semibold">Registro de acciones</h2>
                <p className="text-sm text-slate-500">
                  Trazabilidad de altas, asignaciones y cambios operativos
                </p>
              </div>
              <div className="divide-y divide-slate-100">
                {data.logs.map((log) => (
                  <article key={log.id} className="grid grid-cols-[1fr_280px] gap-5 px-5 py-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-[#50A96B] px-2.5 py-1 text-xs font-semibold text-white">
                          {log.action}
                        </span>
                        <p className="text-sm font-semibold">{log.entityType}</p>
                      </div>
                      <p className="mt-2 text-sm text-slate-600">
                        Entidad <span className="font-mono text-xs">{log.entityId}</span>
                      </p>
                      <p className="mt-2 line-clamp-2 text-xs text-slate-500">
                        {log.preview}
                      </p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-semibold">{log.userName}</p>
                      <p className="mt-1 text-slate-500">{formatShortDate(log.createdAt)}</p>
                    </div>
                  </article>
                ))}
              </div>
              {data.logs.length === 0 ? (
                <div className="px-5 py-12 text-center text-sm text-slate-500">
                  No hay eventos con ese filtro.
                </div>
              ) : null}
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
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold">{value}</p>
        </div>
        <div className="text-slate-500">{icon}</div>
      </div>
      <p className="mt-3 text-xs text-slate-500">{note}</p>
    </article>
  );
}

async function getAuditData(query: string) {
  const actor = await currentUser();
  const logs = await prisma.auditLog.findMany({
    where: { companyId: actor.companyId },
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const normalizedQuery = query.toLowerCase();
  const mapped = logs.map((log) => ({
    id: log.id,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    createdAt: log.createdAt,
    userName: log.user.name,
    preview: compactJson(log.afterJson ?? log.beforeJson ?? "Sin detalle"),
  }));
  const filtered =
    normalizedQuery.length === 0
      ? mapped
      : mapped.filter((log) =>
          [
            log.action,
            log.entityType,
            log.entityId,
            log.userName,
            log.preview,
          ].some((value) => value.toLowerCase().includes(normalizedQuery)),
        );

  return {
    logs: filtered,
    totalLogs: mapped.length,
    actorCount: new Set(mapped.map((log) => log.userName)).size,
    entityCount: new Set(mapped.map((log) => log.entityType)).size,
    lastAction: mapped[0]?.action ?? "Sin eventos",
  };
}

function compactJson(value: string) {
  try {
    return JSON.stringify(JSON.parse(value));
  } catch {
    return value;
  }
}
