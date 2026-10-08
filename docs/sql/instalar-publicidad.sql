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

-- Anuncios iniciales para Tonalá. Se activan al ejecutar este archivo.
-- No duplica estos anuncios si se ejecuta nuevamente.
START TRANSACTION;

INSERT INTO dat_anuncios
  (ciudad_id, titulo, imagen_url, destino_url, orden, activo)
SELECT c.id, 'Servitec: sitio web profesional por $999 MXN', 'https://res.cloudinary.com/servicios-servitec/image/upload/v1791407015/servicios/publicidad/e8cd78b2-f51b-426a-987e-4264109d6005.jpg', 'https://www.servitec-tonala.es/promociones/sitio-web-999', 1, TRUE
FROM cat_ciudades c
WHERE c.slug = 'tonala' AND c.activo = TRUE
  AND NOT EXISTS (
    SELECT 1 FROM dat_anuncios a
    WHERE a.ciudad_id = c.id AND a.imagen_url = 'https://res.cloudinary.com/servicios-servitec/image/upload/v1791407015/servicios/publicidad/e8cd78b2-f51b-426a-987e-4264109d6005.jpg'
  );

INSERT INTO dat_anuncios
  (ciudad_id, titulo, imagen_url, destino_url, orden, activo)
SELECT c.id, 'Servicios: anuncia tu negocio en Tonalá', 'https://res.cloudinary.com/servicios-servitec/image/upload/v1791407016/servicios/publicidad/fa2fde27-fb85-42cd-a520-d8ec17f228ad.jpg', 'https://wa.me/529619326182?text=Hola%2C%20quiero%20que%20mi%20servicio%20aparezca%20en%20la%20plataforma%20SERVICIOS%20y%20me%20interesa%20unirme.%20%C2%BFMe%20pueden%20compartir%20informaci%C3%B3n%3F', 2, TRUE
FROM cat_ciudades c
WHERE c.slug = 'tonala' AND c.activo = TRUE
  AND NOT EXISTS (
    SELECT 1 FROM dat_anuncios a
    WHERE a.ciudad_id = c.id AND a.imagen_url = 'https://res.cloudinary.com/servicios-servitec/image/upload/v1791407016/servicios/publicidad/fa2fde27-fb85-42cd-a520-d8ec17f228ad.jpg'
  );

COMMIT;

SELECT a.id, c.nombre AS ciudad, a.titulo, a.activo, a.orden
FROM dat_anuncios a JOIN cat_ciudades c ON c.id = a.ciudad_id
WHERE c.slug = 'tonala' ORDER BY a.orden, a.id;
