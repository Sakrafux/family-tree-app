import * as d3 from "d3-hierarchy";
import type { Selection } from "d3-selection";
import type { RefObject } from "react";

import { LAYOUT_HEIGHT } from "@/components/FamilyTree/FamilyTree";
import type { PersonNode } from "@/components/FamilyTree/FamilyTree.service";

export type OnNodeClickFn = (event: any, d: d3.HierarchyPointNode<PersonNode>) => void;

export function updateGraph(
    container: Selection<SVGGElement, any, any, any>,
    descendantNodes: d3.HierarchyPointNode<PersonNode>,
    ancestorNodes: d3.HierarchyPointNode<PersonNode>,
    onNodeClick: RefObject<OnNodeClickFn>,
) {
    let linkContainer = container.select<SVGGElement>(".link-container");
    if (linkContainer.empty()) {
        linkContainer = container.append("g").attr("class", "link-container");
    }
    let nodeContainer = container.select<SVGGElement>(".node-container");
    if (nodeContainer.empty()) {
        nodeContainer = container.append("g").attr("class", "node-container");
    }

    createLines(linkContainer, [...descendantNodes.links(), ...ancestorNodes.links()]);

    // TODO somehow display sibling and spouse nodes as well
    createNodes(
        nodeContainer,
        [...descendantNodes.descendants(), ...ancestorNodes.descendants().slice(1)],
        onNodeClick,
    );
}

function createLines(
    container: Selection<SVGGElement, any, any, any>,
    data: d3.HierarchyPointLink<PersonNode>[],
) {
    const links = container
        .selectAll<SVGPolylineElement, d3.HierarchyPointLink<PersonNode>>(".link")
        .data(data, (d) => d.target.data.Id);

    links.exit().transition().duration(500).style("opacity", 0).remove();

    const link = links
        .enter()
        .append("polyline")
        .attr("class", (d) => `link link-${d.target.data.type}`)
        .attr("points", calculatePoints)
        .attr("fill", "none")
        .attr("stroke", "#ccc")
        .attr("stroke-width", 2)
        .attr("opacity", 0);

    link.merge(links)
        .transition()
        .duration(500)
        .style("opacity", 1)
        .attr("class", (d) => `link link-${d.target.data.type}`)
        .attr("points", calculatePoints);
}

function calculatePoints(d: d3.HierarchyPointLink<PersonNode>): string {
    const directionMult = d.target.data.type === "ancestor" ? -1 : 1;
    const sx = d.source.x;
    const sy = d.source.y;
    const tx = d.target.x;
    const ty = d.target.y;
    const tyHalf = d.target.y - (LAYOUT_HEIGHT / 2) * directionMult;
    return `${sx},${sy} ${sx},${tyHalf} ${tx},${tyHalf} ${tx},${ty}`;
}

const NODE_WIDTH = 300;
const NODE_HEIGHT = 100;
const NODE_WIDTH_HALF = NODE_WIDTH / 2;
const NODE_HEIGHT_HALF = NODE_HEIGHT / 2;

function createNodes(
    container: Selection<SVGGElement, any, any, any>,
    data: d3.HierarchyPointNode<PersonNode>[],
    onNodeClick: RefObject<OnNodeClickFn>,
) {
    const nodes = container
        .selectAll<SVGGElement, d3.HierarchyPointNode<PersonNode>>(".node")
        .data(data, (d) => d.data.Id);

    nodes.exit().transition().duration(500).style("opacity", 0).remove();

    const node = nodes
        .enter()
        .append("g")
        .attr("class", (d) => `node node-${d.data.type}`)
        .attr("transform", (d) => `translate(${d.x},${d.y})`)
        .attr("opacity", 0);

    node.merge(nodes)
        .transition()
        .duration(500)
        .style("opacity", 1)
        .attr("class", (d) => `node node-${d.data.type}`)
        .attr("transform", (d) => `translate(${d.x},${d.y})`);

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
        .attr("stroke-width", 8)
        .on("click", (event, d) => onNodeClick.current(event, d));

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
