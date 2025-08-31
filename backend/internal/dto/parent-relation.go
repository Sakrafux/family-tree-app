package dto

type ParentRelation struct {
	ParentId   int32
	ChildId    int32
	Biological bool
}

func ParseParentRelation(data map[string]any) *ParentRelation {
	parentRelation := &ParentRelation{}

	parentRelation.ParentId, _ = data["ParentId"].(int32)
	parentRelation.ChildId, _ = data["ChildId"].(int32)
	parentRelation.Biological, _ = data["Biological"].(bool)

	return parentRelation
}
