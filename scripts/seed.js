import "dotenv/config";
import { createHash } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { getMySqlConnectionOptions } from "../src/db/connection.js";
import {
  catCiudades,
  catEstadosUnidad,
  catModosContacto,
  datServicios,
  datUnidades,
} from "../src/db/schema.js";

const DEV_SOURCE = "seed_desarrollo";

const estadoCatalogo = [
  { clave: "disponible", nombre: "Disponible" },
  { clave: "ocupado", nombre: "Ocupado" },
  { clave: "no_disponible", nombre: "No disponible" },
];

const modoContactoCatalogo = [
  { clave: "central", nombre: "Contacto central" },
  { clave: "unidad", nombre: "Contacto por unidad" },
];

const serviciosDesarrollo = [
  {
    nombre: "Motomandados Demo Centro",
    slug: "motomandados-demo-centro",
    modoContacto: "central",
    telefono: "9660000001",
    whatsapp: "529660000001",
    descripcion: "Servicio ficticio de desarrollo con atención central.",
    coberturaTexto: "Centro y alrededores (dato ficticio).",
    unidades: [
      { nombre: "Unidad 1", precioBase: "40.00", estado: "disponible" },
    ],
  },
  {
    nombre: "Mandados Demo Express",
    slug: "mandados-demo-express",
    modoContacto: "unidad",
    descripcion: "Servicio ficticio con varias unidades disponibles.",
    coberturaTexto: "Zona urbana de demostración.",
    unidades: [
      { nombre: "Unidad 1", precioBase: "45.00", estado: "disponible" },
      { nombre: "Unidad 2", precioBase: "50.00", estado: "disponible" },
      { nombre: "Unidad 3", precioBase: "42.00", estado: "ocupado" },
    ],
  },
  {
    nombre: "Envíos Demo Costa",
    slug: "envios-demo-costa",
    modoContacto: "central",
    telefono: "9660000003",
    whatsapp: "529660000003",
    descripcion: "Servicio ficticio con unidades temporalmente ocupadas.",
    coberturaTexto: "Cobertura ficticia para pruebas.",
    unidades: [
      { nombre: "Unidad 1", precioBase: "55.00", estado: "ocupado" },
      { nombre: "Unidad 2", precioBase: "60.00", estado: "no_disponible" },
    ],
  },
  {
    nombre: "Moto Apoyo Demo",
    slug: "moto-apoyo-demo",
    modoContacto: "unidad",
    descripcion: "Proveedor independiente completamente ficticio.",
    unidades: [
      { nombre: "Unidad 1", precioBase: "35.00", estado: "no_disponible" },
    ],
  },
  {
    nombre: "Mandaditos Demo Local",
    slug: "mandaditos-demo-local",
    modoContacto: "unidad",
    descripcion: "Servicio ficticio para validar diferentes precios y estados.",
    unidades: [
      { nombre: "Unidad 1", precioBase: "48.00", estado: "disponible" },
      { nombre: "Unidad 2", precioBase: "52.00", estado: "ocupado" },
    ],
  },
];

function tokenHashFor(serviceSlug, unitIndex) {
  const developmentToken = `solo-desarrollo-${serviceSlug}-unidad-${unitIndex + 1}`;
  return createHash("sha256").update(developmentToken).digest("hex");
}

function contactFor(serviceIndex, unitIndex) {
  const suffix = String((serviceIndex + 1) * 10 + unitIndex + 1).padStart(4, "0");
  return {
    telefono: `966000${suffix}`,
    whatsapp: `52966000${suffix}`,
  };
}

function stateExpiration(state, now) {
  if (state === "disponible") {
    return new Date(now.getTime() + 3 * 60 * 60 * 1000);
  }

  if (state === "ocupado") {
    return new Date(now.getTime() + 60 * 60 * 1000);
  }

  return null;
}

async function seed() {
  const connection = await mysql.createConnection(getMySqlConnectionOptions());
  const db = drizzle(connection);

  try {
    await db
      .insert(catCiudades)
      .values({
        nombre: "Tonalá",
        slug: "tonala",
        estado: "Chiapas",
        pais: "México",
        activo: true,
      })
      .onDuplicateKeyUpdate({ set: { nombre: "Tonalá", activo: true } });

    await db
      .insert(catEstadosUnidad)
      .values(estadoCatalogo.map((estado) => ({ ...estado, activo: true })))
      .onDuplicateKeyUpdate({ set: { activo: true } });

    await db
      .insert(catModosContacto)
      .values(modoContactoCatalogo.map((modo) => ({ ...modo, activo: true })))
      .onDuplicateKeyUpdate({ set: { activo: true } });

    const [ciudad] = await db
      .select({ id: catCiudades.id })
      .from(catCiudades)
      .where(eq(catCiudades.slug, "tonala"))
      .limit(1);
    const estados = await db
      .select({ id: catEstadosUnidad.id, clave: catEstadosUnidad.clave })
      .from(catEstadosUnidad);
    const modos = await db
      .select({ id: catModosContacto.id, clave: catModosContacto.clave })
      .from(catModosContacto);

    const estadoId = Object.fromEntries(estados.map((estado) => [estado.clave, estado.id]));
    const modoId = Object.fromEntries(modos.map((modo) => [modo.clave, modo.id]));
    const now = new Date();

    for (const [serviceIndex, service] of serviciosDesarrollo.entries()) {
      await db
        .insert(datServicios)
        .values({
          ciudadId: ciudad.id,
          modoContactoId: modoId[service.modoContacto],
          nombre: service.nombre,
          slug: service.slug,
          telefono: service.telefono ?? null,
          whatsapp: service.whatsapp ?? null,
          descripcion: service.descripcion,
          coberturaTexto: service.coberturaTexto ?? null,
          visible: true,
          participaPiloto: false,
          fuente: DEV_SOURCE,
          notas: "DATO FICTICIO: creado exclusivamente para desarrollo.",
        })
        .onDuplicateKeyUpdate({
          set: {
            modoContactoId: modoId[service.modoContacto],
            nombre: service.nombre,
            telefono: service.telefono ?? null,
            whatsapp: service.whatsapp ?? null,
            descripcion: service.descripcion,
            coberturaTexto: service.coberturaTexto ?? null,
            visible: true,
            participaPiloto: false,
            fuente: DEV_SOURCE,
            notas: "DATO FICTICIO: creado exclusivamente para desarrollo.",
          },
        });

      const [savedService] = await db
        .select({ id: datServicios.id })
        .from(datServicios)
        .where(and(eq(datServicios.ciudadId, ciudad.id), eq(datServicios.slug, service.slug)))
        .limit(1);

      for (const [unitIndex, unit] of service.unidades.entries()) {
        const contact = contactFor(serviceIndex, unitIndex);
        const tokenHash = tokenHashFor(service.slug, unitIndex);
        const values = {
          servicioId: savedService.id,
          nombre: unit.nombre,
          telefono: contact.telefono,
          whatsapp: contact.whatsapp,
          precioBase: unit.precioBase,
          estadoId: estadoId[unit.estado],
          estadoActualizadoAt: now,
          estadoHasta: stateExpiration(unit.estado, now),
          tokenHash,
          activo: true,
        };

        await db.insert(datUnidades).values(values).onDuplicateKeyUpdate({ set: values });
      }
    }

    console.log("Seed de desarrollo aplicado: Tonalá, catálogos, 5 servicios y 9 unidades.");
  } finally {
    await connection.end();
  }
}

seed().catch((error) => {
  console.error("No se pudo aplicar el seed de desarrollo.", error);
  process.exitCode = 1;
});
