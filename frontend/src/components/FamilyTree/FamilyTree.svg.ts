import { select, type Selection } from "d3-selection";
import type { RefObject } from "react";

import { LAYOUT_HEIGHT, LAYOUT_WIDTH } from "@/components/FamilyTree/FamilyTree";
import type {
    MinHierarchyLink,
    MinHierarchyNode,
    PersonNode,
    SpouseLink,
} from "@/components/FamilyTree/FamilyTree.service";

export const TRANSITION_DURATION = 500;

const NODE_WIDTH = 300;
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
    // Create containers for links and nodes to ensure nodes are always rendered after links
    // Thus, the order of creation is important
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
        // Select all the groups that contain all the elements necessary for a link...
        .selectAll<SVGGElement, MinHierarchyLink<PersonNode>>(".link")
        // ...then bind it to the data using an ID function
        .data(data, combineIdsOfLink);
    // The selection binding results in 3 kinds of results based on whether their ID is bound to a DOM element:
    // - previously bound, now unbound -> data was removed and must now exit and be removed from DOM
    // - previously bound, now bound   -> data was updated and must merge new data with existing DOM element
    // - previously unbound, now bound -> data was added and must enter as new DOM element

    // All now unbound elements must exit and be removed, with optional transition styling
    links.exit().transition().duration(TRANSITION_DURATION).style("opacity", 0).remove();

    // All newly bound elements must be added to the DOM
    const link = links
        .enter()
        .append("g")
        .attr("class", (d) => `link ${d.target.data.type} ${d.data?.type ?? ""}`)
        // We start them out as invisible
        .attr("opacity", 0);

    // Now update the data of all links, whether already existing or newly created
    // This also means that newly created links are immediately updated with the same information again,
    // which isn't an issue
    const linkMerge = link
        .merge(links)
        // Use a nice fade-in transition by changing the opacity from 0 to 1
        .transition()
        .duration(TRANSITION_DURATION)
        // The classes are determined by the data and may have changed due to the update
        .attr("class", (d) => `link ${d.target.data.type} ${d.data?.type ?? ""}`)
        // Make them fully visible
        .style("opacity", 1);

    // The issue is that only "links" get updated so far, which means that if the link group already exists
    // it gets formally updated, but the elements within already existed and aren't changed
    // Thus, we need to do the same change-aware data binding for each group
    linkMerge.each(function (datum) {
        // We need to select the current element, which is why the `function` keyword is crucial, as
        // it allows access to `this` which is bound to the current element
        // Arrow-functions are not possible for this purpose
        const g = select(this);

        // Same as before, we need to select all the <polyline> elements (though it will only ever be one)
        // and bind it to a single data element
        // This needs to be done for each kind of different element we want to create
        const lines = g
            .selectAll<SVGPolylineElement, MinHierarchyLink<PersonNode>>("polyline")
            .data([datum], combineIdsOfLink);

        // This transition is unlikely to fire due to the semantics of our data, which would mean
        // the whole group should be removed anyway in this case, but is still here as a fallback
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

        // Same as for "lines"
        const textGroups = g
            .selectAll<SVGGElement, MinHierarchyLink<PersonNode, SpouseLink>>("g")
            .data<MinHierarchyLink<PersonNode, SpouseLink>>([datum], combineIdsOfLink);

        textGroups.exit().remove();

        const textGroup = textGroups
            .enter()
            .append("g")
            .attr("class", (d) => `link-texts ${d.data?.type ?? ""}`)
            // Despite this being immediately updated in the merge, we want to set the initial position
            // or else the groups would transition from the default 0,0 position
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

        // The <text> elements within this <g> are not independently styled or updated and thus can
        // be simply appended

        // Start date of marriage
        textGroup
            .filter((d) => d.data?.type === "spouse")
            .append("text")
            .attr("class", "date")
            .attr("x", 0)
            .attr("y", -25)
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
            .text((d) => generateLinkDateString(d, "Since"));

        // End date of marriage
        textGroup
            .filter((d) => d.data?.type === "spouse")
            .append("text")
            .attr("class", "date")
            .attr("x", 0)
            .attr("y", 25)
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
            .text((d) => generateLinkDateString(d, "Until"));

        // Marriage symbol underlay to aid in visibility (blocking out the <polyline>)
        textGroup
            .filter((d) => d.data?.type === "spouse")
            .append("rect")
            .attr("x", -20)
            .attr("y", -15)
            .attr("width", 45)
            .attr("height", 30)
            .attr("fill", "#ffffff");
        // Marriage symbol
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

// A simple helper function to properly identify a link by its component ids
function combineIdsOfLink(d: MinHierarchyLink<PersonNode>) {
    // We sort the ids to ensure the combined id is the same regardless of which direction a link
    // is constructed from
    return [d.source.data.Id, d.target.data.Id].sort().join("|");
}

// Calculate the points of a <polyline> so it has a nice, angled design
function calculatePoints(d: MinHierarchyLink<PersonNode>): string {
    // Whether it is an ancestor or descendant has an impact of how to form the line
    const directionMult = d.target.data.type === "ancestor" ? -1 : 1;
    const sx = d.source.x;
    const sy = d.source.y;
    const tx = d.target.x;
    const ty = d.target.y;
    const tyHalf = d.target.y - (LAYOUT_HEIGHT / 2) * directionMult;

    switch (d.data?.type) {
        case "spouse": {
            // Spousal links are direct and implicitly horizontal
            return `${sx},${sy} ${tx},${ty}`;
        }
        default:
            switch (d.target.data.type) {
                case "descendant-spouse":
                    // We need to visually ignore links to the spouses of descendants, i.e. fake descendants
                    return "";
                default:
                    // Construct the angled line
                    return `${sx},${sy} ${sx},${tyHalf} ${tx},${tyHalf} ${tx},${ty}`;
            }
    }
}

// Helper function to generate a date string from partial data
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

// Same concepts apply as documented in {@link createLines} for different elements
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

    // Most elements of the node are not updated independently of the group and are thus directly appended

    // Node background
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
        // Callback that should load a new family tree based on the clicked node as root
        .on("click", (event, d) => onNodeClick.current(event, d));

    // Death symbol
    node.append("text")
        .attr("x", 20 - NODE_WIDTH_HALF)
        .attr("y", 25 - NODE_HEIGHT_HALF)
        .attr("text-anchor", "start")
        .attr("dominant-baseline", "middle")
        .attr("font-size", "24")
        .attr("font-weight", "bold")
        .text((d) => (d.data.IsDead === true ? "†" : d.data.IsDead == null ? "?" : ""));

    // Name
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

    // Birthday label
    node.append("text")
        .attr("x", 20 - NODE_WIDTH_HALF)
        .attr("y", 50 - NODE_HEIGHT_HALF)
        .attr("text-anchor", "start")
        .attr("dominant-baseline", "text-before-edge")
        .text("Geburtstag:")
        // Birthday content
        .clone()
        .attr("dx", 100)
        .attr("dy", 1)
        .attr("class", "date")
        .text((d) => generateNodeDateString(d, "Birth"));

    // Deathday label
    node.append("text")
        .attr("x", 20 - NODE_WIDTH_HALF)
        .attr("y", 70 - NODE_HEIGHT_HALF)
        .attr("text-anchor", "start")
        .attr("dominant-baseline", "text-before-edge")
        .text((d) => (d.data.IsDead ? "Todestag:" : ""))
        // Deathday content
        .clone()
        .attr("dx", 100)
        .attr("dy", 1)
        .attr("class", "date")
        .text((d) => (d.data.IsDead ? generateNodeDateString(d, "Death") : ""));

    // The sibling indicator is updated independently of the group and must thus be handled separately
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
                    // Depending on the semantics of the node, the indicator should by rendered to the left or right
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

            // Transparent rectangle to serve as clickable element for the symbol
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

            // Chevron as indicator symbol
            siblingGroup
                .append("path")
                .attr("d", "M60 16 28 48 60 80")
                .attr("stroke-linecap", "round")
                .attr("stroke-linejoin", "round")
                .attr("fill", "none")
                .attr("stroke", "#616161")
                .attr("stroke-width", 4);

            // Number of siblings
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

// Helper function to generate a full name (including age) from partial data
function generateFullName(node: MinHierarchyNode<PersonNode>) {
    const age = node.data.Age != null ? ` (${node.data.Age})` : "";
    const firstName = node.data.FirstName ? `${node.data.FirstName} ` : "";
    const lastName = node.data.LastName ?? "";
    return `${firstName}${lastName}${age}`;
}

// Helper function to generate the correct CSS class for nullable IsDead data
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

// Helper function to generate a date string from partial data
function generateNodeDateString(node: MinHierarchyNode<PersonNode>, prefix: "Birth" | "Death") {
    const day = node.data[`${prefix}DateDay` as keyof PersonNode];
    const month = node.data[`${prefix}DateMonth` as keyof PersonNode];
    const year = node.data[`${prefix}DateYear` as keyof PersonNode];

    const dayStr = day ? day.toString().padStart(2, "0") : "??";
    const monthStr = month ? month.toString().padStart(2, "0") : "??";
    const yearStr = year ? year.toString().padStart(4, "0") : "????";

    return `${dayStr}.${monthStr}.${yearStr}`;
}
