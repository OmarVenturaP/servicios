CREATE TABLE `rel_servicios_categorias` (
	`servicio_id` int NOT NULL,
	`categoria_id` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pk_rel_servicios_categorias` PRIMARY KEY(`servicio_id`,`categoria_id`)
);
--> statement-breakpoint
INSERT INTO `cat_categorias` (`nombre`, `slug`, `icono`, `requiere_unidades`, `activo`) VALUES
('A/C', 'aire-acondicionado', 'snowflake', false, true),
('Mecánicos', 'mecanicos', 'wrench', false, true),
('Electricistas', 'electricistas', 'plug', false, true),
('Plomería', 'plomeria', 'droplet', false, true),
('Fletes', 'fletes', 'package', false, true),
('Limpieza', 'limpieza', 'sparkles', false, true)
ON DUPLICATE KEY UPDATE `nombre` = VALUES(`nombre`), `icono` = VALUES(`icono`), `requiere_unidades` = VALUES(`requiere_unidades`), `activo` = true;--> statement-breakpoint
INSERT INTO `rel_servicios_categorias` (`servicio_id`, `categoria_id`)
SELECT `id`, `categoria_id` FROM `dat_servicios`;--> statement-breakpoint
ALTER TABLE `rel_servicios_categorias` ADD CONSTRAINT `rel_servicios_categorias_servicio_id_dat_servicios_id_fk` FOREIGN KEY (`servicio_id`) REFERENCES `dat_servicios`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `rel_servicios_categorias` ADD CONSTRAINT `rel_servicios_categorias_categoria_id_cat_categorias_id_fk` FOREIGN KEY (`categoria_id`) REFERENCES `cat_categorias`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX `idx_rel_categorias_servicios` ON `rel_servicios_categorias` (`categoria_id`,`servicio_id`);
