package db

import (
	"log"
	"os"

	"database/sql"

	"github.com/kuzudb/go-kuzu"
	_ "modernc.org/sqlite"
)

func ConnectToKuzu(path string) (*kuzu.Database, *kuzu.Connection) {
	log.Println("[kuzu] Connecting to database...")
	if _, err := os.Stat(path); err != nil {
		log.Println("[kuzu] Database does not exist")
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
	log.Println("[kuzu] Successfully connected to database")

	return db, conn
}

func ConnectToSqlite(path string) *sql.DB {
	log.Println("[sqlite] Connecting to database...")
	if _, err := os.Stat(path); err != nil {
		log.Println("[sqlite] Database does not exist")
		log.Fatal(err)
	}

	db, err := sql.Open("sqlite", path)
	if err != nil {
		log.Fatal(err)
	}
	log.Println("[sqlite] Successfully connected to database")

	return db
}
