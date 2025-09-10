package service

import (
	"cmp"
	"fmt"
	"slices"

	"github.com/Sakrafux/family-tree/backend/internal/db"
	"github.com/Sakrafux/family-tree/backend/internal/errors"
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

func (s *GraphService) GetFamilyTree(id uuid.UUID, maxDistance int) (*FamilyTreeDto, error) {
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
		return nil, errors.NewInternalServerError(err.Error())
	default:
	}

	result := &FamilyTreeDto{Persons: make(map[uuid.UUID]*PersonDto)}

	personMap := lo.SliceToMap(<-chPersons, func(item *db.Person) (uuid.UUID, *db.Person) {
		return item.Id, item
	})

	if _, ok := personMap[id]; !ok {
		return nil, errors.NewNotFoundError(fmt.Sprintf("'%s' not found", id))
	}

	distances := slices.Insert(<-chDistances, 0, &db.GraphDistance{Id: id, Distance: 0})
	for _, distance := range distances {
		if distance.Distance > int64(maxDistance) {
			// Because the distances are sorted
			break
		}

		result.Persons[distance.Id] = &PersonDto{
			Person:   personMap[distance.Id],
			Distance: distance.Distance,
			Parents:  make([]uuid.UUID, 0),
			Children: make([]uuid.UUID, 0),
			Siblings: make([]SiblingDto, 0),
			Spouses:  make([]SpouseDto, 0),
		}
	}
	if root, ok := result.Persons[id]; ok {
		result.Root = root
	} else {
		return nil, errors.NewNotFoundError(fmt.Sprintf("'%s' not found", id))
	}

	for _, marriageRelation := range <-chMarriageRelations {
		spouse1 := SpouseDto{
			Id:         marriageRelation.Person2Id,
			SinceYear:  marriageRelation.SinceYear,
			SinceMonth: marriageRelation.SinceMonth,
			SinceDay:   marriageRelation.SinceDay,
			UntilYear:  marriageRelation.UntilYear,
			UntilMonth: marriageRelation.UntilMonth,
			UntilDay:   marriageRelation.UntilDay,
		}
		spouse2 := spouse1
		spouse2.Id = marriageRelation.Person1Id

		if p1, ok := result.Persons[marriageRelation.Person1Id]; ok {
			p1.Spouses = append(p1.Spouses, spouse1)
		}
		if p2, ok := result.Persons[marriageRelation.Person2Id]; ok {
			p2.Spouses = append(p2.Spouses, spouse2)
		}
	}

	for _, parentRelation := range <-chParentRelations {
		if parent, ok := result.Persons[parentRelation.ParentId]; ok {
			parent.Children = append(parent.Children, parentRelation.ChildId)
		}
		if child, ok := result.Persons[parentRelation.ChildId]; ok {
			child.Parents = append(child.Parents, parentRelation.ParentId)
		}
	}
	for _, person := range result.Persons {
		if len(person.Parents) == 2 {
			if parent1 := result.Persons[person.Parents[0]]; *parent1.Gender == "f" {
				person.Parents = []uuid.UUID{person.Parents[1], person.Parents[0]}
			}
		}
		slices.SortFunc(person.Children, func(a, b uuid.UUID) int {
			personA := result.Persons[a]
			personB := result.Persons[b]

			ay, by := derefDateInt32(personA.BirthDateYear), derefDateInt32(personB.BirthDateYear)
			if ay != by {
				return cmp.Compare(ay, by)
			}

			am, bm := derefDateInt32(personA.BirthDateMonth), derefDateInt32(personB.BirthDateMonth)
			if am != bm {
				return cmp.Compare(am, bm)
			}

			ad, bd := derefDateInt32(personA.BirthDateDay), derefDateInt32(personB.BirthDateDay)
			return cmp.Compare(ad, bd)
		})
	}

	for _, siblingRelation := range <-chSiblingRelations {
		sibling1 := SiblingDto{Id: siblingRelation.Person2Id, IsHalf: siblingRelation.IsHalf}
		sibling2 := sibling1
		sibling2.Id = siblingRelation.Person1Id

		if s1, ok := result.Persons[siblingRelation.Person1Id]; ok {
			s1.Siblings = append(s1.Siblings, sibling1)
		}
		if s2, ok := result.Persons[siblingRelation.Person2Id]; ok {
			s2.Siblings = append(s2.Siblings, sibling2)
		}
	}

	queue := []levelQueueItem{{result.Root, 0}}
	visited := make(map[uuid.UUID]bool)
	for len(queue) > 0 {
		person := queue[0]
		queue = queue[1:]

		if v := visited[person.Person.Id]; v {
			continue
		}
		visited[person.Person.Id] = true

		person.Level = person.levelToSet

		for _, parentId := range person.Parents {
			if parent, ok := result.Persons[parentId]; ok {
				queue = append(queue, levelQueueItem{parent, person.Level - 1})
			}
		}
		for _, childId := range person.Children {
			if child, ok := result.Persons[childId]; ok {
				queue = append(queue, levelQueueItem{child, person.Level + 1})
			}
		}
	}

	return result, nil
}

type levelQueueItem struct {
	*PersonDto
	levelToSet int
}

func assignLevel(persons map[uuid.UUID]*PersonDto, visited map[uuid.UUID]bool, id uuid.UUID, level int) {
	if visited[id] {
		return
	}
	visited[id] = true

	person := persons[id]
	person.Level = level

	for _, parent := range person.Parents {
		assignLevel(persons, visited, parent, level-1)
	}

	for _, child := range person.Children {
		assignLevel(persons, visited, child, level+1)
	}
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
		return nil, errors.NewInternalServerError(err.Error())
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
		return nil, errors.NewInternalServerError(err.Error())
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
		return nil, errors.NewNotFoundError(fmt.Sprintf("'%s' not found", id))
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
