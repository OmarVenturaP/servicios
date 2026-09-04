export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 px-6 py-16 text-slate-100">
      <main className="mx-auto flex max-w-5xl flex-col gap-12">
        <section className="max-w-3xl">
          <p className="mb-4 font-mono text-sm uppercase tracking-[0.24em] text-cyan-400">
            Proyecto listo para desarrollar
          </p>
          <h1 className="text-5xl font-semibold tracking-tight sm:text-7xl">Servicios</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Una base moderna para construir y desplegar una aplicación de servicios
            con datos persistentes en MySQL.
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Interfaz", "Next.js 16 · JavaScript · Tailwind CSS 4"],
            ["Datos", "MySQL en Aiven · Drizzle ORM"],
            ["Despliegue", "Preparado para Vercel"],
          ].map(([title, description]) => (
            <article key={title} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
              <h2 className="text-lg font-medium text-white">{title}</h2>
              <p className="mt-2 leading-7 text-slate-400">{description}</p>
            </article>
          ))}
        </section>

        <section className="rounded-2xl border border-cyan-900/60 bg-cyan-950/30 p-6">
          <h2 className="text-lg font-medium text-cyan-100">API inicial</h2>
          <p className="mt-2 text-slate-300">
            Usa <code className="text-cyan-300">GET /api/services</code> y{" "}
            <code className="text-cyan-300">POST /api/services</code> después de
            configurar la base de datos y ejecutar las migraciones.
          </p>
        </section>
      </main>
    </div>
  );
}
