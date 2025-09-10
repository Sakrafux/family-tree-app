package db

import (
	"github.com/google/uuid"
	"github.com/kuzudb/go-kuzu"
)

func GetAllPersons(conn *kuzu.Connection) ([]*Person, error) {
	query := `
	MATCH (a:Person)
	RETURN a.id as id, a.first_name as first_name, a.middle_name as middle_name, a.last_name as last_name, 
		a.birth_name as birth_name, a.gender as gender, a.is_dead as is_dead, 
		a.birth_date_year as birth_date_year, a.birth_date_month as birth_date_month, a.birth_date_day as birth_date_day,
		a.death_date_year as death_date_year, a.death_date_month as death_date_month, a.death_date_day as death_date_day
	`
	return executeQuery(conn, query, CastPerson)
}

func GetAllMarriageRelations(conn *kuzu.Connection) ([]*MarriageRelation, error) {
	query := `
	MATCH (a:Person)-[e:IS_MARRIED]->(b:Person)
	RETURN a.id as Person1Id, b.id as Person2Id, 
		e.since_year as since_year, e.since_month as since_month, e.since_day as since_day,
		e.until_year as until_year, e.until_month as until_month, e.until_day as until_day
	`
	return executeQuery(conn, query, CastMarriageRelation)
}

func GetAllParentRelations(conn *kuzu.Connection) ([]*ParentRelation, error) {
	query := `
	MATCH (a:Person)-[e:IS_PARENT_OF]->(b:Person)
	RETURN a.id as ParentId, b.id as ChildId
	`
	return executeQuery(conn, query, CastParentRelation)
}

func GetAllSiblingRelations(conn *kuzu.Connection) ([]*SiblingRelation, error) {
	query := `
	MATCH (a:Person)-[e:IS_SIBLING]->(b:Person)
	RETURN a.id as Person1Id, b.id as Person2Id, e.is_half as is_half
	`
	return executeQuery(conn, query, CastSiblingRelation)
}

func GetGraphDistancesForRootById(conn *kuzu.Connection, id uuid.UUID) ([]*GraphDistance, error) {
	query := `
	MATCH (root:Person {id: UUID($id)})-[r* SHORTEST]-(other:Person)
	RETURN other.id AS id, length(r) AS distance
	ORDER BY distance
	`
	return executePreparedStatement(conn, query, map[string]any{"id": id.String()}, CastGraphDistance)
}
