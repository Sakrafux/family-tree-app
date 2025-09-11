import type { Selection } from "d3-selection";
import * as d3 from "d3-hierarchy";
import type { PersonNode } from "@/components/FamilyTree/FamilyTree.service.ts";
import { LAYOUT_HEIGHT } from "@/components/FamilyTree/FamilyTree.tsx";

export function fillGraph(
    container: Selection<SVGGElement, any, any, any>,
    descendantNodes: d3.HierarchyPointNode<PersonNode>,
    ancestorNodes: d3.HierarchyPointNode<PersonNode>,
    onNodeClick: (event: any, d: d3.HierarchyPointNode<PersonNode>) => void,
) {
    createLines(container, descendantNodes.links(), false, "link-descendant");
    createLines(container, ancestorNodes.links(), true, "link-ancestor");

    // TODO somehow display sibling and spouse nodes as well
    createNodes(
        container,
        descendantNodes.descendants().slice(0, 1),
        false,
        "node-root",
        () => {},
    );
    createNodes(
        container,
        descendantNodes.descendants().slice(1),
        false,
        "node-descendant",
        onNodeClick,
    );
    createNodes(
        container,
        ancestorNodes.descendants().slice(1),
        true,
        "node-ancestor",
        onNodeClick,
    );
}

function createLines(
    container: Selection<SVGGElement, any, any, any>,
    links: d3.HierarchyPointLink<PersonNode>[],
    inverted: boolean,
    className: string,
) {
    const directionMult = inverted ? -1 : 1;

    const calculatePoints = (d: d3.HierarchyPointLink<PersonNode>): string => {
        const sx = d.source.x;
        const sy = d.source.y * directionMult;
        const tx = d.target.x;
        const ty = d.target.y * directionMult;
        const tyHalf = (d.target.y - LAYOUT_HEIGHT / 2) * directionMult;
        return `${sx},${sy} ${sx},${tyHalf} ${tx},${tyHalf} ${tx},${ty}`;
    };

    container
        .append("g")
        .selectAll("polyline")
        .data(links)
        .enter()
        .append("polyline")
        .attr("class", className)
        .attr("points", calculatePoints)
        .attr("fill", "none")
        .attr("stroke", "#ccc")
        .attr("stroke-width", 2);
}

const NODE_WIDTH = 300;
const NODE_HEIGHT = 100;
const NODE_WIDTH_HALF = NODE_WIDTH / 2;
const NODE_HEIGHT_HALF = NODE_HEIGHT / 2;

function createNodes(
    container: Selection<SVGGElement, any, any, any>,
    data: d3.HierarchyPointNode<PersonNode>[],
    inverted: boolean,
    className: string,
    onNodeClick: (event: any, d: d3.HierarchyPointNode<PersonNode>) => void,
) {
    const node = container
        .append("g")
        .selectAll("g")
        .data(data)
        .enter()
        .append("g")
        .attr("class", `node ${className}`)
        .attr("transform", (d) => `translate(${d.x},${inverted ? -d.y : d.y})`);

    node.append("rect")
        .attr("x", -NODE_WIDTH_HALF)
        .attr("y", -NODE_HEIGHT_HALF)
        .attr("width", NODE_WIDTH)
        .attr("height", NODE_HEIGHT)
        .attr("rx", 10)
        .attr("ry", 10)
        .attr("fill", (d) => {
            switch (d.data.Gender) {
                case "m":
                    return "#5A7FBF";
                case "f":
                    return "#D94F70";
                default:
                    return "#E0B75C";
            }
        })
        .attr("stroke", (d) => {
            switch (d.data.IsDead) {
                case false:
                    return "#66BB6A";
                case true:
                    return "#6E4B3A";
                default:
                    return "#A0A0A0";
            }
        })
        .attr("stroke-width", 4)
        .on("click", onNodeClick);

    node.append("text")
        .attr("x", 150 - NODE_WIDTH_HALF)
        .attr("y", 20 - NODE_HEIGHT_HALF)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .text((d) => `${d.data?.FirstName ?? ""} ${d.data?.LastName ?? ""}`);

    node.append("text")
        .attr("x", 20 - NODE_WIDTH_HALF)
        .attr("y", 45 - NODE_HEIGHT_HALF)
        .attr("text-anchor", "start")
        .attr("dominant-baseline", "text-before-edge")
        .text("Birthdate:");
    node.append("text")
        .attr("x", 120 - NODE_WIDTH_HALF)
        .attr("y", 45 - NODE_HEIGHT_HALF)
        .attr("text-anchor", "start")
        .attr("dominant-baseline", "text-before-edge")
        .text(
            (d) =>
                `${d.data?.BirthDateDay ?? "??"}.${d.data?.BirthDateMonth ?? "??"}.${d.data?.BirthDateYear ?? "????"}`,
        );

    node.append("text")
        .attr("x", 20 - NODE_WIDTH_HALF)
        .attr("y", 65 - NODE_HEIGHT_HALF)
        .attr("text-anchor", "start")
        .attr("dominant-baseline", "text-before-edge")
        .text((d) => (d.data.IsDead ? "Deathdate:" : ""));
    node.append("text")
        .attr("x", 120 - NODE_WIDTH_HALF)
        .attr("y", 65 - NODE_HEIGHT_HALF)
        .attr("text-anchor", "start")
        .attr("dominant-baseline", "text-before-edge")
        .text((d) =>
            d.data.IsDead
                ? `${d.data?.DeathDateDay ?? "??"}.${d.data?.DeathDateMonth ?? "??"}.${d.data?.DeathDateYear ?? "????"}`
                : "",
        );
}
