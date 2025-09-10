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
	chPersons, chDistances, chMarriageRelations, chParentRelations, chSiblingRelations, err := queryDbInParallel(s.conn, id)
	if err != nil {
		return nil, err
	}

	dto := &FamilyTreeDto{Persons: make(map[uuid.UUID]*PersonDto)}

	if err := mapPersonsByDistance(dto, chPersons, chDistances, id, maxDistance); err != nil {
		return nil, err
	}
	if root, ok := dto.Persons[id]; ok {
		dto.Root = root
	} else {
		return nil, errors.NewNotFoundError(fmt.Sprintf("'%s' not found", id))
	}

	relateSpouses(dto, chMarriageRelations)
	relateParentsAndChildren(dto, chParentRelations)
	relateSiblings(dto, chSiblingRelations)
	assignLevels(dto)

	return dto, nil
}

func queryDbInParallel(conn *kuzu.Connection, id uuid.UUID) (chan []*db.Person, chan []*db.GraphDistance, chan []*db.MarriageRelation, chan []*db.ParentRelation, chan []*db.SiblingRelation, error) {
	wg, chErr := initAsync(5)

	chPersons := asyncDbCall(wg, chErr, func() ([]*db.Person, error) {
		return db.GetAllPersons(conn)
	})
	chDistances := asyncDbCall(wg, chErr, func() ([]*db.GraphDistance, error) {
		return db.GetGraphDistancesForRootById(conn, id)
	})
	chMarriageRelations := asyncDbCall(wg, chErr, func() ([]*db.MarriageRelation, error) {
		return db.GetAllMarriageRelations(conn)
	})
	chParentRelations := asyncDbCall(wg, chErr, func() ([]*db.ParentRelation, error) {
		return db.GetAllParentRelations(conn)
	})
	chSiblingRelations := asyncDbCall(wg, chErr, func() ([]*db.SiblingRelation, error) {
		return db.GetAllSiblingRelations(conn)
	})

	wg.Wait()

	select {
	case err := <-chErr:
		return nil, nil, nil, nil, nil, errors.NewInternalServerError(err.Error())
	default:
	}

	return chPersons, chDistances, chMarriageRelations, chParentRelations, chSiblingRelations, nil
}

func mapPersonsByDistance(dto *FamilyTreeDto, chPersons chan []*db.Person, chDistances chan []*db.GraphDistance, id uuid.UUID, maxDistance int) error {
	personMap := lo.SliceToMap(<-chPersons, func(item *db.Person) (uuid.UUID, *db.Person) {
		return item.Id, item
	})

	if _, ok := personMap[id]; !ok {
		return errors.NewNotFoundError(fmt.Sprintf("'%s' not found", id))
	}

	distances := slices.Insert(<-chDistances, 0, &db.GraphDistance{Id: id, Distance: 0})
	for _, distance := range distances {
		if distance.Distance > int64(maxDistance) {
			// Because the distances are sorted
			break
		}

		dto.Persons[distance.Id] = &PersonDto{
			Person:   personMap[distance.Id],
			Distance: distance.Distance,
			Parents:  make([]uuid.UUID, 0),
			Children: make([]uuid.UUID, 0),
			Siblings: make([]SiblingDto, 0),
			Spouses:  make([]SpouseDto, 0),
		}
	}

	return nil
}

func relateSpouses(dto *FamilyTreeDto, chMarriageRelations chan []*db.MarriageRelation) {
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

		if p1, ok := dto.Persons[marriageRelation.Person1Id]; ok {
			p1.Spouses = append(p1.Spouses, spouse1)
		}
		if p2, ok := dto.Persons[marriageRelation.Person2Id]; ok {
			p2.Spouses = append(p2.Spouses, spouse2)
		}
	}
}

func relateParentsAndChildren(dto *FamilyTreeDto, chParentRelations chan []*db.ParentRelation) {
	for _, parentRelation := range <-chParentRelations {
		if parent, ok := dto.Persons[parentRelation.ParentId]; ok {
			parent.Children = append(parent.Children, parentRelation.ChildId)
		}
		if child, ok := dto.Persons[parentRelation.ChildId]; ok {
			child.Parents = append(child.Parents, parentRelation.ParentId)
		}
	}

	// Sort parents and children deterministically
	for _, person := range dto.Persons {
		if len(person.Parents) == 2 {
			if parent1 := dto.Persons[person.Parents[0]]; *parent1.Gender == "f" {
				person.Parents = []uuid.UUID{person.Parents[1], person.Parents[0]}
			}
		}
		slices.SortFunc(person.Children, func(a, b uuid.UUID) int {
			personA := dto.Persons[a]
			personB := dto.Persons[b]

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
}

func relateSiblings(dto *FamilyTreeDto, chSiblingRelations chan []*db.SiblingRelation) {
	for _, siblingRelation := range <-chSiblingRelations {
		sibling1 := SiblingDto{Id: siblingRelation.Person2Id, IsHalf: siblingRelation.IsHalf}
		sibling2 := sibling1
		sibling2.Id = siblingRelation.Person1Id

		if s1, ok := dto.Persons[siblingRelation.Person1Id]; ok {
			s1.Siblings = append(s1.Siblings, sibling1)
		}
		if s2, ok := dto.Persons[siblingRelation.Person2Id]; ok {
			s2.Siblings = append(s2.Siblings, sibling2)
		}
	}
}

type levelQueueItem struct {
	*PersonDto
	levelToSet int
}

func assignLevels(dto *FamilyTreeDto) {
	queue := []levelQueueItem{{dto.Root, 0}}
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
			if parent, ok := dto.Persons[parentId]; ok {
				queue = append(queue, levelQueueItem{parent, person.Level - 1})
			}
		}
		for _, childId := range person.Children {
			if child, ok := dto.Persons[childId]; ok {
				queue = append(queue, levelQueueItem{child, person.Level + 1})
			}
		}
	}
}
