package main

import (
	"flag"

	"github.com/Sakrafux/family-tree/backend/internal"
)

const DB_PATH string = "../dbsetup/example.kuzu"
const PORT string = ":8080"

func main() {
	dbPath := flag.String("db-path", DB_PATH, "Path to kuzu database file")
	flag.Parse()

	app := internal.NewApp(&internal.AppConfig{
		DB_PATH: *dbPath,
		PORT:    PORT,
	})
	app.Start()
}
