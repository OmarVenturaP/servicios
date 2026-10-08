import { and, eq, exists, or, sql } from "drizzle-orm";
import { catCategorias, datServicios, relServiciosCategorias } from "./schema.js";

// EXISTS avoids multiplying units/counts for providers with multiple categories.
export function activeServiceCategoryCondition(db) {
  return or(
    exists(db.select({ value: sql`1` }).from(catCategorias).where(and(
      eq(catCategorias.id, datServicios.categoriaId), eq(catCategorias.activo, true),
    ))),
    exists(db.select({ value: sql`1` }).from(relServiciosCategorias)
      .innerJoin(catCategorias, eq(catCategorias.id, relServiciosCategorias.categoriaId))
      .where(and(eq(relServiciosCategorias.servicioId, datServicios.id), eq(catCategorias.activo, true)))),
  );
}
