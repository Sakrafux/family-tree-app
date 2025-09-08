package service

import "github.com/Sakrafux/family-tree/backend/internal/db"

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
