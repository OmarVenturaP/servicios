CREATE TABLE `dat_contactos_emergencia` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ciudad_id` int NOT NULL,
	`nombre` varchar(160) NOT NULL,
	`slug` varchar(160) NOT NULL,
	`tipo` varchar(40) NOT NULL,
	`telefono` varchar(30) NOT NULL,
	`extension` varchar(10),
	`descripcion_emergencia` text,
	`horario_texto` varchar(255),
	`fuente_url` varchar(500),
	`verificado_at` timestamp,
	`visible` boolean NOT NULL DEFAULT false,
	`orden` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dat_contactos_emergencia_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_emergencias_ciudad_slug` UNIQUE(`ciudad_id`,`slug`)
);
--> statement-breakpoint
ALTER TABLE `dat_contactos_emergencia` ADD CONSTRAINT `dat_contactos_emergencia_ciudad_id_cat_ciudades_id_fk` FOREIGN KEY (`ciudad_id`) REFERENCES `cat_ciudades`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX `idx_emergencias_publicacion` ON `dat_contactos_emergencia` (`ciudad_id`,`visible`,`orden`);
