CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    password TEXT NOT NULL,
    salt BLOB NOT NULL,
    role TEXT NOT NULL,
    node TEXT NOT NULL
);

INSERT INTO users(name, password, salt, role, node) VALUES ${users};