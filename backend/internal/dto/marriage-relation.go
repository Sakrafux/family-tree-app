package dto

import "time"

type MarriageRelation struct {
	Person1Id int32
	Person2Id int32
	Since     *time.Time
	Until     *time.Time
}

func ParseMarriageRelation(data map[string]any) *MarriageRelation {
	marriageRelation := &MarriageRelation{}

	marriageRelation.Person1Id, _ = data["Person1Id"].(int32)
	marriageRelation.Person2Id, _ = data["Person2Id"].(int32)
	if since, ok := data["Since"].(time.Time); ok {
		marriageRelation.Since = &since
	}
	if until, ok := data["Until"].(time.Time); ok {
		marriageRelation.Until = &until
	}

	return marriageRelation
}
