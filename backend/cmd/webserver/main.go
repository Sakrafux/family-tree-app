package main

import (
	"flag"

	"github.com/Sakrafux/family-tree-app/backend/internal"
)

const DB_KUZU_PATH string = "../dbsetup/example.kuzu"
const DB_SQLITE_PATH string = "../dbsetup/example.sqlite"
const PORT string = ":8080"

func main() {
	dbKuzuPath := flag.String("db-kuzu-path", DB_KUZU_PATH, "Path to kuzu database file")
	dbSqlitePath := flag.String("db-sqlite-path", DB_SQLITE_PATH, "Path to sqlite database file")
	flag.Parse()

	app := internal.NewApp(&internal.AppConfig{
		DB_KUZU_PATH:   *dbKuzuPath,
		DB_SQLITE_PATH: *dbSqlitePath,
		PORT:           PORT,
	})
	app.Start()
}
