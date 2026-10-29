import { NextResponse } from "next/server";
import { connection } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { datServicios, datHorariosServicio, catCiudades } from "@/db/schema";
import { hashUnitToken } from "@/lib/unit-token";
import { normalizeScheduleInput } from "@/domain/service-schedule";

export const runtime = "nodejs";

export async function PATCH(request) {
  await connection();
  try {
    const body = await request.json();
    const tokenHash = hashUnitToken(body.token);
    if (!tokenHash) {
      return NextResponse.json({ success: false, error: "Enlace no válido." }, { status: 404 });
    }

    const db = getDb();
    const [service] = await db
      .select({ id: datServicios.id, cityName: catCiudades.nombre })
      .from(datServicios)
      .innerJoin(catCiudades, eq(catCiudades.id, datServicios.ciudadId))
      .where(eq(datServicios.tokenHash, tokenHash))
      .limit(1);

    if (!service) {
      return NextResponse.json({ success: false, error: "Servicio no encontrado." }, { status: 404 });
    }

    let schedule = [];
    if (body.schedule) {
      const parsed = typeof body.schedule === "string" ? JSON.parse(body.schedule) : body.schedule;
      const norm = normalizeScheduleInput(parsed);
      if (!norm.valid) {
        return NextResponse.json({ success: false, error: norm.error }, { status: 400 });
      }
      schedule = norm.schedule;
    }

    await db.transaction(async (tx) => {
      await tx.update(datServicios).set({
        nombre: body.name,
        telefono: body.phone || null,
        whatsapp: body.whatsapp || null,
        informacionCorta: body.shortInformation || null,
        informacionExtendida: body.extendedInformation || null,
        coberturaTexto: body.coverage || null,
        pagoEfectivo: Boolean(body.cashPayment),
        pagoTarjeta: Boolean(body.cardPayment),
        pagoTransferencia: Boolean(body.transferPayment),
      }).where(eq(datServicios.id, service.id));

      if (body.schedule) {
        await tx.delete(datHorariosServicio).where(eq(datHorariosServicio.servicioId, service.id));
        if (schedule.length) {
          await tx.insert(datHorariosServicio).values(schedule.map((item) => ({
            servicioId: service.id,
            diaSemana: item.day,
            bloque: item.block,
            horaInicio: item.start,
            horaFin: item.end,
          })));
        }
      }
    });

    const [updatedRecord] = await db
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
      .where(eq(datServicios.id, service.id))
      .limit(1);

    const scheduleRows = await db
      .select({
        day: datHorariosServicio.diaSemana,
        block: datHorariosServicio.bloque,
        start: datHorariosServicio.horaInicio,
        end: datHorariosServicio.horaFin,
      })
      .from(datHorariosServicio)
      .where(eq(datHorariosServicio.servicioId, service.id))
      .orderBy(datHorariosServicio.diaSemana, datHorariosServicio.bloque);

    const updatedService = {
      ...updatedRecord,
      cashPayment: Boolean(updatedRecord.cashPayment),
      cardPayment: Boolean(updatedRecord.cardPayment),
      transferPayment: Boolean(updatedRecord.transferPayment),
      schedule: scheduleRows,
    };

    return NextResponse.json({ success: true, service: updatedService });
  } catch (error) {
    console.error("Error updating service panel", error);
    return NextResponse.json({ success: false, error: "No se pudo actualizar el servicio." }, { status: 500 });
  }
}
