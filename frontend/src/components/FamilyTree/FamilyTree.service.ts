import type { FamilyTreeDto, PersonDto } from "@/types/dto";

export type PersonNode = PersonDto & {
    // Necessary naming for d3
    children: PersonDto[];
    type: "ancestor" | "descendant" | "root";
};

export function buildDescendantTree(familyTree: FamilyTreeDto, id: string): PersonNode {
    const rootPerson = familyTree.Persons[id];
    const children = rootPerson.Children.map((childId) => familyTree.Persons[childId]).filter(
        (child) => child != null,
    );

    const node: PersonNode = { ...rootPerson, children: children, type: "descendant" };
    if (children.length) {
        node.children = children.map((child) => buildDescendantTree(familyTree, child.Id));
    }

    return node;
}

export function buildAncestorTree(familyTree: FamilyTreeDto, id: string): PersonNode {
    const rootPerson = familyTree.Persons[id];
    const parents = rootPerson.Parents.map((parentId) => familyTree.Persons[parentId]).filter(
        (parent) => parent != null,
    );

    const node: PersonNode = { ...rootPerson, children: parents, type: "ancestor" };
    if (parents.length) {
        node.children = parents.map((parent) => buildAncestorTree(familyTree, parent.Id));
    }

    return node;
}

export function buildHourglassTree(
    familyTree: FamilyTreeDto,
): [descendantTree: PersonNode, ancestorTree: PersonNode] {
    const id = familyTree.Root.Id;

    const descendantTree = buildDescendantTree(familyTree, id);
    const ancestorTree = buildAncestorTree(familyTree, id);

    descendantTree.type = "root";
    ancestorTree.type = "root";

    return [descendantTree, ancestorTree];
}
