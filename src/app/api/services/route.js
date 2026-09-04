import { desc } from "drizzle-orm";
import { getDb } from "@/db";
import { services } from "@/db/schema";

export const runtime = "nodejs";

export async function GET() {
  try {
    const rows = await getDb().select().from(services).orderBy(desc(services.createdAt));
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
    const description = typeof body.description === "string" ? body.description.trim() : null;

    if (!name || name.length > 160 || (description?.length ?? 0) > 500) {
      return Response.json({ error: "Datos del servicio inválidos" }, { status: 400 });
    }

    const result = await getDb().insert(services).values({ name, description });
    return Response.json({ id: result[0].insertId, name, description }, { status: 201 });
  } catch (error) {
    console.error("No se pudo crear el servicio", error);
    return Response.json({ error: "No se pudo crear el servicio" }, { status: 500 });
  }
}

