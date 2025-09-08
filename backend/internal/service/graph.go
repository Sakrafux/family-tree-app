package service

import (
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
		Persons:   <-chPersons,
		Marriages: <-chMarriageRelations,
		Parents:   <-chParentRelations,
		Siblings:  <-chSiblingRelations,
	}

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

	result := &SubgraphResponse{Persons: []*RelativePersonDto{}}

	personMap := lo.SliceToMap(<-chPersons, func(item *db.Person) (uuid.UUID, *db.Person) {
		return item.Id, item
	})
	relevantIdMap := map[uuid.UUID]bool{}

	zeroDistance := int64(0)
	result.Root = &RelativePersonDto{personMap[id], &zeroDistance}

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
			&RelativePersonDto{Person: personMap[graphDistance.Id], Distance: &graphDistance.Distance},
		)
	}
	result.Marriages = lo.Filter(<-chMarriageRelations, func(item *db.MarriageRelation, index int) bool {
		return relevantIdMap[item.Person1Id] && relevantIdMap[item.Person2Id]
	})
	result.Parents = lo.Filter(<-chParentRelations, func(item *db.ParentRelation, index int) bool {
		return relevantIdMap[item.ParentId] && relevantIdMap[item.ChildId]
	})
	result.Siblings = lo.Filter(<-chSiblingRelations, func(item *db.SiblingRelation, index int) bool {
		return relevantIdMap[item.Person1Id] && relevantIdMap[item.Person2Id]
	})

	return result, nil
}
