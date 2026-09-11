import Link from "next/link";

export default function LocalSeoContent({ city }) {
  const location = `${city.name}, ${city.state}`;

  return (
    <section className="mx-5 mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)]" aria-labelledby="local-services-title">
      <h2 id="local-services-title" className="text-lg font-semibold tracking-tight text-[var(--brand-navy)]">
        Encuentra servicios en {location}
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        <strong>Servicios</strong> reúne información de proveedores de la zona para ayudarte a encontrar una opción local con mayor facilidad. Compara cobertura, disponibilidad y precios base en {location} antes de contactar directamente por WhatsApp o llamada. El proveedor realiza el servicio y confirma contigo el precio final.
      </p>

      <div className="mt-4 border-t border-slate-200 pt-4">
        <p className="text-sm font-semibold text-[var(--brand-navy)]">¿Tienes dudas sobre nuestra plataforma?</p>
        <Link href="/preguntas-frecuentes" className="mt-2 inline-flex min-h-11 items-center rounded-xl font-bold text-[var(--brand-blue)] underline decoration-2 underline-offset-4">
          Consultar todas las preguntas frecuentes
        </Link>
      </div>
    </section>
  );
}
