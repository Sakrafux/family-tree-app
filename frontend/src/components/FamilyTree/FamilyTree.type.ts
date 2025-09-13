// Node data from DTO enriched with additional semantic type information
import type { PersonDto, SpouseDto } from "@/types/dto";

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

export type OnNodeClickFn = (event: any, d: MinHierarchyNode<PersonNode>) => void;
