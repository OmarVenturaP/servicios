CREATE TABLE `dat_horarios_servicio` (
	`id` int AUTO_INCREMENT NOT NULL,
	`servicio_id` int NOT NULL,
	`dia_semana` tinyint NOT NULL,
	`bloque` tinyint NOT NULL,
	`hora_inicio` time NOT NULL,
	`hora_fin` time NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dat_horarios_servicio_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_horario_servicio_dia_bloque` UNIQUE(`servicio_id`,`dia_semana`,`bloque`)
);
--> statement-breakpoint
ALTER TABLE `dat_servicios` ADD `informacion_corta` text;--> statement-breakpoint
ALTER TABLE `dat_servicios` ADD `informacion_extendida` text;--> statement-breakpoint
ALTER TABLE `dat_servicios` ADD `modo_operacion` enum('unidades','servicio') DEFAULT 'unidades' NOT NULL;--> statement-breakpoint
UPDATE `dat_servicios` SET `informacion_corta` = `descripcion`, `informacion_extendida` = `descripcion` WHERE `descripcion` IS NOT NULL;--> statement-breakpoint
UPDATE `dat_servicios` s INNER JOIN `cat_categorias` c ON c.id = s.categoria_id SET s.modo_operacion = CASE WHEN c.requiere_unidades = true THEN 'unidades' ELSE 'servicio' END;--> statement-breakpoint
ALTER TABLE `dat_horarios_servicio` ADD CONSTRAINT `dat_horarios_servicio_servicio_id_dat_servicios_id_fk` FOREIGN KEY (`servicio_id`) REFERENCES `dat_servicios`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX `idx_horario_servicio_dia` ON `dat_horarios_servicio` (`servicio_id`,`dia_semana`);
