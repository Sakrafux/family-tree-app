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
	result, err := conn.Query(query)
	if err != nil {
		return nil, err
	}
	defer result.Close()

	dtos := make([]*dto.Person, 0)
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
		dtos = append(dtos, dto.ParsePerson(valueMap))
	}

	return dtos, nil
}

func GetAllMarriageRelations(conn *kuzu.Connection) ([]*dto.MarriageRelation, error) {
	query := `
	MATCH (a:Person)-[e:IS_MARRIED]->(b:Person)
	RETURN a.id as Person1Id, b.id as Person2Id, e.since as Since, e.until as Until
	`
	result, err := conn.Query(query)
	if err != nil {
		return nil, err
	}
	defer result.Close()

	dtos := make([]*dto.MarriageRelation, 0)
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
		dtos = append(dtos, dto.ParseMarriageRelation(valueMap))
	}

	return dtos, nil
}

func GetAllParentRelations(conn *kuzu.Connection) ([]*dto.ParentRelation, error) {
	query := `
	MATCH (a:Person)-[e:IS_PARENT]->(b:Person)
	RETURN a.id as ParentId, b.id as ChildId, e.adopted as Adopted
	`
	result, err := conn.Query(query)
	if err != nil {
		return nil, err
	}
	defer result.Close()

	dtos := make([]*dto.ParentRelation, 0)
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
		dtos = append(dtos, dto.ParseParentRelation(valueMap))
	}

	return dtos, nil
}
