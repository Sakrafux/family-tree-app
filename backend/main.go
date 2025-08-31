package main

import (
	"github.com/Sakrafux/family-tree/backend/internal"
)

const DB_PATH string = "./dbsetup/example.kuzu"
const PORT string = "8080"

func main() {
	app := internal.NewApp()
	app.ConnectToDatabase(DB_PATH)
	defer app.CloseDatabase()
	app.Serve(PORT)
}
