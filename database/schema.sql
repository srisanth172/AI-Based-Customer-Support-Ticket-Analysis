CREATE TABLE IF NOT EXISTS users (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	email TEXT NOT NULL UNIQUE,
	password_hash TEXT NOT NULL,
	role TEXT NOT NULL DEFAULT 'customer',
	is_verified INTEGER NOT NULL DEFAULT 0,
	created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tickets (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	title TEXT NOT NULL,
	description TEXT NOT NULL,
	category TEXT NOT NULL,
	sentiment TEXT NOT NULL,
	status TEXT NOT NULL DEFAULT 'open',
	is_duplicate INTEGER NOT NULL DEFAULT 0,
	duplicate_of_id INTEGER NULL,
	customer_email TEXT NULL,
	created_at TEXT NOT NULL,
	updated_at TEXT NOT NULL,
	FOREIGN KEY (duplicate_of_id) REFERENCES tickets(id),
	FOREIGN KEY (customer_email) REFERENCES users(email)
);

CREATE TABLE IF NOT EXISTS ticket_history (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	ticket_id INTEGER NOT NULL,
	action TEXT NOT NULL,
	notes TEXT NULL,
	created_at TEXT NOT NULL,
	FOREIGN KEY (ticket_id) REFERENCES tickets(id)
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_ticket_history_ticket_id ON ticket_history(ticket_id);
