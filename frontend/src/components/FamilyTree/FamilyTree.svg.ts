import { select, type Selection } from "d3-selection";
import type { RefObject } from "react";

import { LAYOUT_HEIGHT, LAYOUT_WIDTH } from "@/components/FamilyTree/FamilyTree";
import type {
    MinHierarchyLink,
    MinHierarchyNode,
    PersonNode,
    SpouseLink,
} from "@/components/FamilyTree/FamilyTree.service";

export type OnNodeClickFn = (event: any, d: MinHierarchyNode<PersonNode>) => void;

export function updateGraph(
    container: Selection<SVGGElement, any, any, any>,
    nodes: MinHierarchyNode<PersonNode>[],
    links: MinHierarchyLink<PersonNode>[],
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

    createLines(linkContainer, links);
    createNodes(nodeContainer, nodes, onNodeClick);
}

function createLines(
    container: Selection<SVGGElement, any, any, any>,
    data: MinHierarchyLink<PersonNode>[],
) {
    const links = container
        .selectAll<SVGGElement, MinHierarchyLink<PersonNode>>(".link")
        .data(data, combineIdsOfLink);

    links.exit().transition().duration(500).style("opacity", 0).remove();

    const link = links
        .enter()
        .append("g")
        .attr("class", (d) => `link ${d.target.data.type} ${d.data?.type ?? ""}`)
        .attr("opacity", 0);

    const linkMerge = link
        .merge(links)
        .transition()
        .duration(500)
        .style("opacity", 1)
        .attr("class", (d) => `link ${d.target.data.type} ${d.data?.type ?? ""}`);

    linkMerge.each(function (datum) {
        const g = select(this);

        const lines = g
            .selectAll<SVGPolylineElement, MinHierarchyLink<PersonNode>>("polyline")
            .data([datum], combineIdsOfLink);

        lines.exit().transition().duration(500).style("opacity", 0).remove();

        const line = lines
            .enter()
            .append("polyline")
            .attr("class", (d) => `link ${d.target.data.type} ${d.data?.type ?? ""}`)
            .attr("opacity", 0)
            .attr("points", calculatePoints)
            .attr("fill", "none")
            .attr("stroke", "#858585")
            .attr("stroke-width", 3)
            .attr("stroke-dasharray", (d) => (d.data?.type === "spouse" ? "1,3" : ""));

        line.merge(lines)
            .transition()
            .duration(500)
            .style("opacity", 1)
            .attr("class", (d) => `link ${d.target.data.type} ${d.data?.type ?? ""}`)
            .attr("points", calculatePoints)
            .attr("stroke-dasharray", (d) => (d.data?.type === "spouse" ? "1,3" : ""));

        const textsSince = g
            .selectAll<SVGTextElement, MinHierarchyLink<PersonNode, SpouseLink>>("text.since")
            .data<MinHierarchyLink<PersonNode, SpouseLink>>([datum], combineIdsOfLink);

        textsSince.exit().remove();

        const textSince = textsSince
            .enter()
            .append("text")
            .attr("class", "date since")
            .attr("x", (d) => {
                let shiftRight = 0;
                if (d.target.data.type === "root-spouse") {
                    shiftRight = (d.data?.nodesInBetween ?? 0) * LAYOUT_WIDTH;
                }
                return (d.source.x + d.target.x + shiftRight) / 2;
            })
            .attr("y", (d) => (d.source.y + d.target.y) / 2 - 15)
            .style("opacity", 0)
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
            .text((d) => generateLinkDateString(d, "Since"));

        textSince
            .merge(textsSince)
            .transition()
            .duration(500)
            .style("opacity", 1)
            .attr("x", (d) => {
                let shiftRight = 0;
                if (d.data?.type === "spouse") {
                    shiftRight = (d.data?.nodesInBetween ?? 0) * LAYOUT_WIDTH;
                }
                return (d.source.x + d.target.x + shiftRight) / 2;
            })
            .attr("y", (d) => (d.source.y + d.target.y) / 2 - 15)
            .text((d) => generateLinkDateString(d, "Since"));

        const textsUntil = g
            .selectAll<SVGTextElement, MinHierarchyLink<PersonNode, SpouseLink>>("text.until")
            .data<MinHierarchyLink<PersonNode, SpouseLink>>([datum], combineIdsOfLink);

        textsUntil.exit().remove();

        const textUntil = textsUntil
            .enter()
            .append("text")
            .attr("class", "date until")
            .attr("x", (d) => (d.source.x + d.target.x) / 2)
            .attr("y", (d) => (d.source.y + d.target.y) / 2 + 15)
            .style("opacity", 0)
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
            .text((d) => generateLinkDateString(d, "Until"));

        textUntil
            .merge(textsUntil)
            .transition()
            .duration(500)
            .style("opacity", 1)
            .attr("x", (d) => (d.source.x + d.target.x) / 2)
            .attr("y", (d) => (d.source.y + d.target.y) / 2 + 15)
            .text((d) => generateLinkDateString(d, "Until"));
    });
}

function combineIdsOfLink(d: MinHierarchyLink<PersonNode>) {
    return [d.source.data.Id, d.target.data.Id].sort().join("|");
}

function calculatePoints(d: MinHierarchyLink<PersonNode>): string {
    const directionMult = d.target.data.type === "ancestor" ? -1 : 1;
    const sx = d.source.x;
    const sy = d.source.y;
    const tx = d.target.x;
    const ty = d.target.y;
    const tyHalf = d.target.y - (LAYOUT_HEIGHT / 2) * directionMult;

    switch (d.data?.type) {
        case "spouse": {
            return `${sx},${sy} ${tx},${ty}`;
        }
        default:
            switch (d.target.data.type) {
                case "descendant-spouse":
                    return "";
                default:
                    return `${sx},${sy} ${sx},${tyHalf} ${tx},${tyHalf} ${tx},${ty}`;
            }
    }
}

function generateLinkDateString(
    link: MinHierarchyLink<PersonNode, SpouseLink>,
    prefix: "Since" | "Until",
) {
    const day = link.data?.[`${prefix}Day` as keyof SpouseLink];
    const month = link.data?.[`${prefix}Month` as keyof SpouseLink];
    const year = link.data?.[`${prefix}Year` as keyof SpouseLink];

    if (!day && !month && !year) {
        return "";
    }

    const dayStr = day ? day.toString().padStart(2, "0") : "??";
    const monthStr = month ? month.toString().padStart(2, "0") : "??";
    const yearStr = year ? year.toString().padStart(4, "0") : "????";

    return `${dayStr}.${monthStr}.${yearStr}`;
}

const NODE_WIDTH = 250;
const NODE_HEIGHT = 105;
const NODE_WIDTH_HALF = NODE_WIDTH / 2;
const NODE_HEIGHT_HALF = NODE_HEIGHT / 2;

function createNodes(
    container: Selection<SVGGElement, any, any, any>,
    data: MinHierarchyNode<PersonNode>[],
    onNodeClick: RefObject<OnNodeClickFn>,
) {
    const nodes = container
        .selectAll<SVGGElement, MinHierarchyNode<PersonNode>>(".node")
        .data(data, (d) => d.data.Id);

    nodes.exit().transition().duration(500).style("opacity", 0).remove();

    const node = nodes
        .enter()
        .append("g")
        .attr("class", (d) => `node ${d.data.type} ${getClassIsDead(d)}`)
        .attr("transform", (d) => `translate(${d.x},${d.y})`)
        .attr("opacity", 0);

    node.merge(nodes)
        .transition()
        .duration(500)
        .style("opacity", 1)
        .attr("class", (d) => `node ${d.data.type} ${getClassIsDead(d)}`)
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
                    return "#A9C7EE";
                case "f":
                    return "#F69697";
                default:
                    return "#f1cd86";
            }
        })
        .on("click", (event, d) => onNodeClick.current(event, d));

    node.append("text")
        .attr("x", 0)
        .attr("y", 20 - NODE_HEIGHT_HALF)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .text((d) => `${d.data?.FirstName ?? ""} ${d.data?.LastName ?? ""}`)
        .clone()
        .attr("dy", 18)
        .text((d) =>
            d.data.LastName !== d.data.BirthName ? `geb. ${d.data?.BirthName ?? "???"}` : "",
        );

    node.append("text")
        .attr("x", 20 - NODE_WIDTH_HALF)
        .attr("y", 50 - NODE_HEIGHT_HALF)
        .attr("text-anchor", "start")
        .attr("dominant-baseline", "text-before-edge")
        .text("Geburtstag:");
    node.append("text")
        .attr("x", 130 - NODE_WIDTH_HALF)
        .attr("y", 51 - NODE_HEIGHT_HALF)
        .attr("class", "date")
        .attr("text-anchor", "start")
        .attr("dominant-baseline", "text-before-edge")
        .text((d) => generateNodeDateString(d, "Birth"));

    node.append("text")
        .attr("x", 20 - NODE_WIDTH_HALF)
        .attr("y", 70 - NODE_HEIGHT_HALF)
        .attr("text-anchor", "start")
        .attr("dominant-baseline", "text-before-edge")
        .text((d) => (d.data.IsDead ? "Todestag:" : ""));
    node.append("text")
        .attr("x", 130 - NODE_WIDTH_HALF)
        .attr("y", 71 - NODE_HEIGHT_HALF)
        .attr("class", "date")
        .attr("text-anchor", "start")
        .attr("dominant-baseline", "text-before-edge")
        .text((d) => (d.data.IsDead ? generateNodeDateString(d, "Death") : ""));
}

function getClassIsDead(node: MinHierarchyNode<PersonNode>) {
    switch (node.data.IsDead) {
        case false:
            return "alive";
        case true:
            return "dead";
        default:
            return "alive-dead-unknown";
    }
}

function generateNodeDateString(node: MinHierarchyNode<PersonNode>, prefix: "Birth" | "Death") {
    const day = node.data[`${prefix}DateDay` as keyof PersonNode];
    const month = node.data[`${prefix}DateMonth` as keyof PersonNode];
    const year = node.data[`${prefix}DateYear` as keyof PersonNode];

    const dayStr = day ? day.toString().padStart(2, "0") : "??";
    const monthStr = month ? month.toString().padStart(2, "0") : "??";
    const yearStr = year ? year.toString().padStart(4, "0") : "????";

    return `${dayStr}.${monthStr}.${yearStr}`;
}
