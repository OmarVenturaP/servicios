import { connection } from "next/server";
import { Link2Off } from "lucide-react";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { catCiudades, datServicios, datHorariosServicio } from "@/db/schema";
import BrandMark from "@/components/BrandMark";
import UnitStatusPanel from "@/components/UnitStatusPanel";
import ServicePanel from "@/components/ServicePanel";
import ProviderAnalyticsSignal from "@/components/ProviderAnalyticsSignal";
import { resolveUnitPanel } from "@/services/units";
import { hashUnitToken } from "@/lib/unit-token";

export const metadata = {
  title: "Panel privado de servicio",
  robots: { index: false, follow: false },
};

function InvalidLink() {
  return (
    <div className="min-h-screen bg-[#eef1f6] py-0 sm:py-8">
      <main className="relative mx-auto grid min-h-screen w-full place-items-center overflow-hidden bg-[#fbfcff] shadow-[0_20px_70px_rgba(15,23,42,0.16)] sm:min-h-[840px] sm:max-w-[430px] sm:rounded-[2.25rem] px-5 py-10">
        <section className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-lg">
          <BrandMark className="mb-6 justify-center" />
          <div className="mx-auto grid size-14 place-items-center rounded-full bg-slate-100 text-slate-500">
            <Link2Off aria-hidden="true" size={26} />
          </div>
          <h1 className="mt-5 text-2xl font-black text-slate-950">Enlace no válido</h1>
          <p className="mt-2 text-base leading-6 text-slate-600">Este enlace no existe o ya no está activo. Solicita un enlace nuevo al responsable del servicio.</p>
        </section>
      </main>
    </div>
  );
}

export default async function UnitPage({ params }) {
  await connection();
  const { token } = await params;
  const tokenHash = hashUnitToken(token);
  if (!tokenHash) return <InvalidLink />;

  const db = getDb();

  // 1. Check if it's a unit panel
  const unit = await resolveUnitPanel(token);
  if (unit) {
    return (
      <div className="min-h-screen bg-[#eef1f6] py-0 sm:py-8">
        <ProviderAnalyticsSignal token={token} />
        <UnitStatusPanel token={token} initialUnit={unit} />
      </div>
    );
  }

  // 2. Check if it's a general service panel
  const [serviceRecord] = await db
    .select({
      id: datServicios.id,
      name: datServicios.nombre,
      cityName: catCiudades.nombre,
      phone: datServicios.telefono,
      whatsapp: datServicios.whatsapp,
      shortInformation: datServicios.informacionCorta,
      extendedInformation: datServicios.informacionExtendida,
      coverage: datServicios.coberturaTexto,
      cashPayment: datServicios.pagoEfectivo,
      cardPayment: datServicios.pagoTarjeta,
      transferPayment: datServicios.pagoTransferencia,
    })
    .from(datServicios)
    .innerJoin(catCiudades, eq(catCiudades.id, datServicios.ciudadId))
    .where(eq(datServicios.tokenHash, tokenHash))
    .limit(1);

  if (!serviceRecord) return <InvalidLink />;

  const scheduleRows = await db
    .select({
      day: datHorariosServicio.diaSemana,
      block: datHorariosServicio.bloque,
      start: datHorariosServicio.horaInicio,
      end: datHorariosServicio.horaFin,
    })
    .from(datHorariosServicio)
    .where(eq(datHorariosServicio.servicioId, serviceRecord.id))
    .orderBy(datHorariosServicio.diaSemana, datHorariosServicio.bloque);

  const initialService = {
    ...serviceRecord,
    cashPayment: Boolean(serviceRecord.cashPayment),
    cardPayment: Boolean(serviceRecord.cardPayment),
    transferPayment: Boolean(serviceRecord.transferPayment),
    schedule: scheduleRows,
  };

  return (
    <div className="min-h-screen bg-[#eef1f6] py-0 sm:py-8">
      <ProviderAnalyticsSignal token={token} />
      <ServicePanel token={token} initialService={initialService} />
    </div>
  );
}
