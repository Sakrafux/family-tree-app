package dto

import (
	"time"

	"github.com/google/uuid"
)

type MarriageRelation struct {
	Person1Id uuid.UUID
	Person2Id uuid.UUID
	Since     *time.Time
	Until     *time.Time
}

func ParseMarriageRelation(data map[string]any) *MarriageRelation {
	marriageRelation := &MarriageRelation{}

	marriageRelation.Person1Id, _ = data["Person1Id"].(uuid.UUID)
	marriageRelation.Person2Id, _ = data["Person2Id"].(uuid.UUID)
	if since, ok := data["Since"].(time.Time); ok {
		marriageRelation.Since = &since
	}
	if until, ok := data["Until"].(time.Time); ok {
		marriageRelation.Until = &until
	}

	return marriageRelation
}
