package main

import (
	"database/sql"
	"flag"
	"fmt"
	"log"
	"os"
	"path"
	"slices"
	"strconv"
	"strings"

	"github.com/kuzudb/go-kuzu"
	"github.com/samber/lo"
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
	initSqlite(*dbSqlitePath, *dataPathPrefix)
}

func publicOrPrivateData(dataPath string) string {
	privatePath := path.Join(dataPath, "private")
	entries, err := os.ReadDir(privatePath)
	if err != nil || len(entries) == 0 {
		return dataPath
	}
	return privatePath
}

func initKuzu(dbPath string, dataPathPrefix string) {
	log.Println("[kuzu] Setting up database...")
	if _, err := os.Stat(dbPath); err == nil {
		log.Println("[kuzu] Database already exists")
	} else {
		log.Println("[kuzu] Creating database...")
	}
	dataPathPrefix = publicOrPrivateData(dataPathPrefix)

	systemConfig := kuzu.DefaultSystemConfig()
	systemConfig.BufferPoolSize = 1024 * 1024 * 50 // 50 MB buffer
	db, err := kuzu.OpenDatabase(dbPath, systemConfig)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	log.Println("[kuzu] Connecting to database...")
	conn, err := kuzu.OpenConnection(db)
	if err != nil {
		log.Fatal(err)
	}
	defer conn.Close()
	log.Println("[kuzu] Connected to database")

	log.Println("[kuzu] Starting migrations...")
	entries, err := os.ReadDir("./migrations/kuzu")
	if err != nil {
		log.Fatal(err)
	}

	dbPathParts := strings.Split(dbPath, "/")
	migFilePath := strings.Join(dbPathParts[:len(dbPathParts)-1], "/")
	lastMigration := 0
	data, err := os.ReadFile(migFilePath + "/migration-version-kuzu.txt")
	if err != nil {
		if !os.IsNotExist(err) {
			log.Fatal(err)
		}
	} else if number, err := strconv.Atoi(string(data)); err == nil {
		lastMigration = number
	}

	fileNames := make(map[int]string)
	for _, entry := range entries {
		if !entry.IsDir() {
			if number, err := strconv.Atoi(strings.Split(entry.Name(), "_")[0]); err == nil {
				fileNames[number] = entry.Name()
			}
		}
	}
	keys := lo.Keys(fileNames)
	slices.Sort(keys)

	for _, key := range keys {
		fileName := fileNames[key]
		log.Println("[kuzu] Applying " + fileName + "...")
		if key <= lastMigration {
			log.Println("[kuzu] Already applied " + fileName)
			continue
		}

		rawQuery, err := os.ReadFile("./migrations/kuzu/" + fileName)
		if err != nil {
			log.Fatal(err)
		}

		query := string(rawQuery)
		query = strings.Replace(query, "${dataPathPrefix}", dataPathPrefix, -1)

		queryResult, err := conn.Query(query)
		if err != nil {
			log.Fatal(err)
		}
		defer queryResult.Close()
		log.Println("[kuzu] Applied " + fileName)

		err = os.WriteFile(migFilePath+"/migration-version-kuzu.txt", []byte(fmt.Sprintf("%d", key)), 0644)
		if err != nil {
			log.Fatal(err)
		}
	}

	log.Println("[kuzu] Setup complete")
}

func initSqlite(dbPath string, dataPathPrefix string) {
	log.Println("[sqlite] Setting up database...")
	if _, err := os.Stat(dbPath); err == nil {
		log.Println("[sqlite] Database already exists")
	} else {
		log.Println("[sqlite] Creating database...")
	}

	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	log.Println("[sqlite] Starting migrations...")
	entries, err := os.ReadDir("./migrations/sql")
	if err != nil {
		log.Fatal(err)
	}

	dbPathParts := strings.Split(dbPath, "/")
	migFilePath := strings.Join(dbPathParts[:len(dbPathParts)-1], "/")
	lastMigration := 0
	data, err := os.ReadFile(migFilePath + "/migration-version-sqlite.txt")
	if err != nil {
		if !os.IsNotExist(err) {
			log.Fatal(err)
		}
	} else if number, err := strconv.Atoi(string(data)); err == nil {
		lastMigration = number
	}

	fileNames := make(map[int]string)
	for _, entry := range entries {
		if !entry.IsDir() {
			if number, err := strconv.Atoi(strings.Split(entry.Name(), "_")[0]); err == nil {
				fileNames[number] = entry.Name()
			}
		}
	}
	keys := lo.Keys(fileNames)
	slices.Sort(keys)

	userInserts := createUserValues(dataPathPrefix)

	for _, key := range keys {
		fileName := fileNames[key]
		log.Println("[sqlite] Applying " + fileName + "...")
		if key <= lastMigration {
			log.Println("[sqlite] Already applied " + fileName)
			continue
		}

		rawQuery, err := os.ReadFile("./migrations/sql/" + fileName)
		if err != nil {
			log.Fatal(err)
		}

		query := string(rawQuery)
		query = strings.Replace(query, "${users}", userInserts, -1)

		if _, err = db.Exec(query); err != nil {
			log.Fatal(err)
		}
		log.Println("[sqlite] Applied " + fileName)

		err = os.WriteFile(migFilePath+"/migration-version-sqlite.txt", []byte(fmt.Sprintf("%d", key)), 0644)
		if err != nil {
			log.Fatal(err)
		}
	}
	log.Println("[sqlite] Setup complete")
}
