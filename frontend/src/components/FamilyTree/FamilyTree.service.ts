import * as d3 from "d3-hierarchy";

import { LAYOUT_WIDTH } from "@/components/FamilyTree/FamilyTree";
import type { FamilyTreeDto, PersonDto, SpouseDto } from "@/types/dto";

// Node data from DTO enriched with additional semantic type information
export type PersonNode = PersonDto & {
    // Necessary naming for D3 hierarchy to work automatically
    children: PersonDto[];
    // Semantic type information to use for styling and such
    type: "ancestor" | "descendant" | "root" | "sibling" | "root-spouse" | "descendant-spouse";
};

// Data from DTO without "id" as it is applied to the link and not a single partner
export type SpouseLink = Omit<SpouseDto, "Id">;

// Minimal necessary data from the D3 node interface to allow for use of manual nodes
export type MinHierarchyNode<T> = {
    // Calculated x-coordinate in graph
    x: number;
    // Calculated y-coordinated in graph
    y: number;
    // Calculated depth in relation to the root
    depth: number;
    // Actual data to work with
    data: T;
};

// Extension of the D3 link interface to work with minimal node interfaces and enrich the link itself
// with additional data
export type MinHierarchyLink<T, D = object> = {
    // Source node in the graph
    source: MinHierarchyNode<T>;
    // Target node in the graph
    target: MinHierarchyNode<T>;
    // Data of the actual link itself to use for visualization
    data?: D & { type: "spouse"; nodesInBetween?: number };
};

// Transform the DTO that only uses referential nesting (i.e. Children, Spouses, etc... are only arrays of IDs)
// into a truly nested structure, going downwards from the root (i.e. descendants).
// As this is a recursive method, {@link id} is required as the root of the subtree, even if this may be the tree root.
// This will run into issues, if there are referential circles in the data
export function buildDescendantTree(familyTree: FamilyTreeDto, id: string): PersonNode {
    // Root DTO for the current subtree
    const rootPerson = familyTree.Persons[id];
    // Map the child references to actual DTOs
    // Also ensure that the referred entities are actually part of our DTO, which may not be the
    // case depending on chosen distance during data fetching
    const children = rootPerson.Children.map((childId) => familyTree.Persons[childId]).filter(
        (child) => child != null,
    );

    // Construct a node (or rather, D3 input data for nodes) based on the DTO
    const node: PersonNode = { ...rootPerson, children: children, type: "descendant" };
    // For each child node also construct their respective subtree
    // Additionally, include their spouses as fake descendants of the root to ensure the D3 tree
    // layout algorithm places them accordingly
    node.children = children.flatMap((child) => {
        // Construct proper child node subtree recursively
        const childNode = buildDescendantTree(familyTree, child.Id);
        // Map the spouses of child as leaf nodes (i.e. no subtree necessary to prevent visual overload)
        const spouses = child.Spouses.map((spouse) => ({
            ...familyTree.Persons[spouse.Id],
            children: [],
            type: "descendant-spouse",
        }));
        // The ordering of the nodes defines in which order their coordinates are calculated
        // Spouses are always placed to the right of a node
        // The relevant ordering of the spouses should be done deterministically on the backend
        return [childNode, ...spouses];
    });

    return node;
}

// Does the same as {@link buildDescendantTree}, except upwards from the root
export function buildAncestorTree(familyTree: FamilyTreeDto, id: string): PersonNode {
    const rootPerson = familyTree.Persons[id];
    const parents = rootPerson.Parents.map((parentId) => familyTree.Persons[parentId]).filter(
        (parent) => parent != null,
    );

    const node: PersonNode = { ...rootPerson, children: parents, type: "ancestor" };
    // No fake ancestor nodes for spouses of parents, because the only relevant parent spouse is
    // the other parent
    node.children = parents.map((parent) => buildAncestorTree(familyTree, parent.Id));

    return node;
}

// Combine a descendant and ancestor tree around a common root
export function buildHourglassTree(
    familyTree: FamilyTreeDto,
): [descendantTree: PersonNode, ancestorTree: PersonNode] {
    const id = familyTree.Root.Id;

    const descendantTree = buildDescendantTree(familyTree, id);
    const ancestorTree = buildAncestorTree(familyTree, id);

    // Mark the roots of the trees as such semantically
    descendantTree.type = "root";
    ancestorTree.type = "root";

    return [descendantTree, ancestorTree];
}

// Manually create sibling nodes for the tree root
export function createSiblingNodes(familyTree: FamilyTreeDto): MinHierarchyNode<PersonNode>[] {
    const root = familyTree.Root;

    // Map the sibling IDs to proper DTOs and then construct a graph node from it
    // The ordering of the siblings decides in which order they are displayed, which should be done
    // deterministically on the backend
    return root.Siblings.map((s, i) => {
        const sibling = familyTree.Persons[s.Id];
        if (sibling == null) {
            return undefined;
        }
        // Manually calculate their x-coordinate by keeping to the distance used by D3 for the tree
        // As the left side of the root node will always be empty, we can use that space to place the
        // siblings in the order given
        const x = -(i + 1) * LAYOUT_WIDTH;
        // The siblings are constructed as leaf nodes
        return {
            data: { ...sibling, children: [], type: "sibling" },
            x,
            y: 0, // Always 0, same as the root node
            depth: 0, // Always 0, same as the root node
        } as MinHierarchyNode<PersonNode>;
    }).filter((sibling) => sibling != null);
}

// Manually create links for the sibling nodes of the given root node
export function createSiblingLinks(
    rootNode: MinHierarchyNode<PersonNode>,
    siblingNodes: MinHierarchyNode<PersonNode>[],
): MinHierarchyLink<PersonNode>[] {
    return siblingNodes.map((siblingNode) => ({ source: rootNode, target: siblingNode }));
}

// Same as {@link createSiblingNodes} except for spouses instead and to the right of the root node
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

// Manually create links for the spouse nodes of the given root node with additional information
export function createSpouseLinks(
    rootNode: MinHierarchyNode<PersonNode>,
    spouseNodes: MinHierarchyNode<PersonNode>[],
): MinHierarchyLink<PersonNode>[] {
    return (
        spouseNodes
            .map((spouseNode, i) => {
                // As we want to display additional information about a spousal relationship (i.e. marriage)
                // we must fetch the corresponding dto
                const spouseDto = rootNode.data.Spouses.find(
                    (spouse) => spouse.Id === spouseNode.data.Id,
                )!;

                // Create the link from the root to the spouse
                // However, there may be multiple spouses that could then overlay the visual line
                // This is no problem for multiple lines of the same type with no additional information,
                // but as we want to display information about the marriage itself, we need to give
                // additional cues about where to place it in the form of "nodesInBetween", counting the
                // number of other spouse nodes between the root and the current spouse
                return {
                    source: rootNode,
                    target: spouseNode,
                    data: { type: "spouse", nodesInBetween: i, ...spouseDto },
                };
            })
            // Reverse the order to ensure the longer links overlapping with spouse are rendered earlier,
            // and are thus visually behind
            .reverse() as MinHierarchyLink<PersonNode>[]
    );
}

// Manually create links for the spouses of descendants
// Since we injected the spouses of descendants in {@link buildDescendantTree}, D3 treats them as
// normal descendants, unaware of the semantic difference, so this requires our intervention
export function createDescendantSpouseLinks(
    rootNode: d3.HierarchyPointNode<PersonNode>,
): MinHierarchyLink<PersonNode>[] {
    const links: MinHierarchyLink<PersonNode, SpouseLink>[] = [];

    // Work through the tree using BFS
    const queue: d3.HierarchyPointNode<PersonNode>[] = [rootNode];
    while (queue.length > 0) {
        const node = queue.shift();

        const children = node!.children ?? [];
        queue.push(...children);

        // Create a map of the children for easy access by id
        const childMap = Object.fromEntries(children.map((child) => [child.data.Id, child]));
        // For each child with spouses, create the links to their spouses
        children.forEach((child) => {
            // Only 2 types should occur here: "descendant" and "descendant-spouse"
            // We always create the spousal link based on the descendant
            if (child.data.type === "descendant" && child.data.Spouses.length > 0) {
                // The spouse, as a fake descendant, is part of the child map
                child.data.Spouses.map((spouse, i) => ({
                    spouseNode: childMap[spouse.Id],
                    spouseDto: spouse,
                    i,
                }))
                    // However, due to distance selection for the query, it may not be actually part of the DTO
                    .filter((spouse) => spouse != null && spouse.spouseNode != null)
                    .forEach(({ spouseNode, spouseDto, i }) => {
                        // Consider the nodes in between as visualization aid, same as in {@link createSpouseLinks}
                        links.push({
                            source: spouseNode,
                            target: child,
                            data: { type: "spouse", nodesInBetween: i, ...spouseDto },
                        });
                    });
            }
        });
    }

    // Reverse the link elements to ensure the right rendering order
    return links.reverse();
}

// Manually create links for the spouses of ancestors, that is, pairs of parents
export function createAncestorSpouseLink(
    rootNode: d3.HierarchyPointNode<PersonNode>,
): MinHierarchyLink<PersonNode>[] {
    const links: MinHierarchyLink<PersonNode, SpouseLink>[] = [];

    // Work through the tree using BFS
    const queue: d3.HierarchyPointNode<PersonNode>[] = [rootNode];
    while (queue.length > 0) {
        const node = queue.shift();

        const parents = node!.children ?? [];
        queue.push(...parents);

        // Map the parents by id for easy access
        // Will at most be 2 nodes
        const parentMap = Object.fromEntries(parents.map((parent) => [parent.data.Id, parent]));
        // Additionally, keep track of which IDs have already been paired to prevent double links,
        // one in each direction
        const alreadyPaired: Record<string, boolean> = {};
        parents.forEach((parent) => {
            // As a person may at most have 2 parents, thus we can simply select the first mapped spouse,
            // which is either the other parent, if married, or an empty fallback object
            const { spouseNode, spouseDto } = [
                ...parent.data.Spouses.map((spouse) => ({
                    spouseNode: parentMap[spouse.Id],
                    spouseDto: spouse,
                }))
                    // Ensure that the spousal partner is the other parent and wasn't already used as a basis for a link
                    .filter(
                        (spouse) =>
                            spouse != null &&
                            spouse.spouseNode != null &&
                            !alreadyPaired[spouse.spouseDto.Id],
                    ),
                {},
            ][0];
            // If we got the other parent, add a link
            if (spouseNode != null) {
                links.push({
                    source: spouseNode,
                    target: parent,
                    data: { type: "spouse", ...spouseDto },
                });
                // Remember that we already mapped the parent, so it can't be the target or source
                // for a spousal link anymore
                alreadyPaired[parent.data.Id] = true;
            }
        });
    }

    return links;
}

// Calculate the total bounds of the graph, given all nodes with calculated positions and the size of the viewing port
export function calculateBounds(
    nodes: MinHierarchyNode<PersonNode>[],
    width: number,
    height: number,
): [[number, number], [number, number]] {
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;

    nodes.forEach((d) => {
        if (d.x! < x0) x0 = d.x!;
        if (d.y! < y0) y0 = d.y!;
        if (d.x! > x1) x1 = d.x!;
        if (d.y! > y1) y1 = d.y!;
    });

    // Add some tolerance to the bounds, so the view is not constrained too strictly
    x0 -= width / 2;
    y0 -= height * 0.75;
    x1 += width / 2;
    y1 += height * 0.75;

    return [
        [x0, y0],
        [x1, y1],
    ];
}
