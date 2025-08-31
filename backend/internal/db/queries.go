package db

import (
	"github.com/kuzudb/go-kuzu"
)

func GetAllMarriages(conn *kuzu.Connection) ([]map[string]any, error) {
	query := "MATCH (a:Person)-[e:IS_MARRIED]->(b:Person) RETURN (a.first_name + \" \" + a.last_name) as aName, e.since, e.until, (b.first_name + \" \" + b.last_name) as bName"
	result, err := conn.Query(query)
	if err != nil {
		return nil, err
	}
	defer result.Close()

	maps := make([]map[string]any, 0)
	for result.HasNext() {
		tuple, err := result.Next()
		if err != nil {
			return nil, err
		}
		defer tuple.Close()
		// The result is a tuple, which can be converted to a slice.
		valueMap, err := tuple.GetAsMap()
		if err != nil {
			return nil, err
		}
		maps = append(maps, valueMap)
	}

	return maps, nil
}
