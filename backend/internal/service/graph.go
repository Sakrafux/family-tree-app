package service

import (
	"errors"
	"slices"

	"github.com/Sakrafux/family-tree/backend/internal/db"
	"github.com/google/uuid"
	"github.com/kuzudb/go-kuzu"
	"github.com/samber/lo"
)

type GraphService struct {
	conn *kuzu.Connection
}

func NewGraphService(conn *kuzu.Connection) *GraphService {
	return &GraphService{conn: conn}
}

func (s *GraphService) GetCompleteGraph() (*CompleteGraphResponse, error) {
	wg, chErr := initAsync(4)

	chPersons := asyncDbCall(wg, chErr, func() ([]*db.Person, error) {
		return db.GetAllPersons(s.conn)
	})
	chMarriageRelations := asyncDbCall(wg, chErr, func() ([]*db.MarriageRelation, error) {
		return db.GetAllMarriageRelations(s.conn)
	})
	chParentRelations := asyncDbCall(wg, chErr, func() ([]*db.ParentRelation, error) {
		return db.GetAllParentRelations(s.conn)
	})
	chSiblingRelations := asyncDbCall(wg, chErr, func() ([]*db.SiblingRelation, error) {
		return db.GetAllSiblingRelations(s.conn)
	})

	wg.Wait()

	select {
	case err := <-chErr:
		return nil, err
	default:
	}

	result := &CompleteGraphResponse{
		Persons:           []*CompleteGraphPersonDto{},
		MarriageRelations: <-chMarriageRelations,
		ParentRelations:   <-chParentRelations,
		SiblingRelations:  <-chSiblingRelations,
	}

	personMap := lo.SliceToMap(<-chPersons, func(item *db.Person) (uuid.UUID, *CompleteGraphPersonDto) {
		return item.Id, &CompleteGraphPersonDto{item, 0}
	})
	result.Persons = applyLevels(result.ParentRelations, personMap, nil)

	return result, nil
}

func (s *GraphService) GetSubgraphForRootById(id uuid.UUID, maxDistance int) (*SubgraphResponse, error) {
	wg, chErr := initAsync(5)

	chPersons := asyncDbCall(wg, chErr, func() ([]*db.Person, error) {
		return db.GetAllPersons(s.conn)
	})
	chMarriageRelations := asyncDbCall(wg, chErr, func() ([]*db.MarriageRelation, error) {
		return db.GetAllMarriageRelations(s.conn)
	})
	chParentRelations := asyncDbCall(wg, chErr, func() ([]*db.ParentRelation, error) {
		return db.GetAllParentRelations(s.conn)
	})
	chSiblingRelations := asyncDbCall(wg, chErr, func() ([]*db.SiblingRelation, error) {
		return db.GetAllSiblingRelations(s.conn)
	})
	chDistances := asyncDbCall(wg, chErr, func() ([]*db.GraphDistance, error) {
		return db.GetGraphDistancesForRootById(s.conn, id)
	})

	wg.Wait()

	select {
	case err := <-chErr:
		return nil, err
	default:
	}

	result := &SubgraphResponse{Persons: []*SubgraphPersonDto{}}

	personMap := lo.SliceToMap(<-chPersons, func(item *db.Person) (uuid.UUID, *db.Person) {
		return item.Id, item
	})
	relevantIdMap := map[uuid.UUID]bool{}

	if root, ok := personMap[id]; ok {
		result.Root = &SubgraphPersonDto{root, 0, 0}
	} else {
		return nil, errors.New("root not found")
	}

	graphDistances := slices.Insert(<-chDistances, 0, &db.GraphDistance{
		Id:       id,
		Distance: 0,
	})
	for _, graphDistance := range graphDistances {
		if graphDistance.Distance > int64(maxDistance) {
			// Because the distances are sorted
			break
		}
		relevantIdMap[graphDistance.Id] = true
		result.Persons = append(result.Persons,
			&SubgraphPersonDto{Person: personMap[graphDistance.Id], Distance: graphDistance.Distance},
		)
	}
	result.MarriageRelations = lo.Filter(<-chMarriageRelations, func(item *db.MarriageRelation, index int) bool {
		return relevantIdMap[item.Person1Id] && relevantIdMap[item.Person2Id]
	})
	result.ParentRelations = lo.Filter(<-chParentRelations, func(item *db.ParentRelation, index int) bool {
		return relevantIdMap[item.ParentId] && relevantIdMap[item.ChildId]
	})
	result.SiblingRelations = lo.Filter(<-chSiblingRelations, func(item *db.SiblingRelation, index int) bool {
		return relevantIdMap[item.Person1Id] && relevantIdMap[item.Person2Id]
	})

	personLevelMap := lo.SliceToMap(result.Persons, func(item *SubgraphPersonDto) (uuid.UUID, *SubgraphPersonDto) {
		return item.Id, item
	})
	result.Persons = applyLevels(result.ParentRelations, personLevelMap, &id)

	return result, nil
}

func applyLevels[T levelSetter](parentRelations []*db.ParentRelation, personMap map[uuid.UUID]T, id *uuid.UUID) []T {
	parentMap := make(map[uuid.UUID][]uuid.UUID)
	childMap := make(map[uuid.UUID][]uuid.UUID)

	if len(parentRelations) == 0 {
		return lo.Values(personMap)
	}

	for _, pr := range parentRelations {
		if _, ok := parentMap[pr.ChildId]; !ok {
			parentMap[pr.ChildId] = make([]uuid.UUID, 0)
		}
		parentMap[pr.ChildId] = append(parentMap[pr.ChildId], pr.ParentId)
		if _, ok := childMap[pr.ParentId]; !ok {
			childMap[pr.ParentId] = make([]uuid.UUID, 0)
		}
		childMap[pr.ParentId] = append(childMap[pr.ParentId], pr.ChildId)
	}

	var startId uuid.UUID
	if id != nil {
		startId = *id
	} else {
		// Any random value suffices
		startId = parentRelations[0].ParentId
	}
	visited := make(map[uuid.UUID]bool)
	recordLevel(personMap, parentMap, childMap, visited, startId, 0)

	return lo.Values(personMap)
}

func recordLevel[T levelSetter](
	personMap map[uuid.UUID]T, parentMap, childMap map[uuid.UUID][]uuid.UUID,
	visited map[uuid.UUID]bool, id uuid.UUID, level int,
) {
	if _, ok := visited[id]; ok {
		return
	}
	visited[id] = true

	person := personMap[id]
	person.setLevel(level)

	if parentIds, ok := parentMap[id]; ok {
		delete(parentMap, id)
		for _, parentId := range parentIds {
			recordLevel[T](personMap, parentMap, childMap, visited, parentId, level-1)
		}
	}
	if childIds, ok := childMap[id]; ok {
		delete(childMap, id)
		for _, childId := range childIds {
			recordLevel[T](personMap, parentMap, childMap, visited, childId, level+1)
		}
	}
}
