package db

import (
	"github.com/kuzudb/go-kuzu"
)

func GetAllPersons(conn *kuzu.Connection) ([]*Person, error) {
	query := `
	MATCH (a:Person)
	RETURN a.id as Id, a.first_name as FirstName, a.last_name as LastName, 
		a.birth_name as BirthName, a.gender as Gender, a.dead as Dead, 
		a.birth_date_year as BirthDateYear, a.birth_date_month as BirthDateMonth, a.birth_date_day as BirthDateDay,
		a.death_date_year as DeathDateYear, a.death_date_month as DeathDateMonth, a.death_date_day as DeathDateDay
	`
	return executeQuery(conn, query, CastPerson)
}

func GetAllMarriageRelations(conn *kuzu.Connection) ([]*MarriageRelation, error) {
	query := `
	MATCH (a:Person)-[e:IS_MARRIED]->(b:Person)
	RETURN a.id as Person1Id, b.id as Person2Id, 
		e.since_year as SinceYear, e.since_month as SinceMonth, e.since_day as SinceDay,
		e.until_year as UntilYear, e.until_month as UntilMonth, e.until_day as UntilDay
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
