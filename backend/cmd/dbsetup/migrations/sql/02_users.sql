CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    password TEXT NOT NULL,
    salt BLOB NOT NULL,
    role TEXT NOT NULL
);

INSERT INTO users(name, password, salt, role) VALUES ${users};