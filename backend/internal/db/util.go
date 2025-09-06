package db

import "github.com/kuzudb/go-kuzu"

func executeQuery[R any](conn *kuzu.Connection, query string, mapper func(map[string]any) R) ([]R, error) {
	result, err := conn.Query(query)
	if err != nil {
		return nil, err
	}
	defer result.Close()

	items := make([]R, 0)
	for result.HasNext() {
		tuple, err := result.Next()
		if err != nil {
			return nil, err
		}
		defer tuple.Close()

		valueMap, err := tuple.GetAsMap()
		if err != nil {
			return nil, err
		}
		items = append(items, mapper(valueMap))
	}

	return items, nil
}

func executeQuerySingle[R any](conn *kuzu.Connection, query string, mapper func(map[string]any) R) (R, error) {
	var null R
	result, err := executeQuery(conn, query, mapper)
	if err != nil {
		return null, err
	}

	if len(result) == 0 {
		return null, nil
	}

	return result[0], nil
}
