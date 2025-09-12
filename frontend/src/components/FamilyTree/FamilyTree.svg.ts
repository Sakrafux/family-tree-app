import { select, type Selection } from "d3-selection";
import type { RefObject } from "react";

import { LAYOUT_HEIGHT, LAYOUT_WIDTH } from "@/components/FamilyTree/FamilyTree";
import type {
    MinHierarchyLink,
    MinHierarchyNode,
    PersonNode,
    SpouseLink,
} from "@/components/FamilyTree/FamilyTree.service";

const TRANSITION_DURATION = 500;

const NODE_WIDTH = 250;
const NODE_HEIGHT = 105;
const NODE_WIDTH_HALF = NODE_WIDTH / 2;
const NODE_HEIGHT_HALF = NODE_HEIGHT / 2;

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

    links.exit().transition().duration(TRANSITION_DURATION).style("opacity", 0).remove();

    const link = links
        .enter()
        .append("g")
        .attr("class", (d) => `link ${d.target.data.type} ${d.data?.type ?? ""}`)
        .attr("opacity", 0);

    const linkMerge = link
        .merge(links)
        .transition()
        .duration(TRANSITION_DURATION)
        .style("opacity", 1)
        .attr("class", (d) => `link ${d.target.data.type} ${d.data?.type ?? ""}`);

    linkMerge.each(function (datum) {
        const g = select(this);

        const lines = g
            .selectAll<SVGPolylineElement, MinHierarchyLink<PersonNode>>("polyline")
            .data([datum], combineIdsOfLink);

        lines.exit().transition().duration(TRANSITION_DURATION).style("opacity", 0).remove();

        const line = lines
            .enter()
            .append("polyline")
            .attr("class", (d) => `link-line ${d.data?.type ?? ""}`)
            .attr("opacity", 0)
            .attr("points", calculatePoints)
            .attr("fill", "none")
            .attr("stroke", "#858585")
            .attr("stroke-width", 3)
            .attr("stroke-dasharray", (d) => (d.data?.type === "spouse" ? "1,3" : ""));

        line.merge(lines)
            .transition()
            .duration(TRANSITION_DURATION)
            .style("opacity", 1)
            .attr("class", (d) => `link-line ${d.data?.type ?? ""}`)
            .attr("points", calculatePoints)
            .attr("stroke-dasharray", (d) => (d.data?.type === "spouse" ? "1,3" : ""));

        const textGroups = g
            .selectAll<SVGGElement, MinHierarchyLink<PersonNode, SpouseLink>>("g")
            .data<MinHierarchyLink<PersonNode, SpouseLink>>([datum], combineIdsOfLink);

        textGroups.exit().remove();

        const textGroup = textGroups
            .enter()
            .append("g")
            .attr("class", (d) => `link-texts ${d.data?.type ?? ""}`)
            .attr("transform", (d) => {
                let shiftRight = 0;
                if (d.data?.type === "spouse") {
                    shiftRight = (d.data?.nodesInBetween ?? 0) * LAYOUT_WIDTH;
                }
                const x = (d.source.x + d.target.x + shiftRight) / 2;
                const y = (d.source.y + d.target.y) / 2;
                return `translate(${x},${y})`;
            });

        textGroup
            .merge(textGroups)
            .transition()
            .duration(TRANSITION_DURATION)
            .attr("class", (d) => `link-texts ${d.data?.type ?? ""}`)
            .attr("transform", (d) => {
                let shiftRight = 0;
                if (d.data?.type === "spouse") {
                    shiftRight = (d.data?.nodesInBetween ?? 0) * LAYOUT_WIDTH;
                }
                const x = (d.source.x + d.target.x + shiftRight) / 2;
                const y = (d.source.y + d.target.y) / 2;
                return `translate(${x},${y})`;
            });

        textGroup
            .filter((d) => d.data?.type === "spouse")
            .append("text")
            .attr("class", "date")
            .attr("x", 0)
            .attr("y", -25)
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
            .text((d) => generateLinkDateString(d, "Since"));

        textGroup
            .filter((d) => d.data?.type === "spouse")
            .append("text")
            .attr("class", "date")
            .attr("x", 0)
            .attr("y", 25)
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
            .text((d) => generateLinkDateString(d, "Until"));

        textGroup
            .filter((d) => d.data?.type === "spouse")
            .append("rect")
            .attr("x", -20)
            .attr("y", -15)
            .attr("width", 45)
            .attr("height", 30)
            .attr("fill", "#ffffff");
        textGroup
            .filter((d) => d.data?.type === "spouse")
            .append("path")
            .attr("transform", "translate(-15,-20)")
            .attr(
                "d",
                "M10.855 30.867c2.451 0 4.708-.827 6.526-2.202 1.819 1.376 4.075 2.202 6.526 2.202 5.986 0 10.855-4.869 10.855-10.855 0-5.986-4.869-10.855-10.855-10.855-2.451 0-4.708.827-6.526 2.202-1.819-1.376-4.075-2.202-6.526-2.202C4.869 9.157 0 14.026 0 20.013 0 25.998 4.869 30.867 10.855 30.867zM17.382 15.626c.846 1.254 1.34 2.764 1.34 4.386s-.494 3.132-1.34 4.386c-.846-1.254-1.34-2.764-1.34-4.386S16.537 16.88 17.382 15.626zM23.909 12.146c4.338 0 7.867 3.529 7.867 7.867 0 4.338-3.529 7.866-7.867 7.866-1.627 0-3.14-.497-4.396-1.346 1.373-1.818 2.198-4.072 2.198-6.52s-.825-4.703-2.198-6.521C20.769 12.642 22.282 12.146 23.909 12.146zM10.855 12.146c1.627 0 3.14.497 4.396 1.346-1.373 1.818-2.198 4.072-2.198 6.521s.825 4.702 2.198 6.52c-1.256.849-2.769 1.346-4.396 1.346-4.338 0-7.867-3.529-7.867-7.866C2.988 15.675 6.517 12.146 10.855 12.146z",
            );
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

function createNodes(
    container: Selection<SVGGElement, any, any, any>,
    data: MinHierarchyNode<PersonNode>[],
    onNodeClick: RefObject<OnNodeClickFn>,
) {
    const nodes = container
        .selectAll<SVGGElement, MinHierarchyNode<PersonNode>>(".node")
        .data(data, (d) => d.data.Id);

    nodes.exit().transition().duration(TRANSITION_DURATION).style("opacity", 0).remove();

    const node = nodes
        .enter()
        .append("g")
        .attr("class", (d) => `node ${d.data.type} ${getClassIsDead(d)}`)
        .attr("transform", (d) => `translate(${d.x},${d.y})`)
        .attr("opacity", 0);

    const nodeMerge = node
        .merge(nodes)
        .transition()
        .duration(TRANSITION_DURATION)
        .style("opacity", 1)
        .attr("class", (d) => `node ${d.data.type} ${getClassIsDead(d)}`)
        .attr("transform", (d) => `translate(${d.x},${d.y})`);

    node.append("rect")
        .attr("x", -NODE_WIDTH_HALF)
        .attr("y", -NODE_HEIGHT_HALF)
        .attr("width", NODE_WIDTH)
        .attr("height", NODE_HEIGHT)
        .attr("rx", 20)
        .attr("ry", 20)
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
        .attr("x", 20 - NODE_WIDTH_HALF)
        .attr("y", 25 - NODE_HEIGHT_HALF)
        .attr("text-anchor", "start")
        .attr("dominant-baseline", "middle")
        .attr("font-size", "24")
        .attr("font-weight", "bold")
        .text((d) => (d.data.IsDead === true ? "†" : d.data.IsDead == null ? "?" : ""));

    node.append("text")
        .attr("x", 0)
        .attr("y", 20 - NODE_HEIGHT_HALF)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .text(generateFullName)
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

    nodeMerge
        .filter((d) => d.data.Siblings.length > 0)
        .each(function (datum) {
            const siblingGroups = select(this)
                .selectAll<SVGGElement, MinHierarchyNode<PersonNode>>("g.sibling-indicator")
                .data([datum], (d) => d.data.Id);

            siblingGroups.exit().transition().duration(TRANSITION_DURATION).remove();

            const siblingGroup = siblingGroups
                .enter()
                .append("g")
                .attr("class", "sibling-indicator")
                .attr("transform", (d) => {
                    let x = -30 - NODE_WIDTH_HALF;
                    if (d.data.Gender === "f" || d.data.type === "descendant-spouse") {
                        x = 30 + NODE_WIDTH_HALF;
                    }
                    const y = 0;
                    return `translate(${x},${y})`;
                })
                .attr("opacity", 0);

            siblingGroup
                .merge(siblingGroups)
                .transition()
                .duration(TRANSITION_DURATION)
                .attr(
                    "class",
                    (d) =>
                        `sibling-indicator ${d.data.Gender === "f" || ["root-spouse", "descendant-spouse"].includes(d.data.type) ? "right-indicator" : "left-indicator"}`,
                )
                .attr("transform", (d) => {
                    let x = -30 - NODE_WIDTH_HALF;
                    if (
                        d.data.Gender === "f" ||
                        ["root-spouse", "descendant-spouse"].includes(d.data.type)
                    ) {
                        x = 30 + NODE_WIDTH_HALF;
                    }
                    const y = 0;
                    return `translate(${x},${y})`;
                })
                .attr("opacity", (d) =>
                    ["ancestor", "root-spouse", "descendant-spouse"].includes(d.data.type) ? 1 : 0,
                );

            siblingGroup
                .append("rect")
                .attr("x", -60)
                .attr("y", -NODE_HEIGHT_HALF)
                .attr("width", 120)
                .attr("height", NODE_HEIGHT)
                .attr("rx", 20)
                .attr("ry", 20)
                .attr("fill", "rgba(0, 0, 0, 0)")
                .on("click", (event, d) => onNodeClick.current(event, d));

            siblingGroup
                .append("path")
                .attr("d", "M60 16 28 48 60 80")
                .attr("stroke-linecap", "round")
                .attr("stroke-linejoin", "round")
                .attr("fill", "none")
                .attr("stroke", "#616161")
                .attr("stroke-width", 4);

            siblingGroup
                .append("text")
                .attr("text-anchor", "middle")
                .attr("dominant-baseline", "middle")
                .attr("font-size", "24")
                .attr("font-weight", "bold")
                .attr("font-color", "#616161")
                .text((d) => d.data.Siblings.length);
        });
}

function generateFullName(node: MinHierarchyNode<PersonNode>) {
    const age = node.data.Age != null ? ` (${node.data.Age})` : "";
    const firstName = node.data.FirstName ? `${node.data.FirstName} ` : "";
    const lastName = node.data.LastName ?? "";
    return `${firstName}${lastName}${age}`;
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
