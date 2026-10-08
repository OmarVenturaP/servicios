CREATE TABLE `cat_categorias` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nombre` varchar(120) NOT NULL,
	`slug` varchar(120) NOT NULL,
	`icono` varchar(40) NOT NULL,
	`requiere_unidades` boolean NOT NULL DEFAULT false,
	`activo` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cat_categorias_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_cat_categorias_slug` UNIQUE(`slug`)
);
--> statement-breakpoint
ALTER TABLE `log_contactos` MODIFY COLUMN `precio_mostrado` decimal(10,2);--> statement-breakpoint
INSERT INTO `cat_categorias` (`nombre`, `slug`, `icono`, `requiere_unidades`, `activo`) VALUES ('Mandados', 'mandados', 'bike', true, true), ('A/C', 'aire-acondicionado', 'snowflake', false, true);--> statement-breakpoint
ALTER TABLE `dat_servicios` ADD `categoria_id` int;--> statement-breakpoint
ALTER TABLE `dat_servicios` ADD `pago_efectivo` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `dat_servicios` ADD `pago_tarjeta` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `dat_servicios` ADD `pago_transferencia` boolean DEFAULT false NOT NULL;--> statement-breakpoint
UPDATE `dat_servicios` SET `categoria_id` = (SELECT `id` FROM `cat_categorias` WHERE `slug` = 'mandados') WHERE `categoria_id` IS NULL;--> statement-breakpoint
ALTER TABLE `dat_servicios` MODIFY COLUMN `categoria_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `dat_servicios` ADD CONSTRAINT `dat_servicios_categoria_id_cat_categorias_id_fk` FOREIGN KEY (`categoria_id`) REFERENCES `cat_categorias`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX `idx_dat_servicios_categoria` ON `dat_servicios` (`ciudad_id`,`categoria_id`,`visible`);
