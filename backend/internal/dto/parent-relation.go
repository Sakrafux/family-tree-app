package dto

import "github.com/google/uuid"

type ParentRelation struct {
	ParentId   uuid.UUID
	ChildId    uuid.UUID
	Biological bool
}

func ParseParentRelation(data map[string]any) *ParentRelation {
	parentRelation := &ParentRelation{}

	parentRelation.ParentId, _ = data["ParentId"].(uuid.UUID)
	parentRelation.ChildId, _ = data["ChildId"].(uuid.UUID)
	parentRelation.Biological, _ = data["Biological"].(bool)

	return parentRelation
}
