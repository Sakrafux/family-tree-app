//go:generate go run ../../pkg/generators/caster_generator.go

package db

import (
	"github.com/google/uuid"
)

type Person struct {
	Id             uuid.UUID `cast-source:"id"`
	FirstName      *string   `cast-source:"first_name"`
	LastName       *string   `cast-source:"last_name"`
	BirthName      *string   `cast-source:"birth_name"`
	Gender         *string   `cast-source:"gender"`
	IsDead         *bool     `cast-source:"is_dead"`
	BirthDateYear  *int32    `cast-source:"birth_date_year"`
	BirthDateMonth *int32    `cast-source:"birth_date_month"`
	BirthDateDay   *int32    `cast-source:"birth_date_day"`
	DeathDateYear  *int32    `cast-source:"death_date_year"`
	DeathDateMonth *int32    `cast-source:"death_date_month"`
	DeathDateDay   *int32    `cast-source:"death_date_day"`
}

type MarriageKey struct {
	Person1Id uuid.UUID `cast-source:"Person1Id"`
	Person2Id uuid.UUID `cast-source:"Person2Id"`
}

type MarriageRelation struct {
	Person1Id  uuid.UUID `cast-source:"Person1Id"`
	Person2Id  uuid.UUID `cast-source:"Person2Id"`
	SinceYear  *int32    `cast-source:"since_year"`
	SinceMonth *int32    `cast-source:"since_month"`
	SinceDay   *int32    `cast-source:"since_day"`
	UntilYear  *int32    `cast-source:"until_year"`
	UntilMonth *int32    `cast-source:"until_month"`
	UntilDay   *int32    `cast-source:"until_day"`
}

type ParentRelation struct {
	ParentId uuid.UUID `cast-source:"ParentId"`
	ChildId  uuid.UUID `cast-source:"ChildId"`
}

type SiblingKey struct {
	Person1Id uuid.UUID `cast-source:"Person1Id"`
	Person2Id uuid.UUID `cast-source:"Person2Id"`
}

type SiblingRelation struct {
	Person1Id uuid.UUID `cast-source:"Person1Id"`
	Person2Id uuid.UUID `cast-source:"Person2Id"`
	IsHalf    bool      `cast-source:"is_half"`
}

type GraphDistance struct {
	Id       uuid.UUID `cast-source:"id"`
	Distance int64     `cast-source:"distance"`
}
