package service

import (
	"github.com/Sakrafux/family-tree/backend/internal/db"
	"github.com/google/uuid"
)

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
	Age      *int32
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
