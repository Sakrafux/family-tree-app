package dto

import (
	"time"

	"github.com/google/uuid"
)

type Person struct {
	Id        uuid.UUID
	FirstName *string
	LastName  *string
	BirthName *string
	Gender    string
	BirthDate *time.Time
	DeathDate *time.Time
}

func ParsePerson(data map[string]any) *Person {
	person := &Person{}

	person.Id = data["Id"].(uuid.UUID)
	if firstName, ok := data["FirstName"].(string); ok {
		person.FirstName = &firstName
	}
	if lastName, ok := data["LastName"].(string); ok {
		person.LastName = &lastName
	}
	if birthName, ok := data["BirthName"].(string); ok {
		person.BirthName = &birthName
	}
	person.Gender = data["Gender"].(string)
	if birthDate, ok := data["BirthDate"].(time.Time); ok {
		person.BirthDate = &birthDate
	}
	if deathDate, ok := data["DeathDate"].(time.Time); ok {
		person.DeathDate = &deathDate
	}

	return person
}
