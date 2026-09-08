CREATE TABLE `dat_horarios_unidad` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unidad_id` int NOT NULL,
	`dia_semana` tinyint NOT NULL,
	`bloque` tinyint NOT NULL,
	`hora_inicio` time NOT NULL,
	`hora_fin` time NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dat_horarios_unidad_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_horario_unidad_dia_bloque` UNIQUE(`unidad_id`,`dia_semana`,`bloque`)
);
--> statement-breakpoint
ALTER TABLE `cat_ciudades` ADD `zona_horaria` varchar(80) DEFAULT 'America/Mexico_City' NOT NULL;--> statement-breakpoint
ALTER TABLE `dat_unidades` ADD `modo_disponibilidad` enum('manual','programado') DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE `dat_unidades` ADD `excepcion_estado` enum('disponible','ocupado','no_disponible');--> statement-breakpoint
ALTER TABLE `dat_unidades` ADD `excepcion_hasta` timestamp;--> statement-breakpoint
ALTER TABLE `dat_horarios_unidad` ADD CONSTRAINT `dat_horarios_unidad_unidad_id_dat_unidades_id_fk` FOREIGN KEY (`unidad_id`) REFERENCES `dat_unidades`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX `idx_horario_unidad_dia` ON `dat_horarios_unidad` (`unidad_id`,`dia_semana`);