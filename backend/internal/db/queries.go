package db

import (
	"github.com/kuzudb/go-kuzu"
)

func GetAllPersons(conn *kuzu.Connection) ([]*Person, error) {
	query := `
	MATCH (a:Person)
	RETURN a.id as Id, a.first_name as FirstName, a.last_name as LastName, a.birth_name as BirthName, 
		a.gender as Gender, a.dead as Dead, a.birth_date as BirthDate, a.death_date as DeathDate
	`
	return executeQuery(conn, query, CastPerson)
}

func GetAllMarriageRelations(conn *kuzu.Connection) ([]*MarriageRelation, error) {
	query := `
	MATCH (a:Person)-[e:IS_MARRIED]->(b:Person)
	RETURN a.id as Person1Id, b.id as Person2Id, e.since as Since, e.until as Until
	`
	return executeQuery(conn, query, CastMarriageRelation)
}

func GetAllParentRelations(conn *kuzu.Connection) ([]*ParentRelation, error) {
	query := `
	MATCH (a:Person)-[e:IS_PARENT]->(b:Person)
	RETURN a.id as ParentId, b.id as ChildId, e.adopted as Adopted
	`
	return executeQuery(conn, query, CastParentRelation)
}
