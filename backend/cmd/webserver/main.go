package main

import (
	"github.com/Sakrafux/family-tree/backend/internal"
	"github.com/Sakrafux/family-tree/backend/internal/server"
)

const DB_PATH string = "../dbsetup/example.kuzu"
const PORT string = ":8080"

func main() {
	app := internal.NewApp(&server.Config{
		DB_PATH: DB_PATH,
		PORT:    PORT,
	})
	app.Start()
}
