CREATE TABLE `log_eventos_analitica` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ciudad_id` int NOT NULL,
	`servicio_id` int,
	`session_id` varchar(36) NOT NULL,
	`evento` enum('service_impression','service_interaction','search','filter_change') NOT NULL,
	`result_position` int,
	`valor` varchar(160),
	`tipo_trafico` enum('publico','interno','sin_clasificar'),
	`origen` varchar(255),
	`utm_source` varchar(120),
	`utm_medium` varchar(120),
	`utm_campaign` varchar(160),
	`utm_content` varchar(160),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `log_eventos_analitica_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `log_contactos` ADD `result_position` int;--> statement-breakpoint
ALTER TABLE `log_contactos` ADD `tipo_trafico` enum('publico','interno','sin_clasificar');--> statement-breakpoint
ALTER TABLE `log_contactos` ADD `origen` varchar(255);--> statement-breakpoint
ALTER TABLE `log_contactos` ADD `utm_source` varchar(120);--> statement-breakpoint
ALTER TABLE `log_contactos` ADD `utm_medium` varchar(120);--> statement-breakpoint
ALTER TABLE `log_contactos` ADD `utm_campaign` varchar(160);--> statement-breakpoint
ALTER TABLE `log_contactos` ADD `utm_content` varchar(160);--> statement-breakpoint
ALTER TABLE `log_visitas` ADD `tipo_trafico` enum('publico','interno','sin_clasificar');--> statement-breakpoint
ALTER TABLE `log_visitas` ADD `utm_source` varchar(120);--> statement-breakpoint
ALTER TABLE `log_visitas` ADD `utm_medium` varchar(120);--> statement-breakpoint
ALTER TABLE `log_visitas` ADD `utm_campaign` varchar(160);--> statement-breakpoint
ALTER TABLE `log_visitas` ADD `utm_content` varchar(160);--> statement-breakpoint
ALTER TABLE `log_eventos_analitica` ADD CONSTRAINT `log_eventos_analitica_ciudad_id_cat_ciudades_id_fk` FOREIGN KEY (`ciudad_id`) REFERENCES `cat_ciudades`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `log_eventos_analitica` ADD CONSTRAINT `log_eventos_analitica_servicio_id_dat_servicios_id_fk` FOREIGN KEY (`servicio_id`) REFERENCES `dat_servicios`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX `idx_eventos_ciudad_fecha` ON `log_eventos_analitica` (`ciudad_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_eventos_servicio_fecha` ON `log_eventos_analitica` (`servicio_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_eventos_session_evento_fecha` ON `log_eventos_analitica` (`session_id`,`evento`,`created_at`);