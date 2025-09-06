package db

import (
	"github.com/Sakrafux/family-tree/backend/internal/dto"
	"github.com/kuzudb/go-kuzu"
)

func GetAllPersons(conn *kuzu.Connection) ([]*dto.Person, error) {
	query := `
	MATCH (a:Person)
	RETURN a.id as Id, a.first_name as FirstName, a.last_name as LastName, a.birth_name as BirthName, 
		a.gender as Gender, a.dead as Dead, a.birth_date as BirthDate, a.death_date as DeathDate
	`
	return executeQuery(conn, query, dto.ParsePerson)
}

func GetAllMarriageRelations(conn *kuzu.Connection) ([]*dto.MarriageRelation, error) {
	query := `
	MATCH (a:Person)-[e:IS_MARRIED]->(b:Person)
	RETURN a.id as Person1Id, b.id as Person2Id, e.since as Since, e.until as Until
	`
	return executeQuery(conn, query, dto.ParseMarriageRelation)
}

func GetAllParentRelations(conn *kuzu.Connection) ([]*dto.ParentRelation, error) {
	query := `
	MATCH (a:Person)-[e:IS_PARENT]->(b:Person)
	RETURN a.id as ParentId, b.id as ChildId, e.adopted as Adopted
	`
	return executeQuery(conn, query, dto.ParseParentRelation)
}
