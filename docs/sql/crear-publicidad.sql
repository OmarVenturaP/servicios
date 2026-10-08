-- Ejecutar en la misma base de datos de Servicios. No modifica otras tablas.
-- Equivalente a drizzle/0009_sloppy_yellowjacket.sql.
CREATE TABLE IF NOT EXISTS `dat_anuncios` (
  `id` int AUTO_INCREMENT NOT NULL,
  `ciudad_id` int NOT NULL,
  `titulo` varchar(160) NOT NULL,
  `imagen_url` varchar(2048) NOT NULL,
  `destino_url` varchar(2048) NOT NULL,
  `orden` int NOT NULL DEFAULT 0,
  `activo` boolean NOT NULL DEFAULT false,
  `fecha_inicio` date,
  `fecha_fin` date,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `dat_anuncios_id` PRIMARY KEY (`id`),
  CONSTRAINT `dat_anuncios_ciudad_id_cat_ciudades_id_fk`
    FOREIGN KEY (`ciudad_id`) REFERENCES `cat_ciudades` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX `idx_anuncios_ciudad_activo_orden` (`ciudad_id`, `activo`, `orden`)
);
