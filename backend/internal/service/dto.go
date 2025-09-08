package service

import "github.com/Sakrafux/family-tree/backend/internal/db"

type CompleteGraphResponse struct {
	Persons   []*db.Person
	Marriages []*db.MarriageRelation
	Parents   []*db.ParentRelation
	Siblings  []*db.SiblingRelation
}

type RelativePersonDto struct {
	*db.Person
	Distance *int64
}

type SubgraphResponse struct {
	Root      *RelativePersonDto
	Persons   []*RelativePersonDto
	Marriages []*db.MarriageRelation
	Parents   []*db.ParentRelation
	Siblings  []*db.SiblingRelation
}
