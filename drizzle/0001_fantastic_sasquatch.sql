CREATE TABLE `cat_ciudades` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nombre` varchar(120) NOT NULL,
	`slug` varchar(120) NOT NULL,
	`estado` varchar(120) NOT NULL,
	`pais` varchar(120) NOT NULL,
	`activo` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cat_ciudades_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_cat_ciudades_slug` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `cat_estados_unidad` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clave` varchar(40) NOT NULL,
	`nombre` varchar(80) NOT NULL,
	`activo` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cat_estados_unidad_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_cat_estados_unidad_clave` UNIQUE(`clave`)
);
--> statement-breakpoint
CREATE TABLE `cat_modos_contacto` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clave` varchar(40) NOT NULL,
	`nombre` varchar(80) NOT NULL,
	`activo` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cat_modos_contacto_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_cat_modos_contacto_clave` UNIQUE(`clave`)
);
--> statement-breakpoint
CREATE TABLE `dat_servicios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ciudad_id` int NOT NULL,
	`modo_contacto_id` int NOT NULL,
	`nombre` varchar(160) NOT NULL,
	`slug` varchar(160) NOT NULL,
	`telefono` varchar(30),
	`whatsapp` varchar(30),
	`descripcion` text,
	`cobertura_texto` text,
	`logo_url` varchar(500),
	`visible` boolean NOT NULL DEFAULT true,
	`participa_piloto` boolean NOT NULL DEFAULT false,
	`fuente` varchar(80),
	`notas` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dat_servicios_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_dat_servicios_ciudad_slug` UNIQUE(`ciudad_id`,`slug`)
);
--> statement-breakpoint
CREATE TABLE `dat_unidades` (
	`id` int AUTO_INCREMENT NOT NULL,
	`servicio_id` int NOT NULL,
	`nombre` varchar(120),
	`telefono` varchar(30),
	`whatsapp` varchar(30),
	`precio_base` decimal(10,2) NOT NULL,
	`estado_id` int NOT NULL,
	`estado_actualizado_at` timestamp NOT NULL DEFAULT (now()),
	`estado_hasta` timestamp,
	`token_hash` char(64) NOT NULL,
	`activo` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dat_unidades_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_dat_unidades_token_hash` UNIQUE(`token_hash`)
);
--> statement-breakpoint
CREATE TABLE `log_contactos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`servicio_id` int NOT NULL,
	`unidad_id` int,
	`ciudad_id` int NOT NULL,
	`session_id` varchar(36) NOT NULL,
	`canal` enum('whatsapp','llamada') NOT NULL,
	`precio_mostrado` decimal(10,2) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `log_contactos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `log_estados_unidad` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unidad_id` int NOT NULL,
	`estado_id` int NOT NULL,
	`estado_hasta` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `log_estados_unidad_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `log_visitas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ciudad_id` int NOT NULL,
	`session_id` varchar(36) NOT NULL,
	`origen` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `log_visitas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
DROP TABLE `services`;--> statement-breakpoint
ALTER TABLE `dat_servicios` ADD CONSTRAINT `dat_servicios_ciudad_id_cat_ciudades_id_fk` FOREIGN KEY (`ciudad_id`) REFERENCES `cat_ciudades`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `dat_servicios` ADD CONSTRAINT `dat_servicios_modo_contacto_id_cat_modos_contacto_id_fk` FOREIGN KEY (`modo_contacto_id`) REFERENCES `cat_modos_contacto`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `dat_unidades` ADD CONSTRAINT `dat_unidades_servicio_id_dat_servicios_id_fk` FOREIGN KEY (`servicio_id`) REFERENCES `dat_servicios`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `dat_unidades` ADD CONSTRAINT `dat_unidades_estado_id_cat_estados_unidad_id_fk` FOREIGN KEY (`estado_id`) REFERENCES `cat_estados_unidad`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `log_contactos` ADD CONSTRAINT `log_contactos_servicio_id_dat_servicios_id_fk` FOREIGN KEY (`servicio_id`) REFERENCES `dat_servicios`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `log_contactos` ADD CONSTRAINT `log_contactos_unidad_id_dat_unidades_id_fk` FOREIGN KEY (`unidad_id`) REFERENCES `dat_unidades`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `log_contactos` ADD CONSTRAINT `log_contactos_ciudad_id_cat_ciudades_id_fk` FOREIGN KEY (`ciudad_id`) REFERENCES `cat_ciudades`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `log_estados_unidad` ADD CONSTRAINT `log_estados_unidad_unidad_id_dat_unidades_id_fk` FOREIGN KEY (`unidad_id`) REFERENCES `dat_unidades`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `log_estados_unidad` ADD CONSTRAINT `log_estados_unidad_estado_id_cat_estados_unidad_id_fk` FOREIGN KEY (`estado_id`) REFERENCES `cat_estados_unidad`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `log_visitas` ADD CONSTRAINT `log_visitas_ciudad_id_cat_ciudades_id_fk` FOREIGN KEY (`ciudad_id`) REFERENCES `cat_ciudades`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX `idx_dat_servicios_modo_contacto` ON `dat_servicios` (`modo_contacto_id`);--> statement-breakpoint
CREATE INDEX `idx_dat_servicios_publicos` ON `dat_servicios` (`ciudad_id`,`visible`);--> statement-breakpoint
CREATE INDEX `idx_dat_unidades_servicio` ON `dat_unidades` (`servicio_id`);--> statement-breakpoint
CREATE INDEX `idx_dat_unidades_disponibilidad` ON `dat_unidades` (`estado_id`,`activo`,`estado_hasta`);--> statement-breakpoint
CREATE INDEX `idx_log_contactos_servicio_fecha` ON `log_contactos` (`servicio_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_log_contactos_unidad` ON `log_contactos` (`unidad_id`);--> statement-breakpoint
CREATE INDEX `idx_log_contactos_ciudad_fecha` ON `log_contactos` (`ciudad_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_log_contactos_session` ON `log_contactos` (`session_id`);--> statement-breakpoint
CREATE INDEX `idx_log_estados_unidad_unidad_fecha` ON `log_estados_unidad` (`unidad_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_log_estados_unidad_estado` ON `log_estados_unidad` (`estado_id`);--> statement-breakpoint
CREATE INDEX `idx_log_visitas_ciudad_fecha` ON `log_visitas` (`ciudad_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_log_visitas_session` ON `log_visitas` (`session_id`);