import { LAYOUT_WIDTH } from "@/components/FamilyTree/FamilyTree";
import type { FamilyTreeDto, PersonDto } from "@/types/dto";

export type PersonNode = PersonDto & {
    // Necessary naming for d3
    children: PersonDto[];
    type: "ancestor" | "descendant" | "root" | "sibling" | "spouse";
};

export type MinHierarchyNode<T> = {
    x: number;
    y: number;
    depth: number;
    data: T;
};

export type MinHierarchyLink<T> = {
    source: MinHierarchyNode<T>;
    target: MinHierarchyNode<T>;
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

export function createSiblingNodes(familyTree: FamilyTreeDto): MinHierarchyNode<PersonNode>[] {
    const root = familyTree.Root;

    return root.Siblings.map((s, i) => {
        const sibling = familyTree.Persons[s.Id];
        if (sibling == null) {
            return undefined;
        }
        const x = -(i + 1) * LAYOUT_WIDTH;
        return {
            data: { ...sibling, children: [], type: "sibling" },
            x,
            y: 0,
            depth: 0,
        } as MinHierarchyNode<PersonNode>;
    }).filter((sibling) => sibling != null);
}

export function createSiblingLinks(
    rootNode: MinHierarchyNode<PersonNode>,
    siblingNodes: MinHierarchyNode<PersonNode>[],
): MinHierarchyLink<PersonNode>[] {
    return siblingNodes.map((siblingNode) => ({ source: rootNode, target: siblingNode }));
}

export function createSpouseNodes(familyTree: FamilyTreeDto): MinHierarchyNode<PersonNode>[] {
    const root = familyTree.Root;

    return root.Spouses.map((s, i) => {
        const spouse = familyTree.Persons[s.Id];
        if (spouse == null) {
            return undefined;
        }
        const x = (i + 1) * LAYOUT_WIDTH;
        return {
            data: { ...spouse, children: [], type: "spouse" },
            x,
            y: 0,
            depth: 0,
        } as MinHierarchyNode<PersonNode>;
    }).filter((spouse) => spouse != null);
}

export function createSpouseLinks(
    rootNode: MinHierarchyNode<PersonNode>,
    spouseNodes: MinHierarchyNode<PersonNode>[],
): MinHierarchyLink<PersonNode>[] {
    return spouseNodes.map((spouseNode) => ({ source: rootNode, target: spouseNode }));
}

// TODO ancestor (descendant?) spousal links
// TODO uncles/aunts as fake ancestors (+ links)
// TODO child spouses as fake descendants (+ links)
