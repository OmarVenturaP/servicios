import { getDb } from "@/db";
import { and, eq } from "drizzle-orm";
import { catCategorias, datServicios, relServiciosCategorias } from "@/db/schema";
import { getPublicServicesByCity } from "@/db/queries/public-services";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    const citySlug = new URL(request.url).searchParams.get("city")?.trim() || "tonala";
    const result = await getPublicServicesByCity(citySlug);

    if (!result) {
      return Response.json({ error: "Ciudad no encontrada" }, { status: 404 });
    }

    return Response.json(result);
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
    const categoryId = Number(body.categoryId);

    if (
      !name ||
      name.length > 160 ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ||
      slug.length > 160 ||
      !Number.isInteger(cityId) ||
      cityId < 1 ||
      !Number.isInteger(contactModeId) ||
      contactModeId < 1 ||
      !Number.isInteger(categoryId) ||
      categoryId < 1
    ) {
      return Response.json({ error: "Datos del servicio inválidos" }, { status: 400 });
    }

    const createdId = await getDb().transaction(async (tx) => {
      const [category] = await tx.select({ id: catCategorias.id, requiresUnits: catCategorias.requiereUnidades }).from(catCategorias).where(and(eq(catCategorias.id, categoryId), eq(catCategorias.activo, true))).limit(1);
      if (!category) throw new Error("invalid_category");
      const result = await tx.insert(datServicios).values({
        ciudadId: cityId,
        modoContactoId: contactModeId,
        categoriaId: categoryId,
        nombre: name,
        slug,
        descripcion: description,
        informacionCorta: description,
        informacionExtendida: description,
        modoOperacion: category.requiresUnits ? "unidades" : "servicio",
      });
      const serviceId = Number(result[0].insertId);
      await tx.insert(relServiciosCategorias).values({ servicioId: serviceId, categoriaId: categoryId });
      return serviceId;
    });
    return Response.json(
      { id: createdId, name, slug, description },
      { status: 201 },
    );
  } catch (error) {
    if (error.message === "invalid_category") return Response.json({ error: "La categoría no existe o está inactiva." }, { status: 400 });
    console.error("No se pudo crear el servicio", error);
    return Response.json({ error: "No se pudo crear el servicio" }, { status: 500 });
  }
}
