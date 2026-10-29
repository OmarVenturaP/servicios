ALTER TABLE `dat_servicios` ADD `token_hash` char(64);--> statement-breakpoint
ALTER TABLE `dat_servicios` ADD CONSTRAINT `uq_dat_servicios_token_hash` UNIQUE(`token_hash`);