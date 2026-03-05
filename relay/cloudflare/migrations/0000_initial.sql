CREATE TABLE `api_keys` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`key_hash` text NOT NULL,
	`prefix` text NOT NULL,
	`name` text NOT NULL,
	`last_used_at` text,
	`revoked_at` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tunnel_configs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`port` integer NOT NULL,
	`subdomain` text,
	`domain` text DEFAULT 'workslocal.exposed' NOT NULL,
	`local_host` text DEFAULT 'localhost' NOT NULL,
	`headers` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tunnel_domains` (
	`id` text PRIMARY KEY NOT NULL,
	`domain` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`added_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tunnel_domains_domain_unique` ON `tunnel_domains` (`domain`);--> statement-breakpoint
CREATE TABLE `tunnels` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`subdomain` text NOT NULL,
	`domain` text DEFAULT 'workslocal.exposed' NOT NULL,
	`reserved` integer DEFAULT true NOT NULL,
	`last_activity` text DEFAULT (datetime('now')),
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tunnels_subdomain_domain_idx` ON `tunnels` (`subdomain`,`domain`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`default_domain` text DEFAULT 'workslocal.exposed' NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
