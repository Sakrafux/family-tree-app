package db

import (
	"github.com/google/uuid"
	"github.com/kuzudb/go-kuzu"
)

func GetGraphDistancesForRootById(conn *kuzu.Connection, id uuid.UUID) ([]*GraphDistance, error) {
	query := `
	MATCH (root:Person {id: UUID($id)})-[r* SHORTEST]-(other:Person)
	RETURN other.id AS id, length(r) AS distance
	ORDER BY distance
	`
	return executePreparedStatement(conn, query, map[string]any{"id": id.String()}, CastGraphDistance)
}
