package main

import (
	"flag"
	"fmt"
	"log"
	"os"

	"github.com/kuzudb/go-kuzu"
)

const DB_PATH string = "./example.kuzu"
const DATA_PATH_PREFIX string = "../../../data"

func main() {
	dbPath := flag.String("db-path", DB_PATH, "Path to kuzu database file")
	dataPathPrefix := flag.String("data-path-prefix", DATA_PATH_PREFIX, "Path prefix for data")
	flag.Parse()

	log.Println("Setting up database...")
	if _, err := os.Stat(*dbPath); err == nil {
		log.Println("Database already exists")
		os.Exit(0)
	}
	// TODO possibly extend this program to deal with migrations for future extensions

	log.Println("Creating database...")
	systemConfig := kuzu.DefaultSystemConfig()
	systemConfig.BufferPoolSize = 1024 * 1024 * 50 // 50 MB buffer
	db, err := kuzu.OpenDatabase(*dbPath, systemConfig)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()
	log.Println("Database created")

	log.Println("Connecting to database...")
	conn, err := kuzu.OpenConnection(db)
	if err != nil {
		log.Fatal(err)
	}
	defer conn.Close()
	log.Println("Connected to database")

	// Create schema
	log.Println("Creating tables...")
	queries := []string{
		// Use STRING
		`CREATE NODE TABLE Person (
			id UUID PRIMARY KEY,
			first_name STRING,
			last_name STRING,
			birth_name STRING,
			gender STRING,
			dead BOOLEAN,
			birth_date DATE,
			death_date DATE
		)`,
		`CREATE REL TABLE IS_PARENT(FROM Person TO Person, adopted BOOLEAN)`,
		`CREATE REL TABLE IS_MARRIED(
			FROM Person TO Person,
			since DATE,
			until DATE
		)`,
		fmt.Sprintf("COPY Person FROM \"%s/people.csv\" (HEADER=true)", *dataPathPrefix),
		fmt.Sprintf("COPY IS_PARENT FROM \"%s/parent-relations.csv\" (HEADER=true)", *dataPathPrefix),
		fmt.Sprintf("COPY IS_MARRIED FROM \"%s/marriage-relations.csv\" (HEADER=true)", *dataPathPrefix),
	}
	for _, query := range queries {
		queryResult, err := conn.Query(query)
		if err != nil {
			log.Fatal(err)
		}
		defer queryResult.Close()
	}
	log.Println("Tables created")
	log.Println("Setup complete")
}
