//go:generate go run ../../pkg/generators/caster_generator.go

package db

import (
	"time"

	"github.com/google/uuid"
)

type Person struct {
	Id        uuid.UUID  `cast-source:"Id"`
	FirstName *string    `cast-source:"FirstName"`
	LastName  *string    `cast-source:"LastName"`
	BirthName *string    `cast-source:"BirthName"`
	Gender    *string    `cast-source:"Gender"`
	Dead      *bool      `cast-source:"Dead"`
	BirthDate *time.Time `cast-source:"BirthDate"`
	DeathDate *time.Time `cast-source:"DeathDate"`
}

type MarriageRelation struct {
	Person1Id uuid.UUID  `cast-source:"Person1Id"`
	Person2Id uuid.UUID  `cast-source:"Person2Id"`
	Since     *time.Time `cast-source:"Since"`
	Until     *time.Time `cast-source:"Until"`
}

type ParentRelation struct {
	ParentId uuid.UUID `cast-source:"ParentId"`
	ChildId  uuid.UUID `cast-source:"ChildId"`
	Adopted  *bool     `cast-source:"Adopted"`
}
