package main

import (
	"database/sql"
	"flag"
	"fmt"
	"log"
	"os"

	"github.com/kuzudb/go-kuzu"
	_ "modernc.org/sqlite"
)

const DB_KUZU_PATH string = "./example.kuzu"
const DB_SQLITE_PATH string = "./example.sqlite"
const DATA_PATH_PREFIX string = "../../../data"

func main() {
	dbKuzuPath := flag.String("db-kuzu-path", DB_KUZU_PATH, "Path to kuzu database file")
	dbSqlitePath := flag.String("db-sqlite-path", DB_SQLITE_PATH, "Path to sqlite database file")
	dataPathPrefix := flag.String("data-path-prefix", DATA_PATH_PREFIX, "Path prefix for data")
	flag.Parse()

	initKuzu(*dbKuzuPath, *dataPathPrefix)
	initSqlite(*dbSqlitePath)
}

func initKuzu(dbPath string, dataPathPrefix string) {
	log.Println("[kuzu] Setting up database...")
	if _, err := os.Stat(dbPath); err == nil {
		log.Println("[kuzu] Database already exists")
		return
	}
	// TODO possibly extend this program to deal with migrations for future extensions

	log.Println("[kuzu] Creating database...")
	systemConfig := kuzu.DefaultSystemConfig()
	systemConfig.BufferPoolSize = 1024 * 1024 * 50 // 50 MB buffer
	db, err := kuzu.OpenDatabase(dbPath, systemConfig)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()
	log.Println("[kuzu] Database created")

	log.Println("[kuzu] Connecting to database...")
	conn, err := kuzu.OpenConnection(db)
	if err != nil {
		log.Fatal(err)
	}
	defer conn.Close()
	log.Println("[kuzu] Connected to database")

	log.Println("[kuzu] Creating tables...")
	queries := []string{
		`CREATE NODE TABLE Person (
			id UUID PRIMARY KEY,
			first_name STRING,
			middle_name STRING,
			last_name STRING,
			birth_name STRING,
			gender STRING,
			is_dead BOOLEAN,
			birth_date_year INT,
			birth_date_month INT,
			birth_date_day INT,
			death_date_year INT,
			death_date_month INT,
			death_date_day INT
		)`,
		`CREATE REL TABLE IS_PARENT_OF(FROM Person TO Person)`,
		`CREATE REL TABLE IS_MARRIED(
			FROM Person TO Person,
			since_year INT,
			since_month INT,
			since_day INT,
			until_year INT,
			until_month INT,
			until_day INT
		)`,
		`CREATE REL TABLE IS_SIBLING(FROM Person TO Person, is_half BOOLEAN)`,
		fmt.Sprintf("COPY Person FROM \"%s/people.csv\" (HEADER=true)", dataPathPrefix),
		fmt.Sprintf("COPY IS_PARENT_OF FROM \"%s/parent-relations.csv\" (HEADER=true)", dataPathPrefix),
		fmt.Sprintf("COPY IS_MARRIED FROM \"%s/marriage-relations.csv\" (HEADER=true)", dataPathPrefix),
	}
	for _, query := range queries {
		queryResult, err := conn.Query(query)
		if err != nil {
			log.Fatal(err)
		}
		defer queryResult.Close()
	}
	log.Println("[kuzu] Tables created")

	log.Println("[kuzu] Inferring sibling relationships...")
	queryResult, err := conn.Query(`
		MATCH (p1:Person)<-[:IS_PARENT_OF]-(parent)-[:IS_PARENT_OF]->(p2:Person)
		WHERE id(p1) < id(p2)
		WITH p1, p2, collect(DISTINCT parent) AS parents
		MERGE (p1)-[s:IS_SIBLING]->(p2)
		  SET s.is_half = CASE 
							WHEN size(parents) = 1 THEN true 
							ELSE false 
						  END;
	`)
	if err != nil {
		log.Fatal(err)
	}
	defer queryResult.Close()
	log.Println("[kuzu] Sibling relationships inferred")

	log.Println("[kuzu] Setup complete")
}

func initSqlite(dbPath string) {
	log.Println("[sqlite] Setting up database...")
	if _, err := os.Stat(dbPath); err == nil {
		log.Println("[sqlite] Database already exists")
		return
	}

	log.Println("[sqlite] Creating database...")
	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()
	log.Println("[sqlite] Database created")

	log.Println("[sqlite] Creating tables...")
	if _, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS feedback (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			text TEXT NOT NULL,
			creation_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
			is_resolved INTEGER DEFAULT 0
		);
	`); err != nil {
		log.Fatal(err)
	}
	log.Println("[sqlite] Tables created")

	log.Println("[sqlite] Setup complete")
}
