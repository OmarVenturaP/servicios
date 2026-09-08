import { relations } from "drizzle-orm";
import {
  boolean,
  char,
  decimal,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  time,
  tinyint,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const catCiudades = mysqlTable(
  "cat_ciudades",
  {
    id: int("id").autoincrement().primaryKey(),
    nombre: varchar("nombre", { length: 120 }).notNull(),
    slug: varchar("slug", { length: 120 }).notNull(),
    estado: varchar("estado", { length: 120 }).notNull(),
    pais: varchar("pais", { length: 120 }).notNull(),
    zonaHoraria: varchar("zona_horaria", { length: 80 }).default("America/Mexico_City").notNull(),
    activo: boolean("activo").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [uniqueIndex("uq_cat_ciudades_slug").on(table.slug)],
);

export const catEstadosUnidad = mysqlTable(
  "cat_estados_unidad",
  {
    id: int("id").autoincrement().primaryKey(),
    clave: varchar("clave", { length: 40 }).notNull(),
    nombre: varchar("nombre", { length: 80 }).notNull(),
    activo: boolean("activo").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("uq_cat_estados_unidad_clave").on(table.clave)],
);

export const catModosContacto = mysqlTable(
  "cat_modos_contacto",
  {
    id: int("id").autoincrement().primaryKey(),
    clave: varchar("clave", { length: 40 }).notNull(),
    nombre: varchar("nombre", { length: 80 }).notNull(),
    activo: boolean("activo").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("uq_cat_modos_contacto_clave").on(table.clave)],
);

export const datServicios = mysqlTable(
  "dat_servicios",
  {
    id: int("id").autoincrement().primaryKey(),
    ciudadId: int("ciudad_id")
      .notNull()
      .references(() => catCiudades.id, { onDelete: "restrict", onUpdate: "cascade" }),
    modoContactoId: int("modo_contacto_id")
      .notNull()
      .references(() => catModosContacto.id, { onDelete: "restrict", onUpdate: "cascade" }),
    nombre: varchar("nombre", { length: 160 }).notNull(),
    slug: varchar("slug", { length: 160 }).notNull(),
    telefono: varchar("telefono", { length: 30 }),
    whatsapp: varchar("whatsapp", { length: 30 }),
    descripcion: text("descripcion"),
    coberturaTexto: text("cobertura_texto"),
    logoUrl: varchar("logo_url", { length: 500 }),
    visible: boolean("visible").default(true).notNull(),
    participaPiloto: boolean("participa_piloto").default(false).notNull(),
    fuente: varchar("fuente", { length: 80 }),
    notas: text("notas"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    uniqueIndex("uq_dat_servicios_ciudad_slug").on(table.ciudadId, table.slug),
    index("idx_dat_servicios_modo_contacto").on(table.modoContactoId),
    index("idx_dat_servicios_publicos").on(table.ciudadId, table.visible),
  ],
);

export const datUnidades = mysqlTable(
  "dat_unidades",
  {
    id: int("id").autoincrement().primaryKey(),
    servicioId: int("servicio_id")
      .notNull()
      .references(() => datServicios.id, { onDelete: "restrict", onUpdate: "cascade" }),
    nombre: varchar("nombre", { length: 120 }),
    telefono: varchar("telefono", { length: 30 }),
    whatsapp: varchar("whatsapp", { length: 30 }),
    precioBase: decimal("precio_base", { precision: 10, scale: 2 }).notNull(),
    estadoId: int("estado_id")
      .notNull()
      .references(() => catEstadosUnidad.id, { onDelete: "restrict", onUpdate: "cascade" }),
    estadoActualizadoAt: timestamp("estado_actualizado_at").defaultNow().notNull(),
    estadoHasta: timestamp("estado_hasta"),
    modoDisponibilidad: mysqlEnum("modo_disponibilidad", ["manual", "programado"]).default("manual").notNull(),
    excepcionEstado: mysqlEnum("excepcion_estado", ["disponible", "ocupado", "no_disponible"]),
    excepcionHasta: timestamp("excepcion_hasta"),
    tokenHash: char("token_hash", { length: 64 }),
    activo: boolean("activo").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    uniqueIndex("uq_dat_unidades_token_hash").on(table.tokenHash),
    index("idx_dat_unidades_servicio").on(table.servicioId),
    index("idx_dat_unidades_disponibilidad").on(
      table.estadoId,
      table.activo,
      table.estadoHasta,
    ),
  ],
);

export const datHorariosUnidad = mysqlTable(
  "dat_horarios_unidad",
  {
    id: int("id").autoincrement().primaryKey(),
    unidadId: int("unidad_id").notNull().references(() => datUnidades.id, { onDelete: "cascade", onUpdate: "cascade" }),
    diaSemana: tinyint("dia_semana").notNull(),
    bloque: tinyint("bloque").notNull(),
    horaInicio: time("hora_inicio").notNull(),
    horaFin: time("hora_fin").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    uniqueIndex("uq_horario_unidad_dia_bloque").on(table.unidadId, table.diaSemana, table.bloque),
    index("idx_horario_unidad_dia").on(table.unidadId, table.diaSemana),
  ],
);

export const logEstadosUnidad = mysqlTable(
  "log_estados_unidad",
  {
    id: int("id").autoincrement().primaryKey(),
    unidadId: int("unidad_id")
      .notNull()
      .references(() => datUnidades.id, { onDelete: "restrict", onUpdate: "cascade" }),
    estadoId: int("estado_id")
      .notNull()
      .references(() => catEstadosUnidad.id, { onDelete: "restrict", onUpdate: "cascade" }),
    estadoHasta: timestamp("estado_hasta"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_log_estados_unidad_unidad_fecha").on(table.unidadId, table.createdAt),
    index("idx_log_estados_unidad_estado").on(table.estadoId),
  ],
);

export const logVisitas = mysqlTable(
  "log_visitas",
  {
    id: int("id").autoincrement().primaryKey(),
    ciudadId: int("ciudad_id")
      .notNull()
      .references(() => catCiudades.id, { onDelete: "restrict", onUpdate: "cascade" }),
    sessionId: varchar("session_id", { length: 36 }).notNull(),
    origen: varchar("origen", { length: 255 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_log_visitas_ciudad_fecha").on(table.ciudadId, table.createdAt),
    index("idx_log_visitas_session").on(table.sessionId),
  ],
);

export const logContactos = mysqlTable(
  "log_contactos",
  {
    id: int("id").autoincrement().primaryKey(),
    servicioId: int("servicio_id")
      .notNull()
      .references(() => datServicios.id, { onDelete: "restrict", onUpdate: "cascade" }),
    unidadId: int("unidad_id").references(() => datUnidades.id, {
      onDelete: "restrict",
      onUpdate: "cascade",
    }),
    ciudadId: int("ciudad_id")
      .notNull()
      .references(() => catCiudades.id, { onDelete: "restrict", onUpdate: "cascade" }),
    sessionId: varchar("session_id", { length: 36 }).notNull(),
    canal: mysqlEnum("canal", ["whatsapp", "llamada"]).notNull(),
    precioMostrado: decimal("precio_mostrado", { precision: 10, scale: 2 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_log_contactos_servicio_fecha").on(table.servicioId, table.createdAt),
    index("idx_log_contactos_unidad").on(table.unidadId),
    index("idx_log_contactos_ciudad_fecha").on(table.ciudadId, table.createdAt),
    index("idx_log_contactos_session").on(table.sessionId),
  ],
);

export const catCiudadesRelations = relations(catCiudades, ({ many }) => ({
  servicios: many(datServicios),
  visitas: many(logVisitas),
  contactos: many(logContactos),
}));

export const catEstadosUnidadRelations = relations(catEstadosUnidad, ({ many }) => ({
  unidades: many(datUnidades),
  historico: many(logEstadosUnidad),
}));

export const catModosContactoRelations = relations(catModosContacto, ({ many }) => ({
  servicios: many(datServicios),
}));

export const datServiciosRelations = relations(datServicios, ({ one, many }) => ({
  ciudad: one(catCiudades, {
    fields: [datServicios.ciudadId],
    references: [catCiudades.id],
  }),
  modoContacto: one(catModosContacto, {
    fields: [datServicios.modoContactoId],
    references: [catModosContacto.id],
  }),
  unidades: many(datUnidades),
  contactos: many(logContactos),
}));

export const datUnidadesRelations = relations(datUnidades, ({ one, many }) => ({
  servicio: one(datServicios, {
    fields: [datUnidades.servicioId],
    references: [datServicios.id],
  }),
  estado: one(catEstadosUnidad, {
    fields: [datUnidades.estadoId],
    references: [catEstadosUnidad.id],
  }),
  historico: many(logEstadosUnidad),
  contactos: many(logContactos),
  horarios: many(datHorariosUnidad),
}));

export const datHorariosUnidadRelations = relations(datHorariosUnidad, ({ one }) => ({
  unidad: one(datUnidades, { fields: [datHorariosUnidad.unidadId], references: [datUnidades.id] }),
}));

export const logEstadosUnidadRelations = relations(logEstadosUnidad, ({ one }) => ({
  unidad: one(datUnidades, {
    fields: [logEstadosUnidad.unidadId],
    references: [datUnidades.id],
  }),
  estado: one(catEstadosUnidad, {
    fields: [logEstadosUnidad.estadoId],
    references: [catEstadosUnidad.id],
  }),
}));

export const logVisitasRelations = relations(logVisitas, ({ one }) => ({
  ciudad: one(catCiudades, {
    fields: [logVisitas.ciudadId],
    references: [catCiudades.id],
  }),
}));

export const logContactosRelations = relations(logContactos, ({ one }) => ({
  servicio: one(datServicios, {
    fields: [logContactos.servicioId],
    references: [datServicios.id],
  }),
  unidad: one(datUnidades, {
    fields: [logContactos.unidadId],
    references: [datUnidades.id],
  }),
  ciudad: one(catCiudades, {
    fields: [logContactos.ciudadId],
    references: [catCiudades.id],
  }),
}));
