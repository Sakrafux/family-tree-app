package main

import (
	"fmt"
	"log"
	"os"

	"github.com/kuzudb/go-kuzu"
)

const DB_PATH string = "./dbsetup/example.kuzu"

func main() {
	log.Println("Accessing database...")
	if _, err := os.Stat(DB_PATH); err != nil {
		panic(err)
	}

	systemConfig := kuzu.DefaultSystemConfig()
	systemConfig.BufferPoolSize = 1024 * 1024 * 50 // 50 MB buffer
	db, err := kuzu.OpenDatabase(DB_PATH, systemConfig)
	if err != nil {
		panic(err)
	}
	defer db.Close()

	conn, err := kuzu.OpenConnection(db)
	if err != nil {
		panic(err)
	}
	defer conn.Close()

	query := "MATCH (a:Person)-[e:IS_MARRIED]-(b:Person) RETURN a.first_name + \" \" + a.last_name, e.since, e.until, b.first_name + \" \" + b.last_name"
	result, err := conn.Query(query)
	if err != nil {
		panic(err)
	}
	defer result.Close()
	for result.HasNext() {
		tuple, err := result.Next()
		if err != nil {
			panic(err)
		}
		defer tuple.Close()
		// The result is a tuple, which can be converted to a slice.
		slice, err := tuple.GetAsSlice()
		if err != nil {
			panic(err)
		}
		fmt.Println(slice)
	}
}
