import { desc } from "drizzle-orm";
import { getDb } from "@/db";
import { datServicios } from "@/db/schema";

export const runtime = "nodejs";

export async function GET() {
  try {
    const rows = await getDb()
      .select()
      .from(datServicios)
      .orderBy(desc(datServicios.createdAt));
    return Response.json(rows);
  } catch (error) {
    console.error("No se pudieron consultar los servicios", error);
    return Response.json({ error: "No se pudieron consultar los servicios" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const slug = typeof body.slug === "string" ? body.slug.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim() : null;
    const cityId = Number(body.cityId);
    const contactModeId = Number(body.contactModeId);

    if (
      !name ||
      name.length > 160 ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ||
      slug.length > 160 ||
      !Number.isInteger(cityId) ||
      cityId < 1 ||
      !Number.isInteger(contactModeId) ||
      contactModeId < 1
    ) {
      return Response.json({ error: "Datos del servicio inválidos" }, { status: 400 });
    }

    const result = await getDb().insert(datServicios).values({
      ciudadId: cityId,
      modoContactoId: contactModeId,
      nombre: name,
      slug,
      descripcion: description,
    });
    return Response.json(
      { id: result[0].insertId, name, slug, description },
      { status: 201 },
    );
  } catch (error) {
    console.error("No se pudo crear el servicio", error);
    return Response.json({ error: "No se pudo crear el servicio" }, { status: 500 });
  }
}
