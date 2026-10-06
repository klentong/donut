PRAGMA foreign_keys=OFF;

BEGIN TRANSACTION;

CREATE TABLE categories(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,created_at TEXT DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE donuts(id INTEGER PRIMARY KEY AUTOINCREMENT,category_id INTEGER NOT NULL REFERENCES categories(id),name TEXT NOT NULL,description TEXT,price REAL NOT NULL,stock INTEGER NOT NULL DEFAULT 0,image TEXT,status TEXT NOT NULL DEFAULT 'available' CHECK(status IN('available','unavailable','archived')),created_at TEXT DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE order_items(id INTEGER PRIMARY KEY AUTOINCREMENT,order_id INTEGER NOT NULL REFERENCES orders(id),donut_id INTEGER NOT NULL REFERENCES donuts(id),quantity INTEGER NOT NULL,price REAL NOT NULL,subtotal REAL NOT NULL);

CREATE TABLE orders(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL REFERENCES users(id),total_amount REAL NOT NULL,payment_method TEXT,delivery_address TEXT,contact_number TEXT,order_status TEXT NOT NULL DEFAULT 'Pending',created_at TEXT DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE users(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,email TEXT UNIQUE NOT NULL,password TEXT NOT NULL,phone TEXT,address TEXT,role TEXT NOT NULL DEFAULT 'customer' CHECK(role IN('customer','admin')),status TEXT NOT NULL DEFAULT 'active',created_at TEXT DEFAULT CURRENT_TIMESTAMP);

INSERT INTO "categories" ("id", "name", "created_at") VALUES (1, 'Classic', '2026-10-06 12:37:05');

INSERT INTO "categories" ("id", "name", "created_at") VALUES (2, 'Chocolate', '2026-10-06 12:37:05');

INSERT INTO "categories" ("id", "name", "created_at") VALUES (3, 'Strawberry', '2026-10-06 12:37:05');

INSERT INTO "categories" ("id", "name", "created_at") VALUES (4, 'Cream', '2026-10-06 12:37:05');

INSERT INTO "categories" ("id", "name", "created_at") VALUES (5, 'Premium', '2026-10-06 12:37:05');

INSERT INTO "categories" ("id", "name", "created_at") VALUES (6, 'Special', '2026-10-06 12:37:05');

INSERT INTO "donuts" ("id", "category_id", "name", "description", "price", "stock", "image", "status", "created_at") VALUES (1, 2, 'Chocolate Donut', 'Rich chocolate glaze', 45, 20, '🍫', 'available', '2026-10-06 12:37:05');

INSERT INTO "donuts" ("id", "category_id", "name", "description", "price", "stock", "image", "status", "created_at") VALUES (2, 3, 'Strawberry Donut', 'Pink strawberry icing', 50, 15, '🍓', 'available', '2026-10-06 12:37:05');

INSERT INTO "donuts" ("id", "category_id", "name", "description", "price", "stock", "image", "status", "created_at") VALUES (3, 1, 'Glazed Donut', 'Classic sugar glaze', 40, 30, '🍩', 'available', '2026-10-06 12:37:05');

INSERT INTO "donuts" ("id", "category_id", "name", "description", "price", "stock", "image", "status", "created_at") VALUES (4, 6, 'Matcha Donut', 'Green tea glaze', 55, 12, '🍵', 'available', '2026-10-06 12:37:05');

INSERT INTO "donuts" ("id", "category_id", "name", "description", "price", "stock", "image", "status", "created_at") VALUES (5, 4, 'Cookies & Cream', 'Crushed cookies on cream', 60, 14, '🍪', 'available', '2026-10-06 12:37:05');

INSERT INTO "donuts" ("id", "category_id", "name", "description", "price", "stock", "image", "status", "created_at") VALUES (6, 4, 'Bavarian Cream', 'Custard-filled', 55, 16, '🥮', 'available', '2026-10-06 12:37:05');

INSERT INTO "donuts" ("id", "category_id", "name", "description", "price", "stock", "image", "status", "created_at") VALUES (7, 5, 'Blueberry Donut', 'Blueberry filling', 58, 10, '🫐', 'available', '2026-10-06 12:37:05');

INSERT INTO "donuts" ("id", "category_id", "name", "description", "price", "stock", "image", "status", "created_at") VALUES (8, 5, 'Caramel Donut', 'Salted caramel drizzle', 52, 18, '🍯', 'available', '2026-10-06 12:37:05');

INSERT INTO "users" ("id", "name", "email", "password", "phone", "address", "role", "status", "created_at") VALUES (1, 'Admin', 'admin@donutshop.com', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', '0000000', 'Shop', 'admin', 'active', '2026-10-06 12:37:05');

INSERT INTO "users" ("id", "name", "email", "password", "phone", "address", "role", "status", "created_at") VALUES (2, 'klent', 'klent@gmail.com', 'b28530ace0e97741a826f5754acda3faa21f9c4fd788b03d43bd942988cf1a25', '09858622336', 'mandaue', 'customer', 'active', '2026-10-06 12:57:50');

DELETE FROM sqlite_sequence;

INSERT INTO sqlite_sequence (name, seq) VALUES ('users', 2);

INSERT INTO sqlite_sequence (name, seq) VALUES ('categories', 6);

INSERT INTO sqlite_sequence (name, seq) VALUES ('donuts', 8);

COMMIT;

PRAGMA foreign_keys=ON;
