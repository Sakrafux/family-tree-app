package service

import (
	"github.com/Sakrafux/family-tree/backend/internal/db"
	"github.com/google/uuid"
)

type levelSetter interface {
	setLevel(level int)
}

type CompleteGraphPersonDto struct {
	*db.Person
	Level int
}

func (dto *CompleteGraphPersonDto) setLevel(level int) {
	dto.Level = level
}

type CompleteGraphResponse struct {
	Persons           []*CompleteGraphPersonDto
	MarriageRelations []*db.MarriageRelation
	ParentRelations   []*db.ParentRelation
	SiblingRelations  []*db.SiblingRelation
}

type SubgraphPersonDto struct {
	*db.Person
	Distance int64
	Level    int
}

func (dto *SubgraphPersonDto) setLevel(level int) {
	dto.Level = level
}

type SubgraphResponse struct {
	Root              *SubgraphPersonDto
	Persons           []*SubgraphPersonDto
	MarriageRelations []*db.MarriageRelation
	ParentRelations   []*db.ParentRelation
	SiblingRelations  []*db.SiblingRelation
}

type SpouseDto struct {
	Id         uuid.UUID
	SinceYear  *int32
	SinceMonth *int32
	SinceDay   *int32
	UntilYear  *int32
	UntilMonth *int32
	UntilDay   *int32
}

type SiblingDto struct {
	Id     uuid.UUID
	IsHalf bool
}

type PersonDto struct {
	*db.Person
	Level    int
	Distance int64
	Parents  []uuid.UUID
	Children []uuid.UUID
	Siblings []SiblingDto
	Spouses  []SpouseDto
}

type FamilyTreeDto struct {
	Root    *PersonDto
	Persons map[uuid.UUID]*PersonDto
}

type FeedbackRequest struct {
	Text string
}

type FeedbackDto struct {
	*db.Feedback
}
