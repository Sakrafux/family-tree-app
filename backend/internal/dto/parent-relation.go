package dto

import "github.com/google/uuid"

type ParentRelation struct {
	ParentId uuid.UUID
	ChildId  uuid.UUID
	Adopted  *bool
}

func ParseParentRelation(data map[string]any) *ParentRelation {
	parentRelation := &ParentRelation{}

	parentRelation.ParentId, _ = data["ParentId"].(uuid.UUID)
	parentRelation.ChildId, _ = data["ChildId"].(uuid.UUID)
	if adopted, ok := data["Adopted"].(bool); ok {
		parentRelation.Adopted = &adopted
	}

	return parentRelation
}
