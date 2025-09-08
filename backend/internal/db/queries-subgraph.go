package db

import (
	"fmt"
	"math"

	"github.com/google/uuid"
	"github.com/kuzudb/go-kuzu"
	"github.com/samber/lo"
)

type PersonWithDistance struct {
	Person
	Distance int64
}

type Subgraph struct {
	Persons   []*PersonWithDistance
	Marriages []*MarriageRelation
	Parents   []*ParentRelation
}

func GetSubgraphForRootByName(conn *kuzu.Connection, distance int, firstName, LastName string) (*Subgraph, error) {
	if distance < 1 {
		return nil, fmt.Errorf("distance must be positive")
	}
	// For memory buffer pool considerations
	if distance > 3 {
		return nil, fmt.Errorf("distance too high: %d", distance)
	}

	ps, err := conn.Prepare(fmt.Sprintf(`
		MATCH path = (root:Person {first_name: $first_name, last_name: $last_name})-[*..%d]-(other:Person)
		WITH other AS person, relationships(path) AS relations, length(path) AS distance
		UNWIND relations AS relation
		RETURN person, relation, distance

		UNION

		MATCH (root:Person {first_name: $first_name, last_name: $last_name})-[r]-(other:Person)
		RETURN root AS person, r AS relation, 0 AS distance
		LIMIT 1

		UNION

		MATCH (root:Person {first_name: $first_name, last_name: $last_name})-[*..%d]-(other:Person)
		WITH collect(other) AS subgraphNodes
		UNWIND subgraphNodes AS a
		UNWIND subgraphNodes AS b
		MATCH (a)-[r]-(b)
		WHERE id(a) < id(b)
		RETURN DISTINCT a AS person, r AS relation, -1 AS distance
	`, distance, distance))
	if err != nil {
		return nil, err
	}
	defer ps.Close()

	result, err := conn.Execute(ps, map[string]any{
		"first_name": firstName,
		"last_name":  LastName,
	})
	if err != nil {
		return nil, err
	}
	defer result.Close()

	persons := make(map[uuid.UUID]*PersonWithDistance)
	marriages := make(map[MarriageKey]*MarriageRelation)
	parents := make(map[ParentRelation]*ParentRelation)

	nodes := make(map[kuzu.InternalID]*PersonWithDistance)
	relationships := make([]kuzu.Relationship, 0)

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

		relationships = append(relationships, valueMap["relation"].(kuzu.Relationship))

		newDistance := valueMap["distance"].(int64)
		if newDistance < 0 {
			newDistance = math.MaxInt64
		}
		person := CastPerson(valueMap["person"].(kuzu.Node).Properties)
		personWithDistance := &PersonWithDistance{*person, newDistance}

		if p, ok := persons[person.Id]; ok && p.Distance < newDistance {
			personWithDistance.Distance = p.Distance
		}

		nodes[valueMap["person"].(kuzu.Node).ID] = personWithDistance
		persons[person.Id] = personWithDistance
	}

	for _, relationship := range relationships {
		source := nodes[relationship.SourceID]
		destination := nodes[relationship.DestinationID]
		switch relationship.Label {
		case "IS_PARENT_OF":
			relationship.Properties["ParentId"] = source.Id
			relationship.Properties["ChildId"] = destination.Id
			parent := CastParentRelation(relationship.Properties)
			parents[*parent] = parent
		case "IS_MARRIED":
			relationship.Properties["Person1Id"] = source.Id
			relationship.Properties["Person2Id"] = destination.Id
			marriage := CastMarriageRelation(relationship.Properties)
			marriages[*CastMarriageKey(relationship.Properties)] = marriage
		}
	}

	subgraph := &Subgraph{
		Persons:   lo.Values(persons),
		Marriages: lo.Values(marriages),
		Parents:   lo.Values(parents),
	}

	return subgraph, nil
}
