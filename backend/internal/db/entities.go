//go:generate go run ../../pkg/generators/caster_generator.go

package db

import (
	"github.com/google/uuid"
)

type Person struct {
	Id             uuid.UUID `cast-source:"Id"`
	FirstName      *string   `cast-source:"FirstName"`
	LastName       *string   `cast-source:"LastName"`
	BirthName      *string   `cast-source:"BirthName"`
	Gender         *string   `cast-source:"Gender"`
	Dead           *bool     `cast-source:"Dead"`
	BirthDateYear  *int      `cast-source:"BirthDateYear"`
	BirthDateMonth *int      `cast-source:"BirthDateMonth"`
	BirthDateDay   *int      `cast-source:"BirthDateDay"`
	DeathDateYear  *int      `cast-source:"DeathDateYear"`
	DeathDateMonth *int      `cast-source:"DeathDateMonth"`
	DeathDateDay   *int      `cast-source:"DeathDateDay"`
}

type MarriageRelation struct {
	Person1Id  uuid.UUID `cast-source:"Person1Id"`
	Person2Id  uuid.UUID `cast-source:"Person2Id"`
	SinceYear  *int      `cast-source:"SinceYear"`
	SinceMonth *int      `cast-source:"SinceMonth"`
	SinceDay   *int      `cast-source:"SinceDay"`
	UntilYear  *int      `cast-source:"UntilYear"`
	UntilMonth *int      `cast-source:"UntilMonth"`
	UntilDay   *int      `cast-source:"UntilDay"`
}

type ParentRelation struct {
	ParentId uuid.UUID `cast-source:"ParentId"`
	ChildId  uuid.UUID `cast-source:"ChildId"`
}
