import * as d3 from "d3-hierarchy";

import { LAYOUT_WIDTH } from "@/components/FamilyTree/FamilyTree";
import type { FamilyTreeDto, PersonDto, SpouseDto } from "@/types/dto";

export type PersonNode = PersonDto & {
    // Necessary naming for d3
    children: PersonDto[];
    type: "ancestor" | "descendant" | "root" | "sibling" | "root-spouse" | "descendant-spouse";
};

export type SpouseLink = Omit<SpouseDto, "Id">;

export type MinHierarchyNode<T> = {
    x: number;
    y: number;
    depth: number;
    data: T;
};

export type MinHierarchyLink<T, D = object> = {
    source: MinHierarchyNode<T>;
    target: MinHierarchyNode<T>;
    data?: D & { type: "spouse"; nodesInBetween?: number };
};

export function buildDescendantTree(familyTree: FamilyTreeDto, id: string): PersonNode {
    const rootPerson = familyTree.Persons[id];
    const children = rootPerson.Children.map((childId) => familyTree.Persons[childId]).filter(
        (child) => child != null,
    );

    const node: PersonNode = { ...rootPerson, children: children, type: "descendant" };
    if (children.length) {
        node.children = children.flatMap((child) => {
            const childNode = buildDescendantTree(familyTree, child.Id);
            const spouses = child.Spouses.map((spouse) => ({
                ...familyTree.Persons[spouse.Id],
                children: [],
                type: "descendant-spouse",
            }));
            return [childNode, ...spouses];
        });
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
            data: { ...spouse, children: [], type: "root-spouse" },
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
    return spouseNodes
        .map((spouseNode, i) => {
            const spouseDto = rootNode.data.Spouses.find(
                (spouse) => spouse.Id === spouseNode.data.Id,
            )!;

            return {
                source: rootNode,
                target: spouseNode,
                data: { type: "spouse", nodesInBetween: i, ...spouseDto },
            };
        })
        .reverse() as MinHierarchyLink<PersonNode>[];
}

export function createDescendantSpouseLinks(
    rootNode: d3.HierarchyPointNode<PersonNode>,
): MinHierarchyLink<PersonNode>[] {
    const links: MinHierarchyLink<PersonNode, SpouseLink>[] = [];

    const queue: d3.HierarchyPointNode<PersonNode>[] = [rootNode];
    while (queue.length > 0) {
        const node = queue.shift();

        const children = node!.children ?? [];
        queue.push(...children);

        const childMap = Object.fromEntries(children.map((child) => [child.data.Id, child]));
        children.forEach((child) => {
            if (child.data.type === "descendant" && child.data.Spouses.length > 0) {
                child.data.Spouses.map((spouse, i) => ({
                    spouseNode: childMap[spouse.Id],
                    spouseDto: spouse,
                    i,
                }))
                    .filter((spouse) => spouse != null && spouse.spouseNode != null)
                    .forEach(({ spouseNode, spouseDto, i }) => {
                        links.push({
                            source: spouseNode,
                            target: child,
                            data: { type: "spouse", nodesInBetween: i, ...spouseDto },
                        });
                    });
            }
        });
    }

    return links.reverse();
}

export function createAncestorSpouseLink(
    rootNode: d3.HierarchyPointNode<PersonNode>,
): MinHierarchyLink<PersonNode>[] {
    const links: MinHierarchyLink<PersonNode, SpouseLink>[] = [];

    const queue: d3.HierarchyPointNode<PersonNode>[] = [rootNode];
    while (queue.length > 0) {
        const node = queue.shift();

        const parents = node!.children ?? [];
        queue.push(...parents);

        const parentMap = Object.fromEntries(parents.map((parent) => [parent.data.Id, parent]));
        const alreadyPaired: Record<string, boolean> = {};
        parents.forEach((parent) => {
            const { spouseNode, spouseDto } = [
                ...parent.data.Spouses.map((spouse) => ({
                    spouseNode: parentMap[spouse.Id],
                    spouseDto: spouse,
                })).filter((spouse) => spouse != null && !alreadyPaired[spouse.spouseDto.Id]),
                {},
            ][0];
            if (spouseNode != null) {
                links.push({
                    source: spouseNode,
                    target: parent,
                    data: { type: "spouse", ...spouseDto },
                });
                alreadyPaired[parent.data.Id] = true;
            }
        });
    }

    return links;
}
