package db

import (
	"log"
	"os"

	"github.com/kuzudb/go-kuzu"
)

func ConnectToDatabase(path string) (*kuzu.Database, *kuzu.Connection) {
	log.Println("Connecting to database...")
	if _, err := os.Stat(path); err != nil {
		log.Println("Database does not exist")
		log.Fatal(err)
	}

	systemConfig := kuzu.DefaultSystemConfig()
	systemConfig.BufferPoolSize = 1024 * 1024 * 50 // 50 MB buffer
	db, err := kuzu.OpenDatabase(path, systemConfig)
	if err != nil {
		log.Fatal(err)
	}

	conn, err := kuzu.OpenConnection(db)
	if err != nil {
		log.Fatal(err)
	}
	log.Println("Successfully connected to database")

	return db, conn
}
