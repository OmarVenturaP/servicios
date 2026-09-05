import { connection } from "next/server";
import { Link2Off } from "lucide-react";
import UnitStatusPanel from "@/components/UnitStatusPanel";
import { resolveUnitPanel } from "@/services/units";

export const metadata = {
  title: "Panel de unidad | Servicios locales",
  robots: { index: false, follow: false },
};

function InvalidLink() {
  return (
    <main className="grid min-h-dvh place-items-center bg-slate-100 px-5 py-10">
      <section className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-lg">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-slate-100 text-slate-500">
          <Link2Off aria-hidden="true" size={26} />
        </div>
        <h1 className="mt-5 text-2xl font-black text-slate-950">Enlace no válido</h1>
        <p className="mt-2 text-base leading-6 text-slate-600">Este enlace no existe o ya no está activo. Solicita un enlace nuevo al responsable del servicio.</p>
      </section>
    </main>
  );
}

export default async function UnitPage({ params }) {
  await connection();
  const { token } = await params;
  const unit = await resolveUnitPanel(token);

  if (!unit) return <InvalidLink />;

  return (
    <div className="min-h-dvh bg-slate-100 sm:px-4 sm:py-1">
      <UnitStatusPanel token={token} initialUnit={unit} />
    </div>
  );
}
